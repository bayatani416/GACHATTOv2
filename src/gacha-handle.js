import { sfx, flash, sleep, COLORS, finale } from './effects.js';
// ハンドル回転 → カプセルがポンと出る → 色が昇格（緑→赤→金など）→ 開く。色=信頼度
export async function pullHandle(show, { lever: handle, stage }, calm) {
  stage.className = 'stage'; stage.innerHTML = '<div class="capsule" style="visibility:hidden"></div>';
  const cap = stage.firstChild;
  const paint = n => { const c = COLORS[n]; cap.classList.toggle('rb', c === 'rainbow'); cap.style.background = c === 'rainbow' ? '' : c; };
  if (show.anomaly === 'A02') sfx.odd();
  await sleep(300);
  paint(show.lamps[0]); cap.style.visibility = 'visible'; cap.classList.add('drop'); sfx.capsule(); await sleep(900);
  for (let i = 1; i < 3; i++) {
    const n = show.lamps[i]; if (n === show.lamps[i - 1]) continue;
    await sleep(700); paint(n);
    if (n > show.lamps[i - 1]) { sfx.kyuin(); if (n < 4) flash(COLORS[n], calm); } else sfx.lamp(n);   // 昇格はキュイン
  }
  await finale(show, calm);
  cap.classList.add('open'); sfx.pop(); await sleep(500);
}
