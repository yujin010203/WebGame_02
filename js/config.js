// js/config.js
export const CONFIG = {
  WIDTH: 450,
  HEIGHT: 800,
  BG: '#0F172A',

  hp: {
    max: 100,
    start: 100,
    hitDamage: 20,      // 빗방울(소나기) 데미지
    starHeal: 5,
    invulnSec: 1,       // 피격 후 무적 시간
    dangerRatio: 0.2,   // 이하에서 깜빡임
  },

  score: {
    perStar: 100,
    feverKill: 200,
    survivalPerSec: 10,
  },

  fever: {
    starsToTrigger: 10,
    durationSec: 5,
    bonusPerKill: 200,
  },

  player: {
    baseRadius: 22,
    minSizeRatio: 0.5,   // HP 0%일 때 크기 비율
    lerp: 0.12,          // 감속 추적 계수
    baseShadowBlur: 40,
    trailPerSec: 40,     // 초당 트레일 파티클 방출 수 (HP 100% 기준)
  },

  star: {
    spawnIntervalSec: 1.4,
    radius: 11,
    lifeSec: 5,
  },

  obstacle: {
    laser: { warnSec: 1, activeSec: 0.35, thickness: 14 },
    orb: { speed: 70, radius: 16, lifeSec: 5, damage: 30 }, // 먼지: 빗방울(hp.hitDamage=20)보다 10 더 아픔
    rain: { speed: 320, radius: 5 },
    baseSpawnIntervalSec: 1.6,
  },

  difficulty: {
    rampSec: 180,        // 이 시간에 걸쳐 최대 난이도로 램프업 (=Lv10 도달 시간)
    maxSpeedMult: 2.8,   // 이동 속도 최대 배율
    minSpawnMult: 0.35,  // 스폰 간격 최소 배율(=더 자주)
  },

  items: {
    shieldChancePerSpawn: 0.06,  // 별 스폰 시 쉴드로 대체될 확률
    waveChancePerSpawn: 0.04,    // 별똥별 파동 확률
    lifeSec: 3,
  },

  background: {
    dustCount: 60,
  },
};
