import { sfx, unlock } from './effects.js';
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
// レバー：上から下へドラッグ（マウス・タッチ共通）。下まで引けたら onDone
export function dragLever(el, onDone, canStart) {
  let y0 = null, last = 0;
  const back = () => { y0 = null; el.style.transition = 'transform .3s'; el.style.transform = ''; };
  el.onpointerdown = e => { if (!canStart()) return; unlock(); y0 = e.clientY; last = 0; el.setPointerCapture(e.pointerId); el.style.transition = 'none'; };
  el.onpointermove = e => {
    if (y0 == null) return;
    const p = clamp((e.clientY - y0) / 110, 0, 1);
    el.style.transform = `translateY(${p * 70}px)`;
    const step = Math.floor(p * 4); if (step > last) { last = step; sfx.lamp(step); }
    if (p >= 1) { back(); onDone(); }
  };
  el.onpointerup = el.onpointercancel = () => { if (y0 != null) back(); };
}
// ハンドル：押したまま円を描いて1周（時計回り）で onDone
export function spinHandle(el, onDone, canStart) {
  let a0 = null, rot = 0, tick = 0;
  const ang = e => { const r = el.getBoundingClientRect(); return Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)) * 180 / Math.PI; };
  const back = () => { a0 = null; el.style.transition = 'transform .3s'; el.style.transform = ''; };
  el.onpointerdown = e => { if (!canStart()) return; unlock(); a0 = ang(e); rot = 0; tick = 0; el.setPointerCapture(e.pointerId); el.style.transition = 'none'; };
  el.onpointermove = e => {
    if (a0 == null) return;
    const cur = ang(e); let d = cur - a0; a0 = cur;
    if (d > 180) d -= 360; if (d < -180) d += 360;
    rot = Math.max(0, rot + d); el.style.transform = `rotate(${rot}deg)`;
    const t = Math.floor(rot / 45); if (t > tick) { tick = t; sfx.tick(); }
    if (rot >= 360) { back(); onDone(); }
  };
  el.onpointerup = el.onpointercancel = () => { if (a0 != null) back(); };
}
