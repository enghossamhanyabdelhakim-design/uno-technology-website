/* Uno store UI - Arabic-first 404 page. UnoNotFound.mount(el, {storeUrl, homeUrl}) ; search goes to storeUrl?q=... */
(function (w) {
  const { h } = w.UnoUI, I = w.UnoI18n;
  w.UnoNotFound = { mount(el, o) {
    o = Object.assign({ storeUrl: 'store.html', homeUrl: 'index.html' }, o || {}); el.classList.add('us'); document.title = I.t('nf_title') + ' | UNO';
    const q = h('input', { class: 'us-in', type: 'search', placeholder: I.t('nf_search'), 'aria-label': I.t('nf_search') });
    const go = () => { location.href = o.storeUrl + (q.value.trim() ? (o.storeUrl.includes('?') ? '&' : '?') + 'q=' + encodeURIComponent(q.value.trim()) : ''); };
    q.addEventListener('keydown', e => e.key === 'Enter' && go());
    el.replaceChildren(h('main', { class: 'us-wrap us-404' }, h('div', { class: 'code', 'aria-hidden': 'true' }, I.num(404)), h('h1', {}, I.t('nf_title')), h('p', {}, I.t('nf_text')),
      h('div', { class: 'us-inl' }, q, h('button', { class: 'us-btn pri', onclick: go }, I.t('nf_search'))),
      h('div', { class: 'lk' }, h('a', { class: 'us-btn', href: o.storeUrl }, I.t('nf_store')), h('a', { class: 'us-btn', href: o.homeUrl }, I.t('nf_home')))));
  } };
})(window);
