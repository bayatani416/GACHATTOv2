// 効果音は Web Audio で自動生成（音声ファイル不要）。後で本物の音源に差し替え可能。
let ac;
const A = () => { ac ??= new (window.AudioContext || window.webkitAudioContext)(); if (ac.state === 'suspended') ac.resume(); return ac; };
// 音の最小部品：立ち上がりが速く、低音をカットすると「鋭い」音になる
function voice(f1, f2, dur, { type = 'sawtooth', vol = .15, delay = 0, detune = 0, hp = 0 } = {}) {
  try {
    const a = A(), t = a.currentTime + delay, o = a.createOscillator(), g = a.createGain();
    o.type = type; o.detune.value = detune;
    o.frequency.setValueAtTime(f1, t); o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + .008); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    let n = o; if (hp) { const h = a.createBiquadFilter(); h.type = 'highpass'; h.frequency.value = hp; o.connect(h); n = h; }
    n.connect(g).connect(a.destination); o.start(t); o.stop(t + dur + .02);
  } catch {}
}
function noise(dur, vol, hp, delay = 0) {
  try {
    const a = A(), t = a.currentTime + delay, b = a.createBuffer(1, a.sampleRate * dur, a.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    const s = a.createBufferSource(), h = a.createBiquadFilter(), g = a.createGain();
    s.buffer = b; h.type = 'highpass'; h.frequency.value = hp; g.gain.value = vol;
    s.connect(h).connect(g).connect(a.destination); s.start(t);
  } catch {}
}
export const sfx = {
  pull: () => { noise(.06, .3, 2000); voice(300, 120, .12, { type: 'square', vol: .15, hp: 200 }); },
  odd: () => { voice(80, 500, .3, { vol: .25, hp: 60 }); voice(3000, 300, .25, { type: 'square', vol: .12, hp: 500, delay: .05 }); }, // 違和感の音
  lamp: n => voice(1500 + n * 250, 1500 + n * 250, .07, { type: 'square', vol: .1, hp: 800 }),
  kyuin: () => { // 鋭い上昇音＋金属的な余韻
    voice(700, 4400, .2, { vol: .2, detune: -15, hp: 900 }); voice(700, 4400, .2, { vol: .2, detune: 15, hp: 900 });
    voice(4400, 4400, .3, { type: 'sine', vol: .12, delay: .2 });
  },
  don: () => { voice(140, 30, .6, { type: 'sine', vol: .5 }); noise(.4, .35, 300); },
  pico: () => { voice(1800, 1800, .06, { type: 'square', vol: .1, hp: 800 }); voice(2700, 2700, .14, { type: 'square', vol: .1, hp: 800, delay: .07 }); },
  fanfare: () => { [523, 659, 784, 1047].forEach((f, i) => voice(f, f, .3, { type: 'square', vol: .1, delay: i * .11, hp: 300 })); voice(2093, 2093, .5, { type: 'sine', vol: .1, delay: .45 }); },
  tick: () => noise(.02, .3, 1500),
  ratchet: () => { for (let i = 0; i < 8; i++) noise(.02, .25, 1500, i * .13); },
  capsule: () => { voice(250, 650, .1, { type: 'sine', vol: .3 }); noise(.05, .2, 1000); },
  pop: () => { noise(.15, .3, 800); voice(600, 1200, .15, { type: 'triangle', vol: .2 }); },
};
// 0青 1緑 2赤 3金 4レインボー 5黒（黒は普通ありえない色）
export const unlock = () => { try { A(); } catch {} };   // iPhone対策：最初のタッチで音を有効化
export const COLORS = ['#4af', '#4d4', '#f44', '#fc0', 'rainbow', '#000'];
export const sleep = ms => new Promise(r => setTimeout(r, ms));

export function flash(color, calm) {   // calm=演出控えめモード：光を弱める
  const d = document.createElement('div'), rb = color === 'rainbow' && !calm;
  d.className = 'flash' + (rb ? ' rainbow' : '') + (calm ? ' soft' : '');
  if (!rb) d.style.background = color === 'rainbow' ? '#fc0' : color;
  document.body.append(d); setTimeout(() => d.remove(), 1500);
}
export function shake(calm) {
  if (calm) return;
  document.body.classList.add('shake'); setTimeout(() => document.body.classList.remove('shake'), 500);
  navigator.vibrate?.([80, 40, 120]);
}
// 全ガチャ共通のクライマックス（開く直前）
export async function finale(show, calm) {
  await sleep(600);
  if (show.tier >= 2) sfx.kyuin();
  if (show.confirm) { flash('rainbow', calm); shake(calm); sfx.don(); await sleep(1400); }
  else if (show.tier >= 3) { flash('#fc0', calm); sfx.don(); await sleep(900); }
}
