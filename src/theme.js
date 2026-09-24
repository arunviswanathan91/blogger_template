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
  const feed = (kind, query) => fetch(`/feeds/${kind}?alt=json&${query}`).then((r) => r.json()).then((d) => d.feed.entry || []);
  const entryLink = (e) => (e.link.find((l) => l.rel === 'alternate') || {}).href || '/';
  const entryDate = (e) => new Date(e.published.$t).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const categories = window.TYB_CATEGORIES || {};
  const categoryKey = new URLSearchParams(location.search).get('category');
  const categoryOf = (label) => Object.keys(categories).find((key) => categories[key].labels.some((l) => l.toLowerCase() === label.toLowerCase()));
  const filtersHTML = (active) => `<nav class="filters" aria-label="Writing categories"><a class="filter" data-filter="all" href="/#writing"${active ? '' : ' aria-current="page"'}>All writing</a>${Object.entries(categories).map(([key, c]) => `<a class="filter" data-filter="${key}" lang="ml" href="${esc(c.url)}"${key === active ? ' aria-current="page"' : ''}>${esc(c.ml)}</a>`).join('')}</nav>`;
  const renderList = (holder, entries, heading, active) => {
    const rows = entries.map((e) => `<article><a class="post-row" href="${esc(entryLink(e))}"><span class="micro muted row-no" aria-hidden="true"></span><div><h3 class="post-title">${esc(e.title.$t || 'Untitled')}</h3><p>${esc((e.summary ? e.summary.$t : '').slice(0, 150))}</p></div><div class="post-meta micro">${e.category ? `<span>${esc(e.category[0].term)}</span>` : ''}<time>${entryDate(e)}</time></div><span class="row-arrow" aria-hidden="true">↗</span></a></article>`).join('');
    holder.innerHTML = `<section class="writing" id="writing" data-blog-rendered="true"><div class="section-heading"><h2>${heading}</h2><span class="micro muted">${entries.length} ${entries.length === 1 ? 'piece' : 'pieces'} / English &amp; Malayalam</span></div>${filtersHTML(active)}${rows ? `<div class="post-list" data-fallback="true">${rows}</div>` : '<p class="empty">No writing found here yet. <a href="/">Return to the journal.</a></p>'}<nav class="pagination"><a class="text-link" href="#archive">Explore the index ↗</a></nav></section>`;
    window.dispatchEvent(new Event('tyb:render'));
  };
  // A chapter gathers several Blogger labels: fetch each, merge, and list newest first.
  const showCategory = async (key) => {
    const group = categories[key];
    const holder = document.getElementById('Blog1') || document.getElementById('journal');
    if (!group || !holder) return;
    const lists = await Promise.all(group.labels.map((label) => feed('posts/summary/-/' + encodeURIComponent(label), 'max-results=150').catch(() => [])));
    const seen = new Set();
    const entries = lists.flat()
      .filter((e) => !seen.has(e.id.$t) && seen.add(e.id.$t))
      .sort((a, b) => new Date(b.published.$t) - new Date(a.published.$t));
    renderList(holder, entries, group.title, key);
  };
  const restoreBlog = async () => {
    const holder = document.getElementById('Blog1') || document.getElementById('journal');
    if (!holder || holder.querySelector('[data-blog-rendered]')) return;
    const path = decoded(location.pathname);
    const params = new URLSearchParams(location.search);
    if (/^\/(\d{4}\/\d{2}\/[^/]+|p\/[^/]+)\.html$/.test(path)) {
      const entries = await feed(path.startsWith('/p/') ? 'pages/default' : 'posts/default', 'max-results=500');
      const e = entries.find((item) => new URL(entryLink(item)).pathname === location.pathname);
      if (!e) return;
      holder.innerHTML = `<div class="reader-toolbar"><a href="/">← All writing</a></div><article class="reading-page"><div class="micro muted">${esc(e.category ? e.category[0].term : 'The Yellow Bottle')}</div><h1 class="article-title">${esc(e.title.$t)}</h1><div class="article-byline"><span>${esc(e.author ? e.author[0].name.$t : '')}</span><time>${entryDate(e)}</time></div><div class="article-body post-body">${e.content.$t}</div><div class="article-end"><a href="/">← All writing</a></div></article>`;
      window.dispatchEvent(new Event('tyb:render'));
      return;
    }
    const label = path.match(/^\/search\/label\/(.+)$/);
    if (label && categoryOf(label[1])) return showCategory(categoryOf(label[1]));
    const month = path.match(/^\/(\d{4})\/(\d{2})\/?$/);
    let kind = 'posts/summary', query = 'max-results=25', heading = 'Collected <em>writing.</em>';
    if (label) { kind += '/-/' + encodeURIComponent(label[1]); heading = esc(label[1]); }
    else if (params.get('q')) { query += '&q=' + encodeURIComponent(params.get('q')); heading = 'Search <em>results.</em>'; }
    else if (month) {
      query += `&published-min=${month[1]}-${month[2]}-01T00:00:00&published-max=${new Date(Date.UTC(+month[1], +month[2], 1)).toISOString().slice(0, 19)}`;
      heading = 'From the <em>archive.</em>';
    }
    renderList(holder, await feed(kind, query), heading);
  };
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
  if (document.body.dataset.preview !== 'true' && window.fetch) {
    (categories[categoryKey] ? showCategory(categoryKey) : restoreBlog()).catch(() => {});
    restoreArchive().catch(() => {});
  }
  const labelPath = decoded(location.pathname);
  document.querySelectorAll('.filters a').forEach((link) => {
    const current = categoryKey ? link.dataset.filter === categoryKey : decoded(new URL(link.href, location.href).pathname) === labelPath;
    if (current) link.setAttribute('aria-current', 'page');
  });
  document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });
})();
