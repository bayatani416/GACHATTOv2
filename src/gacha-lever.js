import { sfx, flash, shake, sleep, COLORS } from './effects.js';
// レバー → ランプ3つが順に点灯（徐々に格上げ）→ 結果。show は抽選時に確定済み。
export async function pullLever(show, { lever, lamps, stage }, calm) {
  lamps.forEach(l => { l.style.background = ''; l.className = ''; });
  stage.className = 'stage'; stage.textContent = '❓';
  sfx.pull(); lever.classList.add('pulled'); await sleep(450); lever.classList.remove('pulled');
  const t = show.tier, cols = [Math.max(0, t - 2), Math.max(0, t - 1), t];
  for (let i = 0; i < 3; i++) {
    await sleep(700);
    const c = COLORS[cols[i]];
    if (c === 'rainbow') lamps[i].className = 'rb'; else { lamps[i].style.background = c; if (cols[i] >= 2) flash(c, calm); }
    sfx.lamp(cols[i]);
  }
  await sleep(600);
  if (t >= 2) sfx.kyuin();
  if (show.confirm) { flash('rainbow', calm); shake(calm); sfx.don(); await sleep(1400); }   // レインボー＝確定
  else if (t >= 3) { flash('#fc0', calm); sfx.don(); await sleep(900); }
}
