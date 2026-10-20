// 効果音は Web Audio で自動生成（音声ファイル不要）。後で本物の音源に差し替え可能。
let ac;
export function tone(f1, f2, dur, type = 'sawtooth', vol = .15, delay = 0) {
  try {
    ac ??= new (window.AudioContext || window.webkitAudioContext)();
    const t = ac.currentTime + delay, o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f1, t); o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.001, t + dur);
    o.connect(g).connect(ac.destination); o.start(t); o.stop(t + dur);
  } catch {}
}
export const sfx = {
  pull: () => tone(200, 80, .2, 'square'),
  lamp: n => tone(500 + n * 200, 500 + n * 200, .12, 'triangle'),
  kyuin: () => tone(400, 2400, .35),                       // キュイン
  don: () => tone(150, 30, .5, 'sine', .4),                // ドーン
  pico: () => { tone(880, 880, .1, 'square', .1); tone(1320, 1320, .2, 'square', .1, .1); },
  fanfare: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, f, .25, 'square', .12, i * .12)),
};
export const COLORS = ['#4af', '#4d4', '#f44', '#fc0', 'rainbow'];
export const sleep = ms => new Promise(r => setTimeout(r, ms));

// calm=true（演出控えめモード）のときは光を弱め、揺れを止める
export function flash(color, calm) {
  const d = document.createElement('div');
  const rb = color === 'rainbow' && !calm;
  d.className = 'flash' + (rb ? ' rainbow' : '') + (calm ? ' soft' : '');
  if (!rb) d.style.background = color === 'rainbow' ? '#fc0' : color;
  document.body.append(d); setTimeout(() => d.remove(), 1500);
}
export function shake(calm) {
  if (calm) return;
  document.body.classList.add('shake'); setTimeout(() => document.body.classList.remove('shake'), 500);
  navigator.vibrate?.([80, 40, 120]);
}
