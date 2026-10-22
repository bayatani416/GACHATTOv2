import { load, save, record } from './save.js';
import { draw } from './engine.js';
import { sfx, flash } from './effects.js';
import { pullLever } from './gacha-lever.js';
import { pullHandle } from './gacha-handle.js';
import { dragLever, spinHandle } from './input.js';

const J = n => fetch(`data/${n}.json`).then(r => r.json());
const [raw, rarities, gachas, cfg, odds] = await Promise.all(['characters', 'rarities', 'gachas', 'config', 'anomalies'].map(J));
// 省略された項目は自動で補完（キャラ追加は id/name/emoji/rarity/desc だけでOK）
const chars = raw.map(c => ({ status: 'active', date: '2026-10-20', gachas: gachas.map(g => g.id), ...c }));
const live = chars.filter(c => c.status === 'active');
const S = load(), $ = document.getElementById('app');

const stats = () => { const g = live.filter(c => S.owned[c.id]).length; return { n: live.length, g, pct: Math.floor(g / live.length * 100) }; };
const fmt = d => d ? new Date(d).toLocaleString('ja-JP', { dateStyle: 'short', timeStyle: 'short' }) : '-';
const gname = id => gachas.find(g => g.id === id)?.name ?? id;
const left = g => live.filter(c => c.gachas.includes(g.id) && !S.owned[c.id]).length;
// 画像が無い間は絵文字、未取得はシルエット。画像を images/characters/ に置き、JSONに "image":"001.png" を書くと差し替わる
const face = (c, known = true) => `<div class="face${known ? '' : ' sil'}">${c.image ? `<img src="images/characters/${c.image}" alt="">` : c.emoji}</div>`;
const head = () => { const s = stats(); return `<div class="top"><b>図鑑 ${s.g} / ${s.n}（${s.pct}%）</b><div class="bar"><i style="width:${s.pct}%"></i></div></div>`; };

const screens = {
  home: () => `${head()}<h1>図鑑ガチャ</h1><div class="grid2">${gachas.map(g => g.ready
    ? `<button class="gbtn" data-go="gacha" data-arg="${g.id}"><span>${g.icon}</span>${g.name}<small>未発見 あと${left(g)}体</small></button>`
    : `<div class="gbtn off"><span>${g.icon}</span>${g.name}<small>準備中</small></div>`).join('')}</div>
    <button class="wide" data-go="zukan">📖 図鑑</button><button class="wide" data-go="history">🕘 履歴</button><button class="wide" data-go="odd">🔍 違和感図鑑 ${Object.keys(S.odd).length}/${odds.length}</button><div class="wide off">COMING SOON</div>
    <label class="calm"><input type="checkbox" id="calm" ${S.calm ? 'checked' : ''}> 演出控えめモード（点滅・揺れを減らす）</label>`,
  gacha: id => { const g = gachas.find(x => x.id === id); return `<button class="back" data-go="home">← もどる</button>${head()}<h2>${g.icon} ${g.name}</h2>
    <div class="machine">${g.type === 'handle' ? '' : '<div class="lamps"><i></i><i></i><i></i></div>'}<div id="stage" class="stage">❓</div><div id="lever" class="${g.type === 'handle' ? 'handle' : 'lever'}"></div></div>
    <p id="hint" class="hint">${g.type === 'handle' ? '🌀 ハンドルを押さえたまま、ぐるっと1周まわそう' : '⬇️ レバーを下までぐーっと引こう'}</p><div id="res"></div>`; },
  zukan: () => `<button class="back" data-go="home">← もどる</button>${head()}<div class="dex">${live.map(c => { const k = S.owned[c.id];
    return `<button class="card" data-id="${c.id}" style="border-color:${rarities[c.rarity].color}"><small>No.${c.id}</small>${face(c, !!k)}<b>${k ? c.name : '？？？'}</b></button>`; }).join('')}</div>`,
  history: () => `<button class="back" data-go="home">← もどる</button><h2>履歴（最新${cfg.historyMax}件）</h2><div class="hist">${S.history.map(h => {
    const c = chars.find(x => x.id === h.id); return `<div>${fmt(h.t)}　${gname(h.g)}　${h.r}　${c.name}${h.n ? '　NEW' : ''}</div>`; }).join('') || '<p>まだ履歴がありません</p>'}</div>`,
};
let busy = false;
const NUM = '①②③④⑤⑥⑦⑧⑨⑩';
screens.odd = () => `<button class="back" data-go="home">← もどる</button><h2>違和感図鑑 ${Object.keys(S.odd).length}/${odds.length}</h2><p>いつもと違う演出が出たら…？</p><div class="hist">${odds.map((a, i) => { const o = S.odd[a.id];
  return `<div>${NUM[i]}　${o ? `<b>${a.name}</b><br>${o.count}回　初回 ${fmt(o.first)}` : '？？？'}</div>`; }).join('')}</div>`;
const inits = { gacha: id => { const g = gachas.find(x => x.id === id); busy = false; (g.type === 'handle' ? spinHandle : dragLever)($.querySelector('#lever'), () => run(g), () => !busy); } };
function go(name, arg) { $.innerHTML = screens[name](arg); window.scrollTo(0, 0); inits[name]?.(arg); }

async function run(g) {
  busy = true; $.querySelector('#res').innerHTML = ''; $.querySelector('#hint').textContent = '…';
  const before = stats().pct;
  const r = draw({ chars, rarities, gacha: g, owned: S.owned, pity: S.pity, cfg, odds });  // ① 抽選
  const a = odds.find(o => o.id === r.show.anomaly), first = a && !S.odd[a.id];
  record(S, g.id, r, cfg.historyMax);                                                 // ② 結果確定＋保存
  await playShow(g, r, a, first); // ③ 演出
  reveal(r, before);                                                                  // ④ 結果表示
  busy = false; const h = $.querySelector('#hint'); if (h) h.textContent = 'もう一度どうぞ！';
  if (a) setTimeout(() => oddToast(a, first), 1500);   // 違和感の実績は、キャラが出てから
}

async function playShow(g, r, a, first) {
  document.body.dataset.odd = a?.id || '';                       // 違和感演出の見た目はCSSが担当
  if (a?.id === 'A07') setTimeout(cutin, 1000);
  const els = { lever: $.querySelector('#lever'), lamps: [...$.querySelectorAll('.lamps i')], stage: $.querySelector('#stage') };
  await (g.type === 'handle' ? pullHandle : pullLever)(r.show, els, S.calm);
  delete document.body.dataset.odd;
}
function oddToast(a, first) {   // 左上に実績カットイン
  const d = document.createElement('div'); d.className = 'oddtoast';
  d.innerHTML = `🔍 違和感演出${NUM[odds.indexOf(a)]} ${first ? '<b>NEW</b>' : ''}<br>${a.name}`;
  document.body.append(d); sfx.pico(); setTimeout(() => d.remove(), 3200);
}
function cutin() {
  const d = document.createElement('div'); d.className = 'cutin'; d.textContent = '🔥 激アツ！！ 🔥';
  document.body.append(d); sfx.kyuin(); setTimeout(() => d.remove(), 1000);
}
function reveal(r, before) {
  const c = r.char, rar = rarities[c.rarity], o = S.owned[c.id], s = stats(), st = $.querySelector('#stage');
  st.innerHTML = face(c); st.classList.add('pop');
  $.querySelector('.top').outerHTML = head();
  if (r.isNew) { sfx.fanfare(); flash('#fc0', S.calm); } else sfx.pico();
  $.querySelector('#res').innerHTML = `${r.isNew ? '<div class="new">NEW!</div>' : `<div class="dup">所持数 ×${o.count}</div>`}
    <div class="rar" style="color:${rar.color}">${c.rarity}</div><h3>No.${c.id} ${c.name}</h3><p>${c.desc}</p><p>図鑑 ${before}% → ${s.pct}%</p>`;
  const m = cfg.milestones.filter(m => before < m && s.pct >= m).pop();
  if (m) setTimeout(() => banner(m), 1200);
}
function banner(m) {
  const d = document.createElement('div'); d.className = 'banner'; d.textContent = m === 100 ? '図鑑コンプリート！！' : `図鑑 ${m}% 達成！`;
  document.body.append(d); sfx.fanfare(); flash('rainbow', S.calm); setTimeout(() => d.remove(), 2600);
}
function detail(id) {
  const c = chars.find(x => x.id === id), o = S.owned[id], m = document.createElement('div'); m.className = 'modal';
  m.innerHTML = `<div class="box">${face(c, !!o)}<h3>${o ? c.name : '？？？'}</h3><p>${o ? c.desc : 'まだ見つけていない。'}</p>
    <p style="color:${rarities[c.rarity].color}">${o ? c.rarity : 'レアリティ ？'}</p><p>所持数：${o ? o.count : 0}</p>
    <p>初回取得：${fmt(o?.first)}</p><p>最終取得：${fmt(o?.last)}</p><p>出現ガチャ：${c.gachas.map(gname).join('・')}</p><button class="wide">とじる</button></div>`;
  m.onclick = e => { if (e.target === m || e.target.tagName === 'BUTTON') m.remove(); };
  document.body.append(m);
}

$.addEventListener('click', e => { const t = e.target.closest('[data-go],[data-id]'); if (!t) return; t.dataset.go ? go(t.dataset.go, t.dataset.arg) : detail(t.dataset.id); });
$.addEventListener('change', e => { if (e.target.id === 'calm') { S.calm = e.target.checked; save(S); } });
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');
go('home');
