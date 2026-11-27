/* Uno personality layer — emotions, micro-expressions, emotion tags,
   sentiment reaction, Egyptian-Arabic quips, humor level.
   Sits on top of the full-body avatar:
     var p = UnoPersona.attach(unoAvatarApi, { humor: 'light', lang: 'ar' });
     p.speak('أهلاً [wave] نورت، تحب أوريك الحزمة؟');
     p.react('الطلب اتأخر ساعتين ومش عارف حاجة');   // reads sentiment, calms down
     p.quip('addToCart')                            // returns a line
     p.setHumor('playful')                          // off | light | playful
   Nothing here sends audio: the "sound-free cue" is the visual reaction only. */
(function () {
  'use strict';

  var QUIPS = {
    off: {
      greet: ['أهلاً بيك.', 'أهلاً، تحت أمرك.'],
      addToCart: ['تمت الإضافة للسلة.', 'الحاجة بقت في السلة.'],
      waiting: ['لحظة من فضلك.', 'بجهز ده حالاً.'],
      thanks: ['العفو.', 'تحت أمرك.'],
      idle: ['أنا هنا لو احتجت حاجة.'],
      error: ['حصلت مشكلة، هحاول تاني.'],
      thinking: ['بشوف البيانات.'],
      farewell: ['مع السلامة.']
    },
    light: {
      greet: ['أهلاً بيك! أنا أونو، تحت أمرك.', 'نورت! اسألني أي حاجة.'],
      addToCart: ['تمام، ضفته للسلة.', 'اتضاف. اختيار كويس.'],
      waiting: ['ثانية واحدة، بجيبلك اللي محتاجه.', 'لحظة، بشوف الطلب.'],
      thanks: ['العفو، ده شغلي.', 'تسلم، تحت أمرك في أي وقت.'],
      idle: ['لو محتاج حاجة أنا هنا.', 'بص على العروض لو تحب.'],
      error: ['حصلت مشكلة صغيرة، بجرب تاني.'],
      thinking: ['بفكر معاك.'],
      farewell: ['مع السلامة، يوم سعيد.']
    },
    playful: {
      greet: ['أهلاً بيك! أنا أونو، جاهز على طول ومش بزهق.', 'نورت المكان! أنا أونو، اسألني وأنا مش هتعب.'],
      addToCart: ['اتضاف! السلة بقت شيك.', 'تمام، ضفته. أنا شخصياً كنت هختاره.'],
      waiting: ['ثانية واحدة، بطارد الطلب ده.', 'لحظة، بدور على أحسن سعر ليك.'],
      thanks: ['العفو! أنا بتبسط لما تساعد.', 'تسلم! ده بيخليني شغال بضمير.'],
      idle: ['أنا واقف هنا، مش هتعب من الوقفة.', 'لو زهقت من التصفح، قولي وأنا أرشحلك.'],
      error: ['حصلت مشكلة، بس أنا مش هسيبها كده.'],
      thinking: ['بفكر... المخ شغال.'],
      farewell: ['مع السلامة! هتوحشني.']
    }
  };

  var TAGS = {
    laugh: { emote: 'laugh', ms: 1600, gesture: 'celebrate' },
    wink: { emote: 'wink', ms: 900 },
    smirk: { emote: 'smirk', ms: 1400 },
    surprise: { emote: 'surprise', ms: 1200 },
    sad: { emote: 'empathy', ms: 2200 },
    empathy: { emote: 'empathy', ms: 2200 },
    think: { emote: 'thinking', ms: 1800 },
    excited: { emote: 'excited', ms: 1600, gesture: 'celebrate' },
    sleepy: { emote: 'sleepy', ms: 2000 },
    happy: { emote: 'happy', ms: 1600 },
    proud: { emote: 'proud', ms: 1600, gesture: 'thumbsup' },
    wave: { gesture: 'wave' },
    nod: { gesture: 'nod' },
    shrug: { gesture: 'shrug' },
    thumb: { gesture: 'thumbsup' },
    point: { gesture: 'point' },
    confused: { emote: 'confused', ms: 1500 }
  };

  var NEG = ['مش راضي', 'زعلان', 'زعلانة', 'سيء', 'وحش', 'زفت', 'تأخير', 'متأخر', 'اتأخر', 'مش شغال', 'باظ', 'غلط', 'مش عاجبني', 'استنى كتير', 'مستني', 'مش عارف', 'مضايق', 'سيئة', 'مشكلة', 'شكوى', 'زحمة', 'غلطة'];
  var POS = ['شكرا', 'شكراً', 'تسلم', 'تمام', 'حبيبي', 'جميل', 'ممتاز', 'رائع', 'برافو', 'عظيم', 'تحفة', 'ظبط', 'كويس', 'أحسن'];
  var GREET = ['السلام', 'أهلا', 'أهلاً', 'هاي', 'صباح', 'مساء', 'ازيك', 'إزيك'];
  var THANKS = ['شكرا', 'شكراً', 'تسلم', 'متشكر'];

  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function has(text, list) { for (var i = 0; i < list.length; i++) if (text.indexOf(list[i]) !== -1) return true; return false; }

  function sentiment(text) {
    var t = String(text || '');
    var neg = has(t, NEG), pos = has(t, POS), greet = has(t, GREET), thanks = has(t, THANKS);
    var q = t.indexOf('?') !== -1 || t.indexOf('؟') !== -1;
    var label = neg ? 'annoyed' : thanks ? 'thanks' : pos ? 'happy' : greet ? 'greeting' : q ? 'question' : 'neutral';
    return { label: label, negative: neg, positive: pos, question: q };
  }

  function parse(text) {
    var raw = String(text || '');
    var cues = [], clean = raw, m;
    var re = /\[([a-zA-Z]+)\]/g;
    while ((m = re.exec(raw))) {
      var tag = m[1].toLowerCase();
      if (TAGS[tag]) cues.push({ tag: tag, at: m.index });
    }
    clean = raw.replace(/\[[a-zA-Z]+\]/g, ' ').replace(/\s+/g, ' ').trim();
    return { text: clean, cues: cues };
  }

  function attach(avatar, opts) {
    opts = opts || {};
    var humor = opts.humor || 'light';
    var recent = {};
    var speakingTimer = null, cueTimers = [], rafId = null, startAt = 0, dur = 0;
    var onDone = null;

    function quip(category) {
      var set = QUIPS[humor] || QUIPS.light;
      var list = set[category] || (QUIPS.light[category] || []);
      if (!list.length) return '';
      if (list.length === 1) return list[0];
      var last = recent[category];
      var line = pick(list);
      var guard = 0;
      while (line === last && guard++ < 6) line = pick(list);
      recent[category] = line;
      return line;
    }

    function clearTimers() {
      cueTimers.forEach(clearTimeout); cueTimers = [];
      clearTimeout(speakingTimer);
      if (rafId) cancelAnimationFrame(rafId);
      rafId = null;
    }

    /* Simulated lip-sync: no audio is played or analysed here. The mouth
       follows a syllable-ish envelope so the avatar reads as talking while
       the caller is still waiting on real audio. If real levels exist,
       avatar.setMouthLevel / linkAudio take over and this loop stands down. */
    function talkLoop() {
      var t = (performance.now() - startAt) / 1000;
      var env = 0.5 + 0.5 * Math.sin(t * 11.5) * Math.sin(t * 4.3 + 1.1);
      avatar.setMouthLevel(Math.max(0, env * 0.85));
      if (performance.now() - startAt < dur) rafId = requestAnimationFrame(talkLoop);
      else { avatar.setMouthLevel(0); rafId = null; }
    }

    function speak(text, o) {
      o = o || {};
      var parsed = parse(text);
      clearTimers();
      avatar.setState('speaking');
      dur = o.duration || Math.min(9000, Math.max(900, parsed.text.length * 62));
      startAt = performance.now();
      talkLoop();

      // emotion tags fire at their place in the sentence
      parsed.cues.forEach(function (c) {
        var cfg = TAGS[c.tag];
        var at = Math.round((c.at / Math.max(1, String(text).length)) * dur);
        cueTimers.push(setTimeout(function () {
          if (cfg.emote) avatar.emote(cfg.emote, cfg.ms);
          if (cfg.gesture) avatar.gesture(cfg.gesture);
        }, at));
      });

      // automatic micro-expressions so the face is never frozen mid-sentence
      if (!o.noMicro && !avatar.el.hasAttribute('data-reduced')) {
        cueTimers.push(setTimeout(function () { avatar.micro('tilt', 900); }, dur * 0.35));
        cueTimers.push(setTimeout(function () { avatar.micro('blinkTwice', 420); }, dur * 0.72));
      }

      speakingTimer = setTimeout(function () {
        avatar.setMouthLevel(0);
        if (!avatar.el.getAttribute('data-emote')) avatar.emote('neutral');
        else avatar.emote('neutral');
        avatar.setState(o.nextState || 'idle');
        if (onDone) onDone(parsed.text);
        if (o.onDone) o.onDone(parsed.text);
      }, dur + 120);

      return parsed.text;
    }

    function react(text) {
      var s = sentiment(text);
      if (s.label === 'annoyed') {
        avatar.emote('empathy', 3200);
        avatar.micro('tilt', 900);
        return { sentiment: s, reply: 'معلش على الإزعاج، أنا معاك. قولي حصل إيه بالظبط وأنا أظبطه.', emotion: 'empathy' };
      }
      if (s.label === 'thanks') {
        avatar.emote('happy', 2000);
        avatar.micro('blinkTwice', 420);
        return { sentiment: s, reply: quip('thanks'), emotion: 'happy' };
      }
      if (s.label === 'happy') {
        avatar.emote('happy', 2000);
        return { sentiment: s, reply: humor === 'playful' ? 'ده كلام يفرّح! ' + quip('thanks') : quip('thanks'), emotion: 'happy' };
      }
      if (s.label === 'greeting') {
        avatar.emote('happy', 1800); avatar.gesture('wave');
        return { sentiment: s, reply: quip('greet'), emotion: 'happy' };
      }
      if (s.label === 'question') {
        avatar.emote('thinking', 1600);
        return { sentiment: s, reply: quip('thinking'), emotion: 'thinking' };
      }
      avatar.emote('neutral');
      return { sentiment: s, reply: '', emotion: 'neutral' };
    }

    var api = {
      avatar: avatar,
      speak: speak,
      parse: parse,
      sentiment: sentiment,
      react: react,
      quip: quip,
      emote: function (name, ms) { avatar.emote(name, ms); return api; },
      micro: function (name, ms) { avatar.micro(name, ms); return api; },
      setHumor: function (h) { if (QUIPS[h]) humor = h; return api; },
      getHumor: function () { return humor; },
      onDone: function (fn) { onDone = fn; return api; },
      stop: function () { clearTimers(); avatar.setMouthLevel(0); avatar.setState('idle'); return api; },
      tags: Object.keys(TAGS),
      humorLevels: ['off', 'light', 'playful']
    };
    return api;
  }

  window.UnoPersona = { attach: attach, quips: QUIPS, tags: TAGS, sentiment: sentiment, parse: parse, version: '1.0.0' };
})();
