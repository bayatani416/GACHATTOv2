// セーブデータ（ブラウザ内に保存）。version は将来のデータ形式変更用。
const KEY = 'zukan-save-v1';
const blank = () => ({ version: 1, first: null, last: null, total: 0, byGacha: {}, ssr: 0, sr: 0, owned: {}, history: [], pity: 0, calm: false });
export function load() { try { return { ...blank(), ...JSON.parse(localStorage.getItem(KEY)) }; } catch { return blank(); } }
export function save(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {} }

export function record(s, gid, res, max) {
  const now = new Date().toISOString(), c = res.char, o = s.owned[c.id];
  s.first ??= now; s.last = now; s.total++;
  s.byGacha[gid] = (s.byGacha[gid] || 0) + 1;
  if (c.rarity === 'SSR') s.ssr++;
  if (c.rarity === 'SR') s.sr++;
  s.owned[c.id] = o ? { ...o, count: o.count + 1, last: now } : { count: 1, first: now, last: now };
  s.pity = res.isNew ? 0 : s.pity + 1;
  s.history.unshift({ t: now, g: gid, id: c.id, r: c.rarity, n: res.isNew });
  s.history.length = Math.min(s.history.length, max);
  save(s);
}
