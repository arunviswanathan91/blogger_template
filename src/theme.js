/* Progressive enhancements shared by the preview and Blogger. No dependencies. */
(() => {
  'use strict';
  const q = (s) => document.querySelector(s);

  const root = document.documentElement;
  const systemDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)');
  const effectiveTheme = () => root.dataset.theme || (systemDark && systemDark.matches ? 'dark' : 'light');
  const describeToggle = (button) => button.setAttribute('aria-label', effectiveTheme() === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
  document.querySelectorAll('[data-toggle-theme]').forEach((button) => {
    describeToggle(button);
    button.addEventListener('click', () => {
      const next = effectiveTheme() === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('tyb-theme', next); } catch { /* Optional preference. */ }
      describeToggle(button);
    });
  });

  const media = (query) => window.matchMedia ? window.matchMedia(query) : { matches: false, addEventListener() {} };
  const motionOK = !media('(prefers-reduced-motion: reduce)').matches;
  const finePointer = media('(hover: hover) and (pointer: fine)').matches;
  if (motionOK && finePointer) {
    document.querySelectorAll('[data-magnetic]').forEach((el) => {
      const strength = Number(el.dataset.magnetic) || 8;
      el.addEventListener('mousemove', (event) => {
        const box = el.getBoundingClientRect();
        const x = (event.clientX - box.left - box.width / 2) / (box.width / 2);
        const y = (event.clientY - box.top - box.height / 2) / (box.height / 2);
        el.style.transform = `translate(${(x * strength).toFixed(1)}px, ${(y * strength).toFixed(1)}px)`;
      });
      el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });
  }

  // Opening panels: on wide screens a chapter tab unfolds its panel in place; on phones tabs stay plain links.
  const hero = q('[data-panels]');
  const wide = media('(min-width: 761px)');
  if (hero) {
    const panels = [...hero.children].filter((el) => el.classList.contains('panel'));
    const activate = (index) => panels.forEach((panel, i) => {
      const on = i === index;
      panel.classList.toggle('is-active', on);
      const body = panel.querySelector('.panel-body');
      if (body) body.inert = !on;
      const tab = panel.querySelector('[data-panel-tab]');
      if (wide.matches) tab.setAttribute('aria-expanded', String(on)); else tab.removeAttribute('aria-expanded');
    });
    panels.forEach((panel, i) => panel.querySelector('[data-panel-tab]').addEventListener('click', (event) => {
      if (!wide.matches) return;
      event.preventDefault();
      if (!panel.classList.contains('is-active')) activate(i);
    }));
    wide.addEventListener('change', () => activate(0));
    activate(0);
    requestAnimationFrame(() => requestAnimationFrame(() => hero.classList.add('is-ready')));
  }

  // Menu, search and index slide in as a curtain; their contents rise in sequence.
  document.querySelectorAll('.menu-links a').forEach((link, i) => { link.classList.add('rise'); link.style.setProperty('--i', i); });
  document.querySelectorAll('.menu-sub').forEach((el) => { el.classList.add('rise'); el.style.setProperty('--i', 6); });
  document.querySelectorAll('.menu-note, .overlay-top').forEach((el) => el.classList.add('rise'));
  document.querySelectorAll('.search-inner > *').forEach((el, i) => { el.classList.add('rise'); el.style.setProperty('--i', i + 1); });
  document.querySelectorAll('.index-head, .index-list').forEach((el, i) => { el.classList.add('rise'); el.style.setProperty('--i', i + 1); });
  const overlayTimers = new WeakMap();
  let activeOverlay = null;
  let returnFocus = null;
  const setBackgroundInert = (value) => document.querySelectorAll('.site-header,main,.about,.footer').forEach((el) => { el.inert = value; });
  const closeOverlay = (restoreFocus = true) => {
    if (!activeOverlay) return;
    const overlay = activeOverlay;
    activeOverlay = null;
    overlay.classList.remove('is-open');
    clearTimeout(overlayTimers.get(overlay));
    overlayTimers.set(overlay, setTimeout(() => { if (!overlay.classList.contains('is-open')) overlay.hidden = true; }, motionOK ? 850 : 0));
    document.body.classList.remove('menu-open');
    setBackgroundInert(false);
    document.querySelectorAll('[data-open]').forEach((el) => el.setAttribute('aria-expanded', 'false'));
    if (restoreFocus && returnFocus && returnFocus.isConnected) returnFocus.focus();
  };
  const openOverlay = (target, trigger) => {
    if (!target) return;
    closeOverlay(false);
    returnFocus = trigger;
    activeOverlay = target;
    clearTimeout(overlayTimers.get(target));
    target.hidden = false;
    void target.offsetWidth;
    target.classList.add('is-open');
    document.body.classList.add('menu-open');
    setBackgroundInert(true);
    document.querySelectorAll(`[data-open="${target.id}"]`).forEach((el) => el.setAttribute('aria-expanded', 'true'));
    (target.querySelector('input') || target.querySelector('[data-close]')).focus({ preventScroll: true });
  };
  document.querySelectorAll('[data-open]').forEach((trigger) => {
    trigger.hidden = false;
    trigger.addEventListener('click', (event) => { event.preventDefault(); openOverlay(document.getElementById(trigger.dataset.open), trigger); });
  });
  const indexOverlay = document.getElementById('index-overlay');
  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href="#archive"]');
    if (!link || !indexOverlay) return;
    event.preventDefault();
    openOverlay(indexOverlay, link.closest('.overlay') ? returnFocus : link);
  });
  document.querySelectorAll('[data-close]').forEach((button) => button.addEventListener('click', () => closeOverlay()));
  document.querySelectorAll('.overlay a:not([href="#archive"])').forEach((link) => link.addEventListener('click', () => closeOverlay()));
  document.addEventListener('keydown', (event) => {
    if (!activeOverlay) return;
    if (event.key === 'Escape') { event.preventDefault(); closeOverlay(); }
    if (event.key !== 'Tab') return;
    const focusables = [...activeOverlay.querySelectorAll('a[href],button:not(:disabled),input')].filter((el) => el.getClientRects().length);
    const first = focusables[0], last = focusables[focusables.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
  document.addEventListener('submit', (event) => {
    if (event.target.matches('.search-form') && document.body.dataset.preview === 'true') closeOverlay();
  });

  let size = 23;
  try { const saved = Number(localStorage.getItem('tyb-reading-size')); if (saved >= 19 && saved <= 31) size = saved; } catch { /* Storage may be disabled. */ }
  const updateSize = () => {
    document.documentElement.style.setProperty('--reading-size', size + 'px');
    document.querySelectorAll('[data-size]').forEach((button) => {
      button.disabled = button.dataset.size === 'down' ? size <= 19 : size >= 31;
    });
  };
  document.querySelectorAll('[data-size]').forEach((button) => button.addEventListener('click', () => {
    size = Math.max(19, Math.min(31, size + (button.dataset.size === 'up' ? 2 : -2)));
    updateSize();
    try { localStorage.setItem('tyb-reading-size', size); } catch { /* Optional preference. */ }
  }));
  updateSize();

  const progress = q('.progress');
  let frame = false;
  const updateProgress = () => {
    frame = false;
    const article = q('.reading-page:not([hidden]) .article-body');
    if (!progress) return;
    if (!article || !article.getClientRects().length) { progress.style.transform = 'scaleX(0)'; return; }
    const box = article.getBoundingClientRect();
    const range = Math.max(1, box.height - window.innerHeight * .45);
    const fraction = Math.max(0, Math.min(1, (window.innerHeight * .25 - box.top) / range));
    progress.style.transform = 'scaleX(' + fraction + ')';
  };
  const queueProgress = () => { if (!frame) { frame = true; requestAnimationFrame(updateProgress); } };
  window.addEventListener('scroll', queueProgress, { passive: true });
  window.addEventListener('resize', queueProgress);
  window.addEventListener('hashchange', queueProgress);

  document.addEventListener('click', async (event) => {
    const copy = event.target.closest('[data-copy]');
    if (!copy) return;
    try {
      if (!navigator.clipboard || location.protocol === 'file:') throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(location.href);
      copy.textContent = 'Link copied ✓';
    } catch { copy.textContent = 'Copy the address from your browser'; }
  });
  const language = () => {
    document.querySelectorAll('.post-title,.article-title,.article-body,.lead-title').forEach((el) => {
      // Identify predominantly Malayalam text; mixed posts retain their own inline lang attributes.
      const letters = (el.textContent || '').replace(/[\s\d\p{P}\p{S}]/gu, '');
      const malayalam = (letters.match(/[\u0D00-\u0D7F]/g) || []).length;
      if (letters.length && malayalam / letters.length > .45) {
        el.lang = 'ml';
        if (!el.classList.contains('article-body')) el.classList.add('ml-title');
      }
    });
  };
  language();
  // A post that opens with a picture: blur it into a wash behind the title and lift the sharp copy beside it.
  const fullSize = (src) => src.replace(/\/(s\d+|w\d+-h\d+)(-[a-z0-9-]+)?\//, '/s1600/').replace(/=(s|w)\d+[^/]*$/, '=s1600');
  const decorateReader = () => {
    const page = q('.reading-page:not([hidden])');
    const body = page && page.querySelector('.article-body');
    const img = body && body.querySelector('img');
    if (!img || page.dataset.decorated) return;
    page.dataset.decorated = 'true';
    const src = fullSize(img.currentSrc || img.src);
    const glow = document.createElement('div');
    glow.className = 'reader-glow';
    glow.setAttribute('aria-hidden', 'true');
    glow.style.setProperty('--img', `url("${src.replace(/"/g, '%22')}")`);
    page.prepend(glow);
    page.classList.add('has-glow');
    // The glow covers only the title block: label, title and byline.
    const fit = () => { const end = page.querySelector('.article-byline') || page.querySelector('.article-title'); if (end) glow.style.height = (end.offsetTop + end.offsetHeight + 90) + 'px'; };
    fit();
    window.addEventListener('resize', fit);
    if (document.fonts) document.fonts.ready.then(fit);
    // Only a leading picture moves; one further down stays with its text.
    const block = img.closest('.separator') || img.closest('a') || img;
    const before = document.createRange();
    before.setStart(body, 0);
    before.setEndBefore(block);
    if (before.toString().trim().length > 160) return;
    img.src = src;
    img.removeAttribute('width');
    img.removeAttribute('height');
    const cover = document.createElement('figure');
    cover.className = 'reader-cover';
    cover.append(block);
    (page.querySelector('.article-byline') || page.querySelector('.article-title')).after(cover);
    page.classList.add('has-cover');
  };
  decorateReader();
  window.addEventListener('tyb:render', decorateReader);

  // Index content rises gently into view once, in the order it arrives.
  const revealTargets = '.lead, .section-heading, .filters, .writing article, .pagination, .about > *, .footer-top';
  const revealer = motionOK && 'IntersectionObserver' in window ? new IntersectionObserver((entries) => {
    let order = 0;
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.style.setProperty('--d', order++);
      entry.target.classList.add('is-in');
      revealer.unobserve(entry.target);
    });
  }, { threshold: .12, rootMargin: '0px 0px -40px 0px' }) : null;
  const reveal = () => {
    if (!revealer) return;
    document.querySelectorAll(revealTargets).forEach((el) => {
      if (el.classList.contains('reveal')) return;
      el.classList.add('reveal');
      revealer.observe(el);
    });
    // Never leave anything on screen hidden if an observer callback is missed.
    setTimeout(() => document.querySelectorAll('.reveal:not(.is-in)').forEach((el) => {
      const box = el.getBoundingClientRect();
      if (box.top < window.innerHeight && box.bottom > 0) el.classList.add('is-in');
    }), 1500);
  };
  reveal();
  window.addEventListener('tyb:render', () => { language(); updateSize(); queueProgress(); reveal(); });
  const decoded = (value) => { try { return decodeURIComponent(value); } catch { return value; } };

  // Safety net: if Blogger returns an empty Blog or archive widget, rebuild it from the blog's own public feed.
  const esc = (value) => String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  // Always ask Blogger whether the feed changed, so edits in the dashboard are never hidden behind the browser cache.
  const feed = (kind, query) => fetch(`/feeds/${kind}?alt=json&${query}`, { cache: 'no-cache' }).then((r) => r.json()).then((d) => d.feed.entry || []);
  const plain = (html) => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    doc.querySelectorAll('style, script, noscript, template').forEach((el) => el.remove());
    // Summaries of posts that carry their own styles can start with CSS or code; drop it so excerpts stay prose.
    let text = doc.documentElement.textContent.replace(/\/\*[\s\S]*?\*\//g, ' ');
    for (let i = 0; i < 3; i++) text = text.replace(/[^{}]*\{[^{}]*\}/g, ' ');
    return text.replace(/\(function\s*\([\s\S]*$/, ' ').replace(/\s+/g, ' ').trim();
  };
  const entryLink = (e) => (e.link.find((l) => l.rel === 'alternate') || {}).href || '/';
  const entryDate = (e) => new Date(e.published.$t).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const store = {
    get: (key) => { try { return JSON.parse(sessionStorage.getItem('tyb:' + key)); } catch { return null; } },
    set: (key, value) => { try { sessionStorage.setItem('tyb:' + key, JSON.stringify(value)); } catch { /* Cache is optional. */ } },
  };
  const postId = (e) => (e.id.$t.match(/post-(\d+)/) || [])[1];
  const pathOf = (href) => { try { return new URL(href, location.href).pathname; } catch { return ''; } };
  // Lists are small: keep only what a row needs.
  const slim = (e) => ({ id: e.id, title: e.title, summary: e.summary, published: e.published, updated: e.updated, category: e.category, link: e.link });
  // Two lists match only if the same posts are there at the same edit, so a dashboard change always shows.
  const stamp = (list) => list.map((e) => postId(e) + '@' + (e.updated ? e.updated.$t : '')).join();
  const fetchPost = (id) => fetch(`/feeds/posts/default/${id}?alt=json`, { cache: 'no-cache' }).then((r) => r.json()).then((d) => d.entry);
  // Start downloading a post as soon as the reader points at it, so the next page opens from memory.
  const prefetch = (link) => {
    const id = link.dataset.postId, path = pathOf(link.href);
    if (!id || store.get('post:' + path) || link.dataset.prefetching) return;
    link.dataset.prefetching = 'true';
    fetchPost(id).then((entry) => store.set('post:' + path, entry)).catch(() => {});
  };
  ['pointerover', 'focusin', 'touchstart'].forEach((type) => document.addEventListener(type, (event) => {
    const link = event.target.closest && event.target.closest('a.post-row[data-post-id]');
    if (link) prefetch(link);
  }, { passive: true }));
  const categories = window.TYB_CATEGORIES || {};
  const categoryKey = new URLSearchParams(location.search).get('category');
  const categoryOf = (label) => Object.keys(categories).find((key) => categories[key].labels.some((l) => l.toLowerCase() === label.toLowerCase()));
  const filtersHTML = (active) => `<nav class="filters" aria-label="Writing categories"><a class="filter" data-filter="all" href="/#writing"${active ? '' : ' aria-current="page"'}>All writing</a>${Object.entries(categories).map(([key, c]) => `<a class="filter" data-filter="${key}" lang="ml" href="${esc(c.url)}"${key === active ? ' aria-current="page"' : ''}>${esc(c.ml)}</a>`).join('')}</nav>`;
  const renderList = (holder, entries, heading, active) => {
    const rows = entries.map((e) => `<article><a class="post-row" href="${esc(entryLink(e))}" data-post-id="${esc(postId(e) || '')}"><span class="micro muted row-no" aria-hidden="true"></span><div><h3 class="post-title">${esc(e.title.$t || 'Untitled')}</h3><p>${esc(plain(e.summary ? e.summary.$t : '').slice(0, 150))}</p></div><div class="post-meta micro">${e.category ? `<span>${esc(e.category[0].term)}</span>` : ''}<time>${entryDate(e)}</time></div><span class="row-arrow" aria-hidden="true">↗</span></a></article>`).join('');
    holder.innerHTML = `<section class="writing" id="writing" data-blog-rendered="true"><div class="section-heading"><h2>${heading}</h2><span class="micro muted">${entries.length} ${entries.length === 1 ? 'piece' : 'pieces'} / English &amp; Malayalam</span></div>${filtersHTML(active)}${rows ? `<div class="post-list" data-fallback="true">${rows}</div>` : '<p class="empty">No writing found here yet. <a href="/">Return to the journal.</a></p>'}<nav class="pagination"><a class="text-link" href="#archive">Explore the index ↗</a></nav></section>`;
    window.dispatchEvent(new Event('tyb:render'));
  };
  // A chapter gathers several Blogger labels: fetch each, merge, and list newest first.
  const showCategory = async (key) => {
    const group = categories[key];
    const holder = document.getElementById('Blog1') || document.getElementById('journal');
    if (!group || !holder) return;
    const cached = store.get('list:category:' + key);
    if (cached) renderList(holder, cached, group.title, key);
    const lists = await Promise.all(group.labels.map((label) => feed('posts/summary/-/' + encodeURIComponent(label), 'max-results=150').catch(() => [])));
    const seen = new Set();
    const entries = lists.flat()
      .filter((e) => !seen.has(e.id.$t) && seen.add(e.id.$t))
      .sort((a, b) => new Date(b.published.$t) - new Date(a.published.$t))
      .map(slim);
    store.set('list:category:' + key, entries);
    if (!cached || stamp(cached) !== stamp(entries)) renderList(holder, entries, group.title, key);
  };
  const restoreBlog = async () => {
    const holder = document.getElementById('Blog1') || document.getElementById('journal');
    if (!holder || holder.querySelector('[data-blog-rendered]')) return;
    const path = decoded(location.pathname);
    const params = new URLSearchParams(location.search);
    if (/^\/(\d{4}\/\d{2}\/[^/]+|p\/[^/]+)\.html$/.test(path)) {
      const renderPost = (e) => {
        holder.innerHTML = `<div class="reader-toolbar"><a href="/">← All writing</a></div><article class="reading-page" data-blog-rendered="true" data-post-id="${esc(postId(e) || '')}"><div class="micro muted">${esc(e.category ? e.category[0].term : 'The Yellow Bottle')}</div><h1 class="article-title">${esc(e.title.$t)}</h1><div class="article-byline"><span>${esc(e.author ? e.author[0].name.$t : '')}</span><time>${entryDate(e)}</time></div><div class="article-body post-body">${e.content.$t}</div><div class="article-end"><a href="/">← All writing</a></div></article>`;
        // Posts may carry their own small scripts (animated poems); innerHTML never runs them, so re-create each one.
        holder.querySelectorAll('.article-body script').forEach((old) => {
          const script = document.createElement('script');
          [...old.attributes].forEach((a) => script.setAttribute(a.name, a.value));
          script.textContent = old.textContent;
          old.replaceWith(script);
        });
        window.dispatchEvent(new Event('tyb:render'));
      };
      const isPage = path.startsWith('/p/');
      const cached = store.get('post:' + location.pathname);
      if (cached) renderPost(cached);
      // A remembered copy opens instantly, but the live one is always fetched: if the post was edited, it replaces the copy.
      const head = document.querySelector('link[href*="/feeds/"][href*="/comments/default"]');
      const id = (head && (head.href.match(/\/feeds\/(\d+)\/comments/) || [])[1]) || (cached && postId(cached));
      let e = !isPage && id ? await fetchPost(id).catch(() => null) : null;
      if (!e) {
        const summaries = await feed(isPage ? 'pages/summary' : 'posts/summary', 'max-results=500');
        const match = summaries.find((item) => pathOf(entryLink(item)) === location.pathname);
        if (match) e = isPage ? (await feed('pages/default', 'max-results=500')).find((item) => pathOf(entryLink(item)) === location.pathname) : await fetchPost(postId(match));
      }
      if (!e) return;
      store.set('post:' + location.pathname, e);
      if (!cached || cached.updated?.$t !== e.updated?.$t || cached.content?.$t !== e.content?.$t) renderPost(e);
      return;
    }
    const label = path.match(/^\/search\/label\/(.+)$/);
    if (label && categoryOf(label[1])) return showCategory(categoryOf(label[1]));
    const month = path.match(/^\/(\d{4})\/(\d{2})\/?$/);
    let kind = 'posts/summary', query = 'max-results=25', heading = 'Collected <em>writing.</em>';
    if (label) { kind += '/-/' + encodeURIComponent(label[1]); heading = esc(label[1]); }
    else if (params.get('q')) { query += '&q=' + encodeURIComponent(params.get('q')); heading = `Results for <em>“${esc(params.get('q'))}”</em>`; }
    else if (month) {
      query += `&published-min=${month[1]}-${month[2]}-01T00:00:00&published-max=${new Date(Date.UTC(+month[1], +month[2], 1)).toISOString().slice(0, 19)}`;
      heading = 'From the <em>archive.</em>';
    }
    const listKey = 'list:' + kind + '?' + query;
    const cached = store.get(listKey);
    if (cached) renderList(holder, cached, heading);
    const entries = (await feed(kind, query)).map(slim);
    store.set(listKey, entries);
    if (!cached || stamp(cached) !== stamp(entries)) renderList(holder, entries, heading);
  };
  // Blogger's own list carries titles and links; dates and excerpts come from one cached summary feed.
  const fillNative = async () => {
    const slots = [...document.querySelectorAll('[data-fill]')];
    if (!slots.length) return;
    const fill = (summaries) => {
      const byId = new Map(summaries.map((e) => [postId(e), e]));
      slots.forEach((slot) => {
        const e = byId.get(slot.closest('[data-post-id]')?.dataset.postId);
        if (!e) return;
        if (slot.dataset.fill === 'date') { slot.textContent = entryDate(e); slot.setAttribute('datetime', e.published.$t); }
        else slot.textContent = plain(e.summary ? e.summary.$t : '').slice(0, slot.dataset.fill === 'excerpt-long' ? 220 : 150);
      });
      return byId;
    };
    // Fill instantly from memory, then from the live feed so edited excerpts replace remembered ones.
    const cached = store.get('summaries');
    if (cached) fill(cached);
    const summaries = (await feed('posts/summary', 'max-results=150')).map(slim);
    store.set('summaries', summaries);
    const byId = fill(summaries);
    const missing = [...new Set(slots.map((slot) => slot.closest('[data-post-id]')?.dataset.postId).filter((id) => id && !byId.has(id)))].slice(0, 30);
    if (!missing.length) { repairExcerpts(); return; }
    const extra = (await Promise.all(missing.map((id) => fetch(`/feeds/posts/summary/${id}?alt=json`, { cache: 'no-cache' }).then((r) => r.json()).then((d) => d.entry).catch(() => null)))).filter(Boolean);
    fill(summaries.concat(extra));
    repairExcerpts();
  };
  // A post whose summary was only styles or code gets its excerpt from the post itself.
  const repairExcerpts = () => {
    document.querySelectorAll('.post-row[data-post-id], .lead[data-post-id]').forEach((row) => {
      const slot = row.querySelector('[data-fill^="excerpt"]') || row.querySelector('p');
      if (!slot || slot.textContent.trim() || slot.dataset.repairing || !row.dataset.postId) return;
      slot.dataset.repairing = 'true';
      fetchPost(row.dataset.postId).then((e) => { slot.textContent = plain(e.content ? e.content.$t : '').slice(0, slot.dataset.fill === 'excerpt-long' ? 220 : 150); }).catch(() => {});
    });
  };
  if (document.body.dataset.preview !== 'true') window.addEventListener('tyb:render', () => setTimeout(repairExcerpts, 1500));
  const restoreArchive = async () => {
    const holder = document.querySelector('#index-overlay .index-list');
    if (!holder || holder.querySelector('[data-blog-rendered] li, .archive-items li')) return;
    const months = new Map();
    (await feed('posts/summary', 'max-results=500')).forEach((e) => {
      const key = e.published.$t.slice(0, 7);
      months.set(key, (months.get(key) || 0) + 1);
    });
    holder.innerHTML = '<ul class="archive-items">' + [...months].map(([key, count]) => {
      const [y, m] = key.split('-');
      const name = new Date(Date.UTC(+y, +m - 1, 1)).toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });
      return `<li><a href="/${y}/${m}/">${name} <span class="muted">(${count})</span></a></li>`;
    }).join('') + '</ul>';
  };
  // Under every post: a like made of lines, a share button, and Blogger's own comments.
  const preview = document.body.dataset.preview === 'true';
  const likesAPI = window.TYB_LIKES_API || 'https://api.counterapi.dev/v1/the-yellow-bottle';
  const pageURL = () => location.href.split('#')[0].replace(/[?&]m=1\b/, '');
  // The artwork's colours, in tones that read on white and on black.
  const likeColors = ['#2a9d8f', '#7a9a3a', '#e0a526', '#d96b3b', '#c0508a', '#7d5fc0', '#4f79b8', '#35b3a5'];
  const burst = Array.from({ length: 12 }, (_, k) => {
    const a = k * Math.PI / 6, c = Math.cos(a), n = Math.sin(a), r = (v) => (20 + v).toFixed(2);
    const style = `--k:${k};--c:${likeColors[k % likeColors.length]}`;
    return `<line class="rest" x1="${r(c * 5)}" y1="${r(n * 5)}" x2="${r(c * 9)}" y2="${r(n * 9)}" style="${style}"/><line class="ray" x1="${r(c * 11)}" y1="${r(n * 11)}" x2="${r(c * 18)}" y2="${r(n * 18)}" pathLength="1" style="${style}"/>`;
  }).join('');
  const shareIcon = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98"/></svg>';
  const shareTargets = [
    ['WhatsApp', (u, t) => `https://wa.me/?text=${encodeURIComponent(t + ' ' + u)}`],
    ['Facebook', (u) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(u)}`],
    ['X', (u, t) => `https://twitter.com/intent/tweet?url=${encodeURIComponent(u)}&text=${encodeURIComponent(t)}`],
    ['Telegram', (u, t) => `https://t.me/share/url?url=${encodeURIComponent(u)}&text=${encodeURIComponent(t)}`],
    ['Email', (u, t) => `mailto:?subject=${encodeURIComponent(t)}&body=${encodeURIComponent(u)}`],
  ];
  const likeKey = (id) => 'p' + id;
  const liked = (id) => { try { return localStorage.getItem('tyb-liked:' + id) === '1'; } catch { return false; } };
  const counter = (id, up) => fetch(`${likesAPI}/${likeKey(id)}${up ? '/up' : '/'}`, { cache: 'no-store' })
    .then((r) => r.ok ? r.json() : Promise.reject(r.status)).then((d) => Number(d.count ?? d.value) || 0);
  const showCount = (button, value) => {
    const out = button.querySelector('.like-count');
    if (value == null) { out.textContent = ''; return; }
    out.textContent = value;
    button.setAttribute('aria-label', `Like this piece. ${value} ${value === 1 ? 'like' : 'likes'} so far`);
  };
  const buildActions = (page) => {
    if (page.querySelector('.post-actions')) return;
    const id = page.dataset.postId || 'preview';
    const title = (page.querySelector('.article-title')?.textContent || document.title).trim();
    const bar = document.createElement('div');
    bar.className = 'post-actions';
    bar.innerHTML = `<button class="like-button${liked(id) ? ' is-liked' : ''}" type="button" aria-pressed="${liked(id)}" aria-label="Like this piece"><svg viewBox="0 0 40 40" fill="none" aria-hidden="true">${burst}</svg><span class="like-count micro" aria-hidden="true"></span></button><div class="share"><button class="share-button" type="button" aria-haspopup="true" aria-expanded="false" aria-label="Share this piece">${shareIcon}<span>Share</span></button><div class="share-menu" hidden="hidden">${shareTargets.map(([name]) => `<a data-share="${name}" target="_blank" rel="noopener noreferrer">${name} <span aria-hidden="true">↗</span></a>`).join('')}<button type="button" data-copy="true">Copy link</button></div></div>`;
    const end = page.querySelector('.article-end');
    if (end) { end.querySelector('[data-copy]')?.remove(); end.append(bar); } else page.append(bar);
    const like = bar.querySelector('.like-button');
    if (!preview && id !== 'preview') counter(id, false).then((v) => showCount(like, v)).catch(() => showCount(like, null));
    like.addEventListener('click', () => {
      like.classList.remove('is-bursting');
      void like.offsetWidth;
      like.classList.add('is-bursting');
      if (liked(id)) return;
      try { localStorage.setItem('tyb-liked:' + id, '1'); } catch { /* A like still counts without memory. */ }
      like.classList.add('is-liked');
      like.setAttribute('aria-pressed', 'true');
      const shown = Number(like.querySelector('.like-count').textContent);
      if (!preview && id !== 'preview') counter(id, true).then((v) => showCount(like, v)).catch(() => showCount(like, shown ? shown + 1 : null));
    });
    const share = bar.querySelector('.share-button'), menu = bar.querySelector('.share-menu');
    const close = () => { menu.hidden = true; share.setAttribute('aria-expanded', 'false'); };
    share.addEventListener('click', async () => {
      if (navigator.share && !finePointer) {
        try { await navigator.share({ title, url: pageURL() }); return; } catch (error) { if (error && error.name === 'AbortError') return; }
      }
      menu.querySelectorAll('[data-share]').forEach((a) => { a.href = shareTargets.find(([name]) => name === a.dataset.share)[1](pageURL(), title); });
      menu.hidden = !menu.hidden;
      share.setAttribute('aria-expanded', String(!menu.hidden));
    });
    document.addEventListener('click', (event) => { if (!event.target.closest('.share')) close(); });
    document.addEventListener('keydown', (event) => { if (event.key === 'Escape') close(); });
  };
  // Comments come from the post's public comment feed; writing one uses Blogger's own comment form.
  const cleanComment = (html) => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const walk = (node) => [...node.childNodes].map((child) => {
      if (child.nodeType === 3) return esc(child.textContent);
      if (child.nodeType !== 1) return '';
      const tag = child.tagName.toLowerCase();
      if (['script', 'style', 'iframe', 'object', 'noscript', 'template'].includes(tag)) return '';
      const inner = walk(child);
      if (tag === 'br') return '<br/>';
      if (['b', 'strong', 'i', 'em'].includes(tag)) return `<${tag}>${inner}</${tag}>`;
      if (tag === 'a' && /^https?:/i.test(child.getAttribute('href') || '')) return `<a href="${esc(child.getAttribute('href'))}" rel="nofollow noopener noreferrer" target="_blank">${inner}</a>`;
      return inner;
    }).join('');
    return walk(doc.body);
  };
  const blogIdFromHead = () => {
    const link = document.querySelector('link[rel="service.post"], link[rel="EditURI"], link[href*="blogID="]');
    return link ? (link.href.match(/feeds\/(\d+)\//) || link.href.match(/blogID=(\d+)/) || [])[1] : null;
  };
  const buildComments = async (page) => {
    const id = page.dataset.postId;
    if (!id || page.dataset.comments) return;
    const native = document.querySelector('#comment-editor, .comment-form iframe');
    if (native) {
      // Blogger's own form stays; add a way out for readers whose browser blocks Google sign-in inside it.
      const blog = blogIdFromHead();
      if (blog && !document.querySelector('.comment-fallback')) native.insertAdjacentHTML('afterend', `<p class="comment-fallback micro muted">Trouble signing in? <a href="https://www.blogger.com/comment/fullpage/post/${blog}/${id}" target="_blank" rel="noopener">Comment on Blogger ↗</a></p>`);
      return;
    }
    if (document.querySelector('#comments[data-built]')) return;
    page.dataset.comments = 'true';
    let blogId = blogIdFromHead();
    const [entries, post] = await Promise.all([
      feed(`${id}/comments/default`, 'max-results=200').catch(() => []),
      blogId ? null : fetchPost(id).catch(() => null),
    ]);
    if (!blogId) blogId = post && (post.id.$t.match(/blog-(\d+)/) || [])[1];
    if (!blogId) return;
    const list = entries.slice().sort((a, b) => new Date(a.published.$t) - new Date(b.published.$t)).map((c) => {
      const reply = (c.link || []).some((l) => l.rel === 'related');
      const name = c.author && c.author[0] ? c.author[0].name.$t : 'Anonymous';
      return `<div class="comment${reply ? ' is-reply' : ''}"><div class="comment-head"><strong>${esc(name)}</strong><time class="micro muted">${entryDate(c)}</time></div><div class="comment-body">${cleanComment(c.content ? c.content.$t : '')}</div></div>`;
    }).join('');
    const old = page.querySelector('.comments');
    const section = document.createElement('section');
    section.className = 'comments';
    section.id = 'comments';
    section.dataset.built = 'true';
    section.innerHTML = `<h3>${entries.length ? `${entries.length} ${entries.length === 1 ? 'response' : 'responses'}.` : 'Leave a <em>response.</em>'}</h3>${list ? `<div class="comment-list">${list}</div>` : '<p class="muted comment-empty">Be the first to write something here.</p>'}<div class="comment-write"><a class="comment-open" data-comment-popup="true" href="https://www.blogger.com/comment/fullpage/post/${blogId}/${id}" target="_blank" rel="noopener">Write a comment <span aria-hidden="true">↗</span></a><p class="micro muted">Opens Blogger’s comment form, where you can sign in with Google or comment by name.</p></div>`;
    if (old) old.replaceWith(section); else page.append(section);
    // Google sign-in cannot run inside an embedded frame, so the form opens in its own window; when it closes, the list refreshes.
    section.querySelector('[data-comment-popup]').addEventListener('click', (event) => {
      const win = window.open(event.currentTarget.href, 'tyb-comment', 'width=560,height=720');
      if (!win) return;
      event.preventDefault();
      const timer = setInterval(() => {
        if (!win.closed) return;
        clearInterval(timer);
        delete page.dataset.comments;
        section.removeAttribute('data-built');
        buildComments(page).catch(() => {});
      }, 800);
    });
  };
  // After the post: a few other pieces, preferably from the same chapter, beside a small line drawing.
  const buildMore = async (page) => {
    const id = page.dataset.postId;
    if (!id || page.querySelector('.read-more')) return;
    const slot = document.createElement('aside');
    slot.className = 'read-more';
    slot.setAttribute('aria-labelledby', 'read-more-title');
    (page.querySelector('.article-end') || page.lastElementChild).after(slot);
    let list = store.get('summaries');
    if (!list) { list = (await feed('posts/summary', 'max-results=150')).map(slim); store.set('summaries', list); }
    const labels = [...page.querySelectorAll('.article-labels a')].map((a) => a.textContent.trim());
    const first = page.querySelector('.micro.muted')?.textContent.trim();
    if (first) labels.push(first);
    const chapter = labels.map(categoryOf).find(Boolean);
    const others = list.filter((e) => postId(e) !== id);
    const near = chapter ? others.filter((e) => (e.category || []).some((c) => categoryOf(c.term) === chapter)) : [];
    const picks = [...near.slice(0, 3), ...others.filter((e) => !near.slice(0, 3).includes(e))].slice(0, 4);
    if (!picks.length) { slot.remove(); return; }
    slot.innerHTML = `<div class="read-more-art figure-frame" data-figure="more"></div><div><h2 class="micro" id="read-more-title">Read more</h2><ul>${picks.map((e) => `<li><a href="${esc(entryLink(e))}"><span class="read-more-title">${esc(e.title.$t || 'Untitled')}</span><time class="micro muted">${entryDate(e)}</time></a></li>`).join('')}</ul></div>`;
    language();
    if (window.TYB_FIGURE) window.TYB_FIGURE(slot.querySelector('.figure-frame'));
  };
  // Inline colours pasted into posts are chosen for a white page; on the dark page, lift the dark ones so they stay readable.
  const luminance = (rgb) => { const [r, g, b] = rgb.match(/\d+(\.\d+)?/g).map(Number); return (r * .299 + g * .587 + b * .114) / 255; };
  const fixInk = () => {
    const dark = effectiveTheme() === 'dark';
    document.querySelectorAll('.article-body [style*="color"]').forEach((el) => {
      if (el.dataset.ink !== undefined) { el.style.color = el.dataset.ink; delete el.dataset.ink; }
      if (!dark || !el.style.color) return;
      const shown = getComputedStyle(el).color;
      if (luminance(shown) > .45) return;
      el.dataset.ink = el.style.color;
      const [r, g, b] = shown.match(/\d+/g).map(Number);
      el.style.color = `rgb(${[r, g, b].map((v) => Math.round(v + (235 - v) * .72)).join(',')})`;
    });
  };
  new MutationObserver(fixInk).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
  if (systemDark && systemDark.addEventListener) systemDark.addEventListener('change', fixInk);
  const enhanceReader = () => {
    const page = q('.reading-page:not([hidden])');
    if (!page || page.closest('[hidden]')) return;
    if (window.TYB_RIGHTS && !page.querySelector('.post-rights')) (page.querySelector('.article-body') || page.lastElementChild).insertAdjacentHTML('afterend', window.TYB_RIGHTS);
    buildActions(page);
    fixInk();
    if (!preview && window.fetch) { buildMore(page).catch(() => {}); buildComments(page).catch(() => {}); }
  };
  enhanceReader();
  window.addEventListener('tyb:render', enhanceReader);
  // Search as you type: every post's title, labels and excerpt are matched in the page, in English or Malayalam,
  // and Blogger's own full-text search adds posts that match deeper in the text.
  const searchInput = document.getElementById('search-input');
  const searchOut = q('.search-results');
  if (searchInput && searchOut && !preview && window.fetch) {
    let index = null, timer = 0, ticket = 0;
    const loadIndex = () => index || (index = feed('posts/summary', 'max-results=500').then((list) => list.map(slim)).catch(() => []));
    searchInput.addEventListener('focus', loadIndex);
    const mark = (text, words) => esc(text).replace(new RegExp(`(${words.map((w) => esc(w).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'giu'), '<mark>$1</mark>');
    const show = (words, found, query) => {
      searchOut.innerHTML = found.length
        ? found.slice(0, 12).map((e) => `<a href="${esc(entryLink(e))}"><strong>${mark(e.title.$t || 'Untitled', words)}</strong><time>${entryDate(e)}</time><small>${mark(plain(e.summary ? e.summary.$t : '').slice(0, 140), words)}</small></a>`).join('') + `<a class="search-all" href="/search?q=${encodeURIComponent(query)}">All results for “${esc(query)}” ↗</a>`
        : `<p>Nothing found for “${esc(query)}” yet.</p>`;
    };
    searchInput.addEventListener('input', () => {
      clearTimeout(timer);
      const query = searchInput.value.trim(), mine = ++ticket;
      if (query.length < 2) { searchOut.innerHTML = ''; return; }
      timer = setTimeout(async () => {
        const words = query.toLocaleLowerCase().split(/\s+/).filter(Boolean);
        const text = (e) => [e.title.$t, e.summary ? plain(e.summary.$t) : '', ...(e.category || []).map((c) => c.term)].join(' ').toLocaleLowerCase();
        const local = (await loadIndex()).filter((e) => words.every((w) => text(e).includes(w)));
        if (mine !== ticket) return;
        show(words, local, query);
        const deep = await feed('posts/summary', 'max-results=12&q=' + encodeURIComponent(query)).catch(() => []);
        if (mine !== ticket) return;
        const seen = new Set(local.map(postId));
        show(words, local.concat(deep.filter((e) => !seen.has(postId(e))).map(slim)), query);
      }, 180);
    });
  }
  if (document.body.dataset.preview !== 'true' && window.fetch) {
    // Release the held layout even if the feed cannot fill the page.
    const release = () => { const holder = document.getElementById('Blog1'); if (holder && !document.querySelector('[data-blog-rendered]')) holder.setAttribute('data-blog-rendered', 'none'); };
    setTimeout(release, 6000);
    (categories[categoryKey] ? showCategory(categoryKey) : restoreBlog()).catch(() => {}).finally(release);
    restoreArchive().catch(() => {});
    fillNative().catch(() => {});
  }
  const labelPath = decoded(location.pathname);
  document.querySelectorAll('.filters a').forEach((link) => {
    const current = categoryKey ? link.dataset.filter === categoryKey : decoded(new URL(link.href, location.href).pathname) === labelPath;
    if (current) link.setAttribute('aria-current', 'page');
  });
  document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });
})();
