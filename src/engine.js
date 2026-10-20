// 抽選エンジン：ここで結果と演出の「格」を先に確定する。演出は結果を変えない。
const rnd = Math.random;

export function weightedPick(items, weightOf) {
  let r = rnd() * items.reduce((s, i) => s + weightOf(i), 0);
  for (const i of items) { r -= weightOf(i); if (r < 0) return i; }
  return items[items.length - 1];
}

// 演出の格(tier) 0青 1緑 2赤 3金 4レインボー(確定)
function makeShow(rar) {
  let tier = rar.level, fake = false, confirm = false;
  if (rar.level >= 3 && rnd() < 0.3) { tier = 4; confirm = true; }            // SSRの30%で確定演出
  else if (rar.level < 3 && rnd() < 0.15) { tier = Math.min(3, tier + 1 + (rnd() < 0.5 ? 1 : 0)); fake = true; } // ガセ演出
  return { tier, fake, confirm };
}

export function draw({ chars, rarities, gacha, owned, pity, cfg }) {
  const pool = chars.filter(c => c.status === 'active' && c.gachas.includes(gacha.id));
  const rw = r => gacha.rarityWeight?.[r] ?? rarities[r].weight;
  const n = {}; pool.forEach(c => n[c.rarity] = (n[c.rarity] || 0) + 1);
  const isPity = pity >= cfg.pityDup && pool.some(c => !owned[c.id]);          // 天井：未取得を保証
  const cand = isPity ? pool.filter(c => !owned[c.id]) : pool;
  const char = weightedPick(cand, c => rw(c.rarity) / n[c.rarity] * (owned[c.id] ? 1 : cfg.newBoost)); // 未取得は出やすい
  return { char, isNew: !owned[char.id], isPity, show: makeShow(rarities[char.rarity]) };
}
