/* Progressive enhancements shared by the preview and Blogger. No dependencies. */
(() => {
  'use strict';
  const q = (s) => document.querySelector(s);
  document.querySelectorAll('[data-art]').forEach((art) => {
    let composition = 0;
    art.addEventListener('click', () => {
      art.classList.remove('art-shift-1', 'art-shift-2');
      composition = (composition + 1) % 3;
      if (composition) art.classList.add('art-shift-' + composition);
    });
  });
  let activeOverlay = null;
  let returnFocus = null;
  const setBackgroundInert = (value) => document.querySelectorAll('.site-header,main,.about,.footer').forEach((el) => { el.inert = value; });
  const closeOverlay = () => {
    if (!activeOverlay) return;
    activeOverlay.hidden = true;
    activeOverlay = null;
    document.body.classList.remove('menu-open');
    setBackgroundInert(false);
    document.querySelectorAll('[data-open]').forEach((el) => el.setAttribute('aria-expanded', 'false'));
    if (returnFocus && returnFocus.isConnected) returnFocus.focus();
  };
  document.querySelectorAll('[data-open]').forEach((trigger) => {
    trigger.hidden = false;
    trigger.addEventListener('click', () => {
      const target = document.getElementById(trigger.dataset.open);
      if (!target) return;
      closeOverlay();
      returnFocus = trigger;
      activeOverlay = target;
      target.hidden = false;
      document.body.classList.add('menu-open');
      setBackgroundInert(true);
      trigger.setAttribute('aria-expanded', 'true');
      (target.querySelector('input') || target.querySelector('[data-close]')).focus();
    });
  });
  document.querySelectorAll('[data-close]').forEach((button) => button.addEventListener('click', closeOverlay));
  document.querySelectorAll('.overlay a').forEach((link) => link.addEventListener('click', closeOverlay));
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
  window.addEventListener('tyb:render', () => { language(); updateSize(); queueProgress(); });
  const decoded = (value) => { try { return decodeURIComponent(value); } catch { return value; } };
  const labelPath = decoded(location.pathname);
  document.querySelectorAll('.filters a').forEach((link) => {
    if (decoded(new URL(link.href, location.href).pathname) === labelPath) link.setAttribute('aria-current', 'page');
  });
  document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });
  document.querySelectorAll('a[href="#archive"]').forEach((link) => link.addEventListener('click', () => {
    const archive = document.getElementById('archive');
    if (archive && archive.tagName === 'DETAILS') archive.open = true;
  }));
})();
