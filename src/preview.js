/* All entries are illustrative specimens from the supplied mockup, not live posts. */
(() => {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const esc = (value) => String(value).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  // Preview services may insert a <base> pointing at the raw source file.
  // Keep generated article links on this rendered document, including its query string.
  const routeHref = (fragment) => esc(location.href.split('#')[0] + fragment);
  const posts = SAMPLE_POSTS;
  let currentRoute = '';
  const row = (p) => `<article><a class="post-row" href="${routeHref('#read/' + p.id)}"><span class="micro muted row-no" aria-hidden="true"></span><div><h3 class="post-title${p.malayalam ? ' ml-title' : ''}"${p.malayalam ? ' lang="ml"' : ''}>${esc(p.title)}</h3><p>${esc(p.excerpt)}</p></div><div class="post-meta micro"><span lang="ml">${p.mlLabel}</span><time>Sample / ${p.date}</time></div><span class="row-arrow" aria-hidden="true">↗</span></a></article>`;
  function render() {
    const route = location.hash || '#home';
    if (['#top','#about','#main-content','#writing','#archive'].includes(route)) return;
    const reading = route.startsWith('#read/');
    const filter = route.startsWith('#category/') ? route.slice(10) : 'all';
    let query = '';
    if (route.startsWith('#search/')) { try { query = decodeURIComponent(route.slice(8)).trim(); } catch { query = ''; } }
    const selected = posts.find((p) => p.id === route.slice(6));
    const isReading = reading && !!selected;
    $('#home-view').hidden = isReading;
    $('#reader-view').hidden = !isReading;
    document.body.classList.toggle('is-reader', isReading);
    document.body.classList.toggle('is-index', !isReading);
    if (isReading) document.body.classList.remove('is-home');
    if (isReading) {
      $('#reader-title').textContent = selected.title;
      $('#reader-title').className = 'article-title' + (selected.malayalam ? ' ml-title' : '');
      $('#reader-title').lang = selected.malayalam ? 'ml' : 'en';
      $('#reader-category').textContent = selected.label;
      $('#reader-deck').textContent = selected.deck;
      $('#reader-body').innerHTML = selected.body;
      $('#reader-body').lang = selected.malayalam ? 'ml' : 'en';
      $('#reader-date').textContent = 'Illustrative / ' + selected.date;
      document.querySelector('[data-copy]').textContent = 'Copy preview link ↗';
      document.title = selected.title + ' — The Yellow Bottle / Preview';
    } else {
      const front = filter === 'all' && !query;
      document.body.classList.toggle('is-home', front);
      $('#opening').hidden = !front;
      $('#featured').hidden = !front;
      const found = posts.filter((p) => (!front || p.id !== 'hand') && (filter === 'all' || (filter === 'selected' ? p.selected : p.category === filter)) && (!query || (p.title + ' ' + p.excerpt + ' ' + p.body.replace(/<[^>]+>/g, ' ') + ' ' + p.label + ' ' + p.mlLabel).toLocaleLowerCase().includes(query.toLocaleLowerCase())));
      const titles = {all:'Collected <em>writing.</em>',poetry:'Poems &amp; <em>fragments.</em>',stories:'A place for <em>stories.</em>',essays:'Notes &amp; <em>essays.</em>',selected:'Selected <em>pages.</em>',video:'The moving <em>image.</em>'};
      $('#writing-heading').innerHTML = query ? 'Found between the <em>lines.</em>' : titles[filter] || titles.all;
      $('#result-count').textContent = query ? `${found.length} sample ${found.length === 1 ? 'result' : 'results'} for “${query}”` : `${found.length} sample ${found.length === 1 ? 'piece' : 'pieces'} / English & Malayalam`;
      $('#post-list').innerHTML = found.length ? found.map(row).join('') : `<p class="empty">Nothing here yet. Try another word or <a href="${routeHref('#home')}">return to all writing.</a></p>`;
      document.querySelectorAll('.filter').forEach((link) => {
        link.removeAttribute('aria-current');
        if (link.dataset.filter === filter && !query) link.setAttribute('aria-current','page');
      });
      document.title = 'The Yellow Bottle — Black & White / Preview';
    }
    window.dispatchEvent(new Event('tyb:render'));
    if (currentRoute) {
      window.scrollTo({top: 0, behavior: 'instant'});
      $('#main-content').focus({preventScroll:true});
    }
    currentRoute = route;
  }
  $('.search-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const query = $('#search-input').value.trim();
    location.hash = query ? '#search/' + encodeURIComponent(query) : '#home';
  });
  window.addEventListener('hashchange', render);
  render();
})();
