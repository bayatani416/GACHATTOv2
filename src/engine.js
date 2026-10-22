// 抽選エンジン：ここで結果と演出（違和感演出も）を先に確定する。演出は結果を変えない。
const rnd = Math.random;
const pick = a => a[Math.floor(rnd() * a.length)];

export function weightedPick(items, weightOf) {
  let r = rnd() * items.reduce((s, i) => s + weightOf(i), 0);
  for (const i of items) { r -= weightOf(i); if (r < 0) return i; }
  return items[items.length - 1];
}

// lamps: 3段階の色 (0青 1緑 2赤 3金 4レインボー 5黒)。ルール：赤以上はSR以上でしか出ない
function makeShow(rar, odds, cfg) {
  if (rar.level >= 4) return { tier: 4, fake: false, confirm: true, lamps: [2, 3, 4] };        // UR：必ず虹
  if (rar.level === 3 && rnd() < cfg.confirmRate) {                                            // SSRの一部は違和感演出＝確定
    const a = pick(odds);
    return { tier: 3, fake: false, confirm: true, anomaly: a.id, lamps: a.lamps ?? [1, 2, 3] };
  }
  let tier = rar.level, fake = false;
  if (rar.level === 0 && rnd() < 0.2) { tier = 1; fake = true; }                               // ガセは緑まで
  return { tier, fake, confirm: false, lamps: [Math.max(0, tier - 2), Math.max(0, tier - 1), tier] };
}

export function draw({ chars, rarities, gacha, owned, pity, cfg, odds }) {
  const pool = chars.filter(c => c.status === 'active' && c.gachas.includes(gacha.id));
  const rw = r => gacha.rarityWeight?.[r] ?? rarities[r].weight;
  const n = {}; pool.forEach(c => n[c.rarity] = (n[c.rarity] || 0) + 1);
  const isPity = pity >= cfg.pityDup && pool.some(c => !owned[c.id]);          // 天井：未取得を保証
  const cand = isPity ? pool.filter(c => !owned[c.id]) : pool;
  const char = weightedPick(cand, c => rw(c.rarity) / n[c.rarity] * (owned[c.id] ? 1 : cfg.newBoost));
  return { char, isNew: !owned[char.id], isPity, show: makeShow(rarities[char.rarity], odds, cfg) };
}
