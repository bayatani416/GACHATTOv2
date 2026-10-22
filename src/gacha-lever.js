import { sfx, flash, shake, sleep, COLORS, finale } from './effects.js';
// レバー → ランプ3つが順に点灯 → 結果。ランプの色は抽選時に確定済みの show.lamps
export async function pullLever(show, { lever, lamps, stage }, calm) {
  lamps.forEach(l => { l.style.background = ''; l.className = ''; });
  stage.className = 'stage'; stage.textContent = '❓';
  show.anomaly === 'A02' ? sfx.odd() : sfx.pull(); await sleep(350);
  for (let i = 0; i < 3; i++) {
    await sleep(700);
    const n = show.lamps[i], c = COLORS[n];
    if (c === 'rainbow') lamps[i].className = 'rb'; else { lamps[i].style.background = c; if (n >= 2 && n < 4) flash(c, calm); }
    sfx.lamp(n);
  }
  await finale(show, calm);
}
