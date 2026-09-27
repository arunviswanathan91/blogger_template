/* Stickers on the opening drawing, shared by every reader. Each reader may keep three.
   Storage is a small Firebase project (Firestore + anonymous sign-in) reached over its REST API, so no SDK is loaded.
   The Firestore rules (see README) enforce the limits; this file only draws and asks. */
(() => {
  'use strict';
  const cfg = window.TYB_STICKERS;
  const hero = document.querySelector('.hero');
  const bottom = hero && hero.querySelector('.hero-bottom');
  if (!cfg || !hero || !bottom || !window.fetch) return;

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
        list: async () => read(key) || [],
        put: async (s) => { const all = (read(key) || []).filter((o) => o.id !== s.id); all.push(s); write(key, all); },
        remove: async (id) => write(key, (read(key) || []).filter((o) => o.id !== id)),
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
      list: async () => {
        const r = await fetch(`${base}/stickers?pageSize=300`, { cache: 'no-store' });
        if (!r.ok) throw new Error('read');
        const d = await r.json();
        return (d.documents || []).map((doc) => ({ id: doc.name.split('/').pop(), uid: doc.fields.uid?.stringValue, kind: doc.fields.kind?.stringValue, x: num(doc.fields.x), y: num(doc.fields.y), t: doc.fields.t?.timestampValue || '' }));
      },
      put: async (s) => {
        const a = await token();
        const r = await fetch(`${base}:commit`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + a.id }, body: JSON.stringify({ writes: [{
          update: { name: docName(s.id), fields: { uid: { stringValue: a.uid }, kind: { stringValue: s.kind }, x: { doubleValue: s.x }, y: { doubleValue: s.y } } },
          updateTransforms: [{ fieldPath: 't', setToServerValue: 'REQUEST_TIME' }],
        }] }) });
        if (!r.ok) throw new Error(r.status === 403 ? 'wait' : 'write');
      },
      remove: async (id) => {
        const a = await token();
        const r = await fetch(`${base}/stickers/${id}`, { method: 'DELETE', headers: { Authorization: 'Bearer ' + a.id } });
        if (!r.ok) throw new Error('delete');
      },
    };
  })();

  const layer = document.createElement('div');
  layer.className = 'sticker-layer';
  hero.append(layer);
  const control = document.createElement('div');
  control.className = 'sticker-control';
  control.innerHTML = `<button type="button" class="sticker-toggle" aria-expanded="false">${KINDS.spark.svg}<span>Leave a sticker</span></button><div class="sticker-tray" hidden="hidden"><p class="micro">Pick one, then tap the drawing.</p><div class="sticker-kinds">${Object.entries(KINDS).map(([k, v]) => `<button type="button" data-kind="${k}" style="--c:${v.color}" aria-label="${v.label}">${v.svg}</button>`).join('')}</div><p class="sticker-note micro muted" aria-live="polite"></p></div>`;
  bottom.querySelector('.hero-aside')?.after(control);
  const toggle = control.querySelector('.sticker-toggle'), tray = control.querySelector('.sticker-tray'), note = control.querySelector('.sticker-note');

  let all = [], me = store.known ? store.known() : 'me', picking = null;
  const mine = () => all.filter((s) => s.uid === me);
  const say = (text) => { note.textContent = text; };
  const draw = () => {
    layer.replaceChildren(...all.filter((s) => KINDS[s.kind] && s.x >= 0 && s.x <= 1 && s.y >= 0 && s.y <= 1).map((s) => {
      const el = document.createElement(s.uid === me ? 'button' : 'span');
      el.className = 'sticker' + (s.uid === me ? ' is-mine' : '');
      el.style.left = (s.x * 100) + '%';
      el.style.top = (s.y * 100) + '%';
      el.style.setProperty('--c', KINDS[s.kind].color);
      el.innerHTML = KINDS[s.kind].svg;
      if (s.uid === me) {
        el.type = 'button';
        el.setAttribute('aria-label', 'Remove your ' + KINDS[s.kind].label.toLowerCase() + ' sticker');
        el.title = 'Your sticker: tap to remove';
        el.addEventListener('click', async (event) => {
          event.stopPropagation();
          try { await store.remove(s.id); all = all.filter((o) => o.id !== s.id); draw(); say('Removed.'); } catch { say('Could not remove it just now.'); }
        });
      }
      return el;
    }));
    toggle.querySelector('span').textContent = `Leave a sticker (${Math.max(0, LIMIT - mine().length)})`;
  };
  const refresh = async () => { try { all = await store.list(); draw(); } catch { /* keep what is shown */ } };

  const stop = () => { picking = null; hero.classList.remove('is-placing'); control.querySelectorAll('[data-kind]').forEach((b) => b.removeAttribute('aria-pressed')); };
  toggle.addEventListener('click', () => {
    tray.hidden = !tray.hidden;
    toggle.setAttribute('aria-expanded', String(!tray.hidden));
    if (tray.hidden) stop(); else say(mine().length >= LIMIT ? 'You have placed all three. Tap one of yours to remove it.' : '');
  });
  control.querySelectorAll('[data-kind]').forEach((b) => b.addEventListener('click', () => {
    if (mine().length >= LIMIT) { say('You have placed all three. Tap one of yours to remove it.'); return; }
    stop();
    picking = b.dataset.kind;
    b.setAttribute('aria-pressed', 'true');
    hero.classList.add('is-placing');
    say('Now tap anywhere on the drawing.');
  }));
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && picking) { stop(); say(''); } });
  hero.addEventListener('click', async (event) => {
    if (!picking || event.target.closest('.sticker-control, a, .panel-tab, .sticker')) return;
    const box = hero.getBoundingClientRect();
    const x = Math.round(((event.clientX - box.left) / box.width) * 1000) / 1000, y = Math.round(((event.clientY - box.top) / box.height) * 1000) / 1000;
    const kind = picking;
    stop();
    try {
      me = await store.uid();
      const used = new Set(mine().map((s) => s.id));
      const slot = [0, 1, 2].map((n) => `${me}_${n}`).find((id) => !used.has(id));
      if (!slot) { say('You have placed all three. Tap one of yours to remove it.'); return; }
      const sticker = { id: slot, uid: me, kind, x, y };
      await store.put(sticker);
      all = all.filter((o) => o.id !== slot).concat(sticker);
      draw();
      say(mine().length >= LIMIT ? 'Placed. That was your last one.' : 'Placed. Everyone can see it.');
    } catch (error) {
      say(error.message === 'wait' ? 'Too quick. Try again in half a minute.' : 'Could not save it just now.');
    }
  });

  refresh();
  setInterval(() => { if (!document.hidden && document.querySelector('.panel-opening.is-active')) refresh(); }, 25000);
})();
