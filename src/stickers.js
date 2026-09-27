/* Stickers on posts, shared by every reader: a small dock follows the reader down the post and opens on hover;
   a sticker can be pinned anywhere on the page. Each reader may keep three per post.
   Storage is a small Firebase project (Firestore + anonymous sign-in) reached over its REST API, so no SDK is loaded.
   The Firestore rules (see README) enforce the limits; this file only draws and asks. */
(() => {
  'use strict';
  const cfg = window.TYB_STICKERS;
  if (!cfg || !window.fetch) return;

  const LIMIT = 3;
  const line = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const KINDS = {
    star: { color: '#BA9F0D', label: 'Star', svg: line('<path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6-4.5-4.2 6.1-.7z"/>') },
    heart: { color: '#E131BD', label: 'Heart', svg: line('<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>') },
    spark: { color: '#0FA077', label: 'Spark', svg: line('<path d="M12 2v5M12 17v5M2 12h5M17 12h5M5 5l3.5 3.5M15.5 15.5L19 19M19 5l-3.5 3.5M8.5 15.5L5 19"/>') },
    moon: { color: '#956BCF', label: 'Moon', svg: line('<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>') },
    leaf: { color: '#3ED900', label: 'Leaf', svg: line('<path d="M5 19c0-9 6-14 15-14 0 9-5 15-14 15"/><path d="M5 19l8-8"/>') },
    eye: { color: '#2F42E8', label: 'Eye', svg: line('<path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6S2 12 2 12z"/><circle cx="12" cy="12" r="2.5"/>') },
  };

  // Storage: the live Firebase project, or (in the design preview) this browser only.
  const store = (() => {
    const read = (key) => { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } };
    const write = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* optional */ } };
    if (cfg.demo) {
      const key = 'tyb-stickers-demo';
      return {
        uid: async () => 'me',
        list: async (post) => (read(key) || []).filter((o) => o.post === post),
        put: async (s) => { const all = (read(key) || []).filter((o) => o.id !== s.id); all.push(s); write(key, all); },
        remove: async (id) => write(key, (read(key) || []).filter((o) => o.id !== id)),
        likes: async (post) => (read(key + ':likes:' + post) || 0),
        like: async (post) => write(key + ':likes:' + post, (read(key + ':likes:' + post) || 0) + 1),
      };
    }
    const base = `https://firestore.googleapis.com/v1/projects/${cfg.projectId}/databases/(default)/documents`;
    const docName = (id) => `projects/${cfg.projectId}/databases/(default)/documents/stickers/${id}`;
    const authKey = 'tyb-sticker-auth';
    let auth = read(authKey);
    const token = async () => {
      if (auth && auth.exp > Date.now() + 60000) return auth;
      let r;
      if (auth && auth.refresh) {
        r = await fetch(`https://securetoken.googleapis.com/v1/token?key=${cfg.apiKey}`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'grant_type=refresh_token&refresh_token=' + encodeURIComponent(auth.refresh) });
        if (r.ok) { const d = await r.json(); auth = { id: d.id_token, refresh: d.refresh_token, uid: d.user_id, exp: Date.now() + d.expires_in * 1000 }; write(authKey, auth); return auth; }
      }
      r = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${cfg.apiKey}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"returnSecureToken":true}' });
      if (!r.ok) throw new Error('sign-in');
      const d = await r.json();
      auth = { id: d.idToken, refresh: d.refreshToken, uid: d.localId, exp: Date.now() + d.expiresIn * 1000 };
      write(authKey, auth);
      return auth;
    };
    const num = (f) => Number(f && (f.doubleValue ?? f.integerValue));
    return {
      uid: async () => (await token()).uid,
      known: () => auth && auth.uid,
      list: async (post) => {
        const r = await fetch(`${base}:runQuery`, { method: 'POST', cache: 'no-store', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ structuredQuery: {
          from: [{ collectionId: 'stickers' }], where: { fieldFilter: { field: { fieldPath: 'post' }, op: 'EQUAL', value: { stringValue: post } } }, limit: 300,
        } }) });
        if (!r.ok) throw new Error('read');
        return (await r.json()).filter((row) => row.document).map(({ document: doc }) => ({ id: doc.name.split('/').pop(), uid: doc.fields.uid?.stringValue, post: doc.fields.post?.stringValue, name: doc.fields.name?.stringValue || '', kind: doc.fields.kind?.stringValue, x: num(doc.fields.x), y: num(doc.fields.y) }));
      },
      put: async (s) => {
        const a = await token();
        const r = await fetch(`${base}:commit`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + a.id }, body: JSON.stringify({ writes: [{
          update: { name: docName(s.id), fields: Object.assign({ uid: { stringValue: a.uid }, post: { stringValue: s.post }, kind: { stringValue: s.kind }, x: { doubleValue: s.x }, y: { doubleValue: s.y } }, s.name ? { name: { stringValue: s.name } } : {}) },
          updateTransforms: [{ fieldPath: 't', setToServerValue: 'REQUEST_TIME' }],
        }] }) });
        if (!r.ok) throw new Error(r.status === 403 ? 'wait' : 'write');
      },
      // Likes: one document per reader per post; the count comes from Firestore's count query.
      likes: async (post) => {
        const r = await fetch(`${base}:runAggregationQuery`, { method: 'POST', cache: 'no-store', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ structuredAggregationQuery: {
          structuredQuery: { from: [{ collectionId: 'likes' }], where: { fieldFilter: { field: { fieldPath: 'post' }, op: 'EQUAL', value: { stringValue: post } } } },
          aggregations: [{ alias: 'n', count: {} }],
        } }) });
        if (!r.ok) throw new Error('read');
        const d = await r.json();
        return Number(d[0]?.result?.aggregateFields?.n?.integerValue || 0);
      },
      like: async (post) => {
        const a = await token();
        const r = await fetch(`${base}:commit`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + a.id }, body: JSON.stringify({ writes: [{
          update: { name: `projects/${cfg.projectId}/databases/(default)/documents/likes/${a.uid}_${post}`, fields: { uid: { stringValue: a.uid }, post: { stringValue: post } } },
          updateTransforms: [{ fieldPath: 't', setToServerValue: 'REQUEST_TIME' }],
          currentDocument: { exists: false },
        }] }) });
        if (!r.ok && r.status !== 403 && r.status !== 409 && r.status !== 400) throw new Error('write');
      },
      remove: async (id) => {
        const a = await token();
        const r = await fetch(`${base}/stickers/${id}`, { method: 'DELETE', headers: { Authorization: 'Bearer ' + a.id } });
        if (!r.ok) throw new Error('delete');
      },
    };
  })();

  // Stickers are anchored to the text, not to page coordinates, so they stay by the same word on every screen width.
  // y = position of the nearest character within the post's text (0..1); x = sideways offset from that character,
  // as a share of the text column's width (0.5 means directly on it).
  const textNodes = (body) => {
    const out = [], walk = document.createTreeWalker(body, NodeFilter.SHOW_TEXT, { acceptNode: (n) => n.parentElement.closest('script, style, noscript') || !n.data.trim() ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT });
    let total = 0;
    for (let n = walk.nextNode(); n; n = walk.nextNode()) { out.push({ n, start: total }); total += n.data.length; }
    return { nodes: out, total };
  };
  const caretAt = (x, y) => {
    if (document.caretPositionFromPoint) { const c = document.caretPositionFromPoint(x, y); return c && { node: c.offsetNode, offset: c.offset }; }
    if (document.caretRangeFromPoint) { const r = document.caretRangeFromPoint(x, y); return r && { node: r.startContainer, offset: r.startOffset }; }
    return null;
  };
  const charRect = (node, offset) => {
    const range = document.createRange(), len = node.data.length;
    const a = Math.min(Math.max(0, offset), Math.max(0, len - 1));
    range.setStart(node, a); range.setEnd(node, Math.min(len, a + 1));
    return range.getClientRects()[0] || range.getBoundingClientRect();
  };
  const note = (dock, text) => { dock.querySelector('.sticker-note').textContent = text; };
  const attach = (page) => {
    if (!page || page.dataset.stickers || page.closest('[hidden]')) return;
    const post = page.dataset.postId || (document.body.dataset.preview === 'true' ? 'preview' : '');
    if (!/^[0-9]+$/.test(post) && post !== 'preview') return;
    page.dataset.stickers = 'true';
    page.classList.add('has-stickers');
    const layer = document.createElement('div');
    layer.className = 'sticker-layer';
    page.append(layer);
    // The dock: minimised to a small round button that stays in view; it opens on hover or tap.
    const dock = document.createElement('div');
    dock.className = 'sticker-dock';
    dock.innerHTML = `<button type="button" class="sticker-toggle" aria-expanded="false" aria-label="Leave a sticker">${KINDS.spark.svg}<span class="sticker-count"></span></button><div class="sticker-tray"><p class="micro">Leave a sticker</p><div class="sticker-kinds">${Object.entries(KINDS).map(([k, v]) => `<button type="button" data-kind="${k}" style="--c:${v.color}" aria-label="${v.label}">${v.svg}</button>`).join('')}</div><label class="sticker-name"><span class="sr-only">Your name, optional</span><input type="text" maxlength="10" autocomplete="nickname" spellcheck="false" placeholder="Your name (optional)"/></label><p class="sticker-note micro muted" aria-live="polite">Pick one, then tap anywhere on the post.</p></div>`;
    document.body.append(dock);
    const toggle = dock.querySelector('.sticker-toggle'), nameField = dock.querySelector('.sticker-name input');
    // A name is optional: one word of letters (any script), at most ten.
    const cleanName = (value) => Array.from(((value || '').match(/[\p{L}\p{M}]+/u) || [''])[0]).slice(0, 10).join('');
    try { nameField.value = cleanName(localStorage.getItem('tyb-sticker-name')); } catch { /* optional */ }
    nameField.addEventListener('input', () => {
      const clean = cleanName(nameField.value);
      if (clean !== nameField.value) nameField.value = clean;
      try { localStorage.setItem('tyb-sticker-name', clean); } catch { /* optional */ }
    });
    let all = [], me = store.known ? store.known() : 'me', picking = null;
    const mine = () => all.filter((s) => s.uid === me);
    const body = page.querySelector('.article-body') || page;
    const draw = () => {
      const { nodes, total } = textNodes(body), pageBox = page.getBoundingClientRect(), bodyBox = body.getBoundingClientRect();
      const place = (s) => {
        if (!nodes.length) return null;
        const at = Math.min(total - 1, Math.round(s.y * total));
        const hit = nodes.find((item, i) => i === nodes.length - 1 || nodes[i + 1].start > at);
        const r = charRect(hit.n, at - hit.start);
        if (!r || (!r.width && !r.height)) return null;
        // Sit on the top edge of the line, in the gap above the word, so the word itself stays readable.
        const left = Math.min(pageBox.width - 12, Math.max(12, r.left - pageBox.left + (s.x - .5) * bodyBox.width));
        return { left, top: r.top - pageBox.top - 3 };
      };
      layer.replaceChildren(...all.filter((s) => KINDS[s.kind] && s.x >= 0 && s.x <= 1 && s.y >= 0 && s.y <= 1).map((s) => ({ s, at: place(s) })).filter((o) => o.at).map(({ s, at }) => {
        // Hover (or tap, on touch screens) shows who left it; your own also shows a small × to remove it.
        const own = s.uid === me, el = document.createElement('span');
        el.className = 'sticker' + (own ? ' is-mine' : '');
        el.style.left = at.left + 'px';
        el.style.top = at.top + 'px';
        el.style.setProperty('--c', KINDS[s.kind].color);
        el.tabIndex = 0;
        el.setAttribute('role', 'button');
        el.setAttribute('aria-label', `${KINDS[s.kind].label} sticker${s.name ? ' from ' + s.name : ''}${own ? ' (yours)' : ''}`);
        el.innerHTML = KINDS[s.kind].svg;
        const label = cleanName(s.name) || (own ? 'You' : '');
        if (label) { const tip = document.createElement('span'); tip.className = 'sticker-tip'; tip.textContent = label; el.append(tip); }
        if (own) {
          const x = document.createElement('button');
          x.type = 'button';
          x.className = 'sticker-x';
          x.setAttribute('aria-label', 'Remove your sticker');
          x.textContent = '×';
          x.addEventListener('click', async (event) => {
            event.stopPropagation();
            try { await store.remove(s.id); all = all.filter((o) => o.id !== s.id); draw(); note(dock, 'Removed.'); } catch { note(dock, 'Could not remove it just now.'); }
          });
          el.append(x);
        }
        el.addEventListener('click', (event) => {
          event.stopPropagation();
          const on = !el.classList.contains('is-active');
          layer.querySelectorAll('.sticker.is-active').forEach((o) => o.classList.remove('is-active'));
          el.classList.toggle('is-active', on);
        });
        return el;
      }));
      const left = Math.max(0, LIMIT - mine().length);
      dock.querySelector('.sticker-count').textContent = left;
      toggle.setAttribute('aria-label', `Leave a sticker (${left} left)`);
    };
    const refresh = async () => { try { all = await store.list(post); draw(); } catch { /* keep what is shown */ } };
    const stop = () => { picking = null; document.body.classList.remove('is-placing'); dock.querySelectorAll('[data-kind]').forEach((b) => b.removeAttribute('aria-pressed')); };
    // The small button toggles the tray on every device. On a desktop the tray also opens on hover; tapping the
    // button while it is open closes it, and it stays closed until the pointer leaves the dock.
    const hoverable = window.matchMedia && window.matchMedia('(hover: hover)').matches;
    toggle.addEventListener('click', () => {
      const shown = dock.classList.contains('is-open') || (hoverable && dock.matches(':hover') && !dock.classList.contains('is-shut'));
      dock.classList.toggle('is-open', !shown);
      dock.classList.toggle('is-shut', shown);
      toggle.setAttribute('aria-expanded', String(!shown));
      if (shown) { stop(); toggle.blur(); }
    });
    dock.addEventListener('mouseleave', () => dock.classList.remove('is-shut'));
    document.addEventListener('click', (event) => { if (!event.target.closest('.sticker')) layer.querySelectorAll('.sticker.is-active').forEach((o) => o.classList.remove('is-active')); });
    dock.querySelectorAll('[data-kind]').forEach((b) => b.addEventListener('click', () => {
      if (mine().length >= LIMIT) { note(dock, 'You have placed all three here. Press × on one of yours to remove it.'); return; }
      stop();
      picking = b.dataset.kind;
      b.setAttribute('aria-pressed', 'true');
      document.body.classList.add('is-placing');
      note(dock, 'Now tap anywhere on the post.');
    }));
    document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && picking) { stop(); note(dock, 'Pick one, then tap anywhere on the post.'); } });
    page.addEventListener('click', async (event) => {
      if (!picking || event.target.closest('.sticker-dock, .sticker, .post-actions, .comments, .read-more, iframe')) return;
      event.preventDefault();
      // Find the character nearest the tap inside the text column, then remember how far to the side the tap was.
      const bodyBox = body.getBoundingClientRect();
      const cx = Math.min(bodyBox.right - 2, Math.max(bodyBox.left + 2, event.clientX)), cy = Math.min(bodyBox.bottom - 2, Math.max(bodyBox.top + 2, event.clientY));
      const { nodes, total } = textNodes(body), caret = caretAt(cx, cy);
      const hit = caret && nodes.find((item) => item.n === caret.node);
      if (!hit || !total) { note(dock, 'Tap closer to the writing.'); return; }
      const r = charRect(hit.n, caret.offset);
      const y = Math.round(((hit.start + Math.min(caret.offset, hit.n.data.length - 1)) / total) * 1e6) / 1e6;
      const x = Math.round(Math.min(1, Math.max(0, .5 + (event.clientX - r.left) / bodyBox.width)) * 1e4) / 1e4;
      const kind = picking;
      stop();
      try {
        me = await store.uid();
        const used = new Set(mine().map((s) => s.id));
        const slot = [0, 1, 2].map((n) => `${me}_${post}_${n}`).find((id) => !used.has(id));
        if (!slot) { note(dock, 'You have placed all three here. Press × on one of yours to remove it.'); return; }
        const name = cleanName(nameField.value);
        const sticker = Object.assign({ id: slot, uid: me, post, kind, x, y }, name ? { name } : {});
        await store.put(sticker);
        all = all.filter((o) => o.id !== slot).concat(sticker);
        draw();
        note(dock, mine().length >= LIMIT ? 'Pinned. That was your last one here.' : 'Pinned. Everyone can see it.');
      } catch (error) {
        note(dock, error.message === 'wait' ? 'Too quick. Try again in half a minute.' : 'Could not save it just now.');
      }
    }, true);
    refresh();
    // The like button under the post shows its count in the middle, kept in the same Firebase project.
    const likeButton = page.querySelector('.like-button');
    const showLikes = (n) => { const out = likeButton && likeButton.querySelector('.like-count'); if (out) { out.textContent = n; likeButton.setAttribute('aria-label', `Like this piece. ${n} ${n === 1 ? 'like' : 'likes'} so far`); } };
    let likes = 0;
    const countLikes = async () => { try { likes = await store.likes(post); showLikes(likes); } catch { /* keep what is shown */ } };
    if (likeButton) countLikes();
    window.addEventListener('tyb:like', async (event) => {
      if (!page.isConnected || event.detail.button !== likeButton) return;
      if (!event.detail.already) showLikes(likes + 1);
      try { await store.like(post); } catch { /* the animation already answered the reader */ }
      countLikes();
    });
    // Reflow (new width, reading size, fonts arriving) moves the words; move the stickers with them.
    let queued = 0;
    const relayout = () => { cancelAnimationFrame(queued); queued = requestAnimationFrame(draw); };
    if ('ResizeObserver' in window) new ResizeObserver(relayout).observe(body);
    if (document.fonts) document.fonts.ready.then(relayout);
    setInterval(() => { if (!document.hidden && page.isConnected) refresh(); }, 25000);
    // A post rebuilt by the page (after an edit in the dashboard) gets a fresh layer; drop this dock.
    const gone = new MutationObserver(() => { if (!page.isConnected) { dock.remove(); gone.disconnect(); } });
    gone.observe(document.body, { childList: true, subtree: true });
  };
  const scan = () => {
    document.querySelectorAll('.reading-page').forEach(attach);
    // The design preview hides and shows its reading page; the dock follows it.
    document.querySelectorAll('.sticker-dock').forEach((dock) => { dock.hidden = !document.querySelector('.reading-page.has-stickers:not([hidden])') || !!document.querySelector('.reading-page.has-stickers')?.closest('[hidden]'); });
  };
  scan();
  window.addEventListener('tyb:render', scan);
  window.addEventListener('hashchange', () => setTimeout(scan, 50));
})();
