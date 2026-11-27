/* Uno personality v2 — additive layer over uno-personality.js.
   Adds what v1 lacked: session mood memory, escalation, negation-aware
   sentiment, reply queue, quip rate limits, quiet mode, English lines.
   Usage:
     var p2 = UnoPersonaV2.attach(avatar, { lang: 'ar', humor: 'light' });
     p2.handle('الطلب اتأخر تاني ومفيش حد بيرد');   // -> {sentiment, mood, emotion, reply}
     p2.speak('أهلاً [wave]');                     // tags + queue + cooldown
     p2.quiet(true); p2.setLang('en'); p2.mood(); p2.reset();
   Nothing here talks to a model: it is rules over words, by design. */
(function () {
  'use strict';

  var LINES = {
    ar: {
      greet: { off: ['أهلاً.'], light: ['أهلاً بيك، تحت أمرك.'], playful: ['أهلاً بيك! أنا أونو، جاهز ومش بزهق.'] },
      thanks: { off: ['العفو.'], light: ['العفو، ده شغلي.'], playful: ['تسلم! الكلام الحلو ده بيشغلني.'] },
      happy: { off: ['تمام.'], light: ['ده كلام يفرّح.'], playful: ['تمام كده! أنا مبسوط معاك.'] },
      annoyed: {
        off: ['معلش، أنا معاك. قولي حصل إيه وأنا أظبطه.'],
        light: ['معلش على الإزعاج. أنا معاك، قولي حصل إيه بالظبط.'],
        playful: ['معلش على الإزعاج. أنا معاك، قولي حصل إيه بالظبط.']
      },
      annoyedRepeat: ['معلش إن ده اتكرر. قولي التفاصيل وأنا أوصلها للفريق.'],
      annoyedHandoff: ['معلش إن ده اتكرر. هحوّلك لحد يتابع معاك.'],
      question: { off: ['بشوف.'], light: ['بشوف وأقولك.'], playful: ['بشوف، لحظة.'] },
      neutral: { off: [''], light: [''], playful: [''] }
    },
    en: {
      greet: { off: ['Hello.'], light: ['Hi, I am Uno. How can I help?'], playful: ['Hey! Uno here, always awake.'] },
      thanks: { off: ['You are welcome.'], light: ['Any time.'], playful: ['Happy to help, that is the whole job.'] },
      happy: { off: ['Good.'], light: ['Glad to hear it.'], playful: ['Love that. Keep it coming.'] },
      annoyed: {
        off: ['Sorry about that. Tell me what happened and I will sort it.'],
        light: ['Sorry for the trouble. Tell me what happened and I will fix it.'],
        playful: ['Sorry for the trouble. Tell me what happened and I will fix it.']
      },
      annoyedRepeat: ['Sorry this happened more than once. Tell me the details and I will pass them to the team.'],
      annoyedHandoff: ['Sorry this happened more than once. I am passing you to a person.'],
      question: { off: ['Checking.'], light: ['Let me check.'], playful: ['On it.'] },
      neutral: { off: [''], light: [''], playful: [''] }
    }
  };

  var NEGATORS = ['مش', 'مو', 'غير', 'مب', 'not', 'no ', "n't"];
  /* Arabic matching is fragile without normalisation: same word, different
     hamza seat or ta-marbuta, and a plain indexOf misses it. */
  function norm(t) {
    return String(t || '')
      .replace(/[\u064B-\u0652\u0640]/g, '')
      .replace(/[\u0623\u0625\u0622\u0671]/g, '\u0627')
      .replace(/\u0649/g, '\u064A')
      .replace(/\u0629/g, '\u0647')
      .replace(/\u0624/g, '\u0648')
      .replace(/\u0626/g, '\u064A');
  }

  var NEG = ['مش راضي', 'سيئة', 'سيئه', 'وحشة', 'مش حلو', 'مش عاجبني', 'بطيء', 'بطئ', 'متضايق', 'مش تمام', 'زعلان', 'سيء', 'وحش', 'زفت', 'تأخير', 'متأخر', 'اتأخر', 'مش شغال', 'باظ', 'غلط', 'مضايق', 'مشكلة', 'شكوى', 'غلطة', 'مفيش رد', 'محدش بيرد', 'استنى', 'تعبان', 'bad', 'late', 'broken', 'wrong', 'angry', 'upset', 'problem', 'complaint'];
  var POS = ['شكرا', 'شكراً', 'تسلم', 'تمام', 'حبيبي', 'جميل', 'ممتاز', 'رائع', 'برافو', 'عظيم', 'تحفة', 'ظبط', 'كويس', 'أحسن', 'thanks', 'great', 'perfect', 'nice', 'love it', 'good'];
  var GREET = ['السلام', 'أهلا', 'أهلاً', 'هاي', 'صباح', 'مساء', 'ازيك', 'إزيك', 'hello', 'hi ', 'hey'];
  var INTENS = ['جدا', 'جداً', 'اوي', 'أوي', 'خالص', 'كتير', 'very', 'really', 'so '];

  function has(t, list) { for (var i = 0; i < list.length; i++) if (t.indexOf(norm(list[i])) !== -1) return true; return false; }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }

  /* negation-aware: "مش وحش" is not a complaint */
  function score(text) {
    var t = norm(String(text || '').toLowerCase());
    var neg = 0, pos = 0;
    NEG.forEach(function (w) { if (t.indexOf(norm(w)) !== -1) neg++; });
    POS.forEach(function (w) { if (t.indexOf(norm(w)) !== -1) pos++; });
    if (has(t, NEGATORS) && pos > 0 && neg === 0) { pos = 0; neg = 1; }      // "مش كويس"
    if (has(t, ['مش وحش', 'not bad', 'مش سيء'])) { neg = 0; pos = 1; }       // double negative
    if (has(t, INTENS) && neg) neg += 1;
    if (has(t, INTENS) && pos) pos += 1;
    return { neg: neg, pos: pos };
  }

  function attach(avatar, opts) {
    opts = opts || {};
    var lang = opts.lang === 'en' ? 'en' : 'ar';
    var humor = opts.humor || 'light';
    var quiet = false;
    var mood = 'calm';            // calm | happy | annoyed
    var annoyStreak = 0;
    var lastQuipAt = 0, quipsInWindow = 0, windowStart = 0;
    var lastSpokeAt = 0, lastAnnoyAt = 0;
    var queue = [], busy = false;
    var MIN_QUIP_GAP = 4000, WINDOW_MS = 30000, MAX_QUIPS = 2;

    function canQuip() {
      var now = Date.now();
      if (now - lastQuipAt < MIN_QUIP_GAP) return false;
      if (now - windowStart > WINDOW_MS) { windowStart = now; quipsInWindow = 0; }
      return quipsInWindow < MAX_QUIPS;
    }
    function markQuip() { lastQuipAt = Date.now(); quipsInWindow++; }

    function line(kind) {
      var set = (LINES[lang] || LINES.ar)[kind];
      if (!set) return '';
      if (Array.isArray(set)) return set.length ? pick(set) : '';   // flat lines, no humor levels
      var level = mood === 'annoyed' ? 'light' : humor;             // never joke at an annoyed customer
      var arr = set[level] || set.light || set.off || [];
      return arr.length ? pick(arr) : '';
    }

    function classify(text) {
      var t = norm(String(text || '').toLowerCase());
      var s = score(text);
      var greet = has(t, GREET), thanks = has(t, ['شكرا', 'شكراً', 'تسلم', 'thanks', 'thank you']);
      var q = /[?؟]/.test(t) || has(t, ['فين', 'كام', 'ليه', 'امتى', 'هل', 'where', 'how much', 'when', 'why']);
      var label = s.neg > 0 ? 'annoyed' : thanks ? 'thanks' : s.pos > 0 ? 'happy' : greet ? 'greeting' : q ? 'question' : 'neutral';
      return { label: label, neg: s.neg, pos: s.pos, question: q };
    }

    function handle(text) {
      var c = classify(text);
      if (c.label === 'annoyed') {
        var now = Date.now();
        if (now - lastAnnoyAt > 120000) annoyStreak = 0;   // the streak decays: two complaints hours apart are not a pattern
        lastAnnoyAt = now;
        annoyStreak++;
        mood = 'annoyed';
        avatar.emote('empathy', 3200);
        avatar.micro('tilt', 900);
        var canHandOff = typeof opts.onEscalate === 'function';
        var reply = annoyStreak >= 2 ? line(canHandOff ? 'annoyedHandoff' : 'annoyedRepeat') : line('annoyed');
        if (annoyStreak >= 2 && canHandOff) { try { opts.onEscalate({ text: text, streak: annoyStreak }); } catch (e) {} }
        return { sentiment: c, mood: mood, emotion: 'empathy', reply: reply, humorUsed: false, escalate: annoyStreak >= 2, handoff: annoyStreak >= 2 && canHandOff };
      }
      if (c.label === 'thanks' || c.label === 'happy') {
        mood = 'happy'; annoyStreak = 0;
        avatar.emote('happy', 2000);
        return { sentiment: c, mood: mood, emotion: 'happy', reply: line(c.label), humorUsed: humor === 'playful' };
      }
      if (c.label === 'greeting') {
        mood = 'calm'; annoyStreak = 0;
        avatar.emote('happy', 1800); avatar.gesture('wave');
        return { sentiment: c, mood: mood, emotion: 'happy', reply: line('greet'), humorUsed: humor !== 'off' };
      }
      if (c.label === 'question') {
        mood = mood === 'annoyed' ? 'annoyed' : 'calm';
        avatar.emote('thinking', 1600);
        return { sentiment: c, mood: mood, emotion: 'thinking', reply: line('question'), humorUsed: false };
      }
      return { sentiment: c, mood: mood, emotion: 'neutral', reply: '', humorUsed: false };
    }

    function speak(text, o) {
      o = o || {};
      if (quiet) return '';
      queue.push({ text: text, o: o });
      if (busy) return '';
      next();
      return text;
    }
    function next() {
      if (!queue.length) { busy = false; return; }
      busy = true;
      var job = queue.shift();
      lastSpokeAt = Date.now();
      var clean = window.UnoPersona ? window.UnoPersona.parse(job.text).text : String(job.text).replace(/\[[a-zA-Z]+\]/g, '').trim();
      if (window.UnoPersona) {
        // reuse v1 tag timing if it is on the page, otherwise just speak
        var tmp = window.UnoPersona.attach(avatar, { humor: humor });
        tmp.speak(job.text, { onDone: function () { next(); } });
      } else {
        avatar.setState('speaking');
        setTimeout(function () { avatar.setState('idle'); next(); }, Math.max(900, clean.length * 62));
      }
    }

    return {
      handle: handle,
      classify: classify,
      speak: speak,
      quip: function (kind) {
        if (quiet || !canQuip()) return '';
        markQuip();
        return line(kind);
      },
      mood: function () { return mood; },
      annoyStreak: function () { return annoyStreak; },
      setHumor: function (h) { if (['off', 'light', 'playful'].indexOf(h) !== -1) humor = h; return this; },
      getHumor: function () { return humor; },
      setLang: function (l) { lang = l === 'en' ? 'en' : 'ar'; return this; },
      quiet: function (on) { quiet = on === undefined ? true : !!on; if (quiet) queue.length = 0; return this; },
      isQuiet: function () { return quiet; },
      reset: function () { mood = 'calm'; annoyStreak = 0; queue.length = 0; busy = false; return this; },
      stats: function () { return { mood: mood, annoyStreak: annoyStreak, quipsInWindow: quipsInWindow, queued: queue.length, busy: busy }; }
    };
  }

  window.UnoPersonaV2 = { attach: attach, lines: LINES, score: score, norm: norm, version: '2.1.0' };
})();
