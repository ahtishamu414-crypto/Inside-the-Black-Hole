/**
 * Seeded Starfield Generator for SpaceBackground
 *
 * Layers:
 * - Far stars: 220 tiny (0.5 to 0.8 px), dim, almost still
 * - Mid stars: 90 dots at 1 px, slow drift, gentle twinkle
 * - Near stars: 25 dots at 1.5 to 2 px, faster drift, occasional soft glow
 *
 * Colors: mostly white #E8F0FA, some cyan-tinted #55DDE0, warm-tinted #FFE4B5.
 */

export interface Star {
  x: number;
  y: number;
  size: number;
  color: string;
  baseAlpha: number;
  twinkleSpeed: number;
  twinklePhase: number;
  glow: boolean;
}

export interface StarfieldData {
  farStars: Star[];
  midStars: Star[];
  nearStars: Star[];
}

export function createPrng(initialSeed: number = 42) {
  let s = (initialSeed ^ 0x12345678) >>> 0;
  return function next(): number {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export function generateStarfield(
  seed: number = 42,
  width: number = 1920,
  height: number = 1080
): StarfieldData {
  const prng = createPrng(seed);

  const starColors = [
    '#E8F0FA', // Pure star white (majority)
    '#E8F0FA',
    '#E8F0FA',
    '#E8F0FA',
    '#D0E4FA', // Soft cool white
    '#A6F0F2', // Cyan-tinted (subtle #55DDE0 accent)
    '#FFE8C8', // Warm stellar yellow
    '#FFF0D8'  // Soft stellar amber
  ];

  const pickColor = () => starColors[Math.floor(prng() * starColors.length)];

  // 1. Far Stars: 220 tiny 0.5 - 0.8 px dots, dim, almost still
  const farStars: Star[] = [];
  for (let i = 0; i < 220; i++) {
    farStars.push({
      x: prng() * width,
      y: prng() * height,
      size: 0.5 + prng() * 0.3,
      color: pickColor(),
      baseAlpha: 0.35 + prng() * 0.45,
      twinkleSpeed: 0.3 + prng() * 0.5,
      twinklePhase: prng() * Math.PI * 2,
      glow: false
    });
  }

  // 2. Mid Stars: 90 dots at 1 px, slow horizontal drift, gentle twinkle
  const midStars: Star[] = [];
  for (let i = 0; i < 90; i++) {
    midStars.push({
      x: prng() * width,
      y: prng() * height,
      size: 0.9 + prng() * 0.1,
      color: pickColor(),
      baseAlpha: 0.55 + prng() * 0.40,
      twinkleSpeed: 0.8 + prng() * 1.2,
      twinklePhase: prng() * Math.PI * 2,
      glow: false
    });
  }

  // 3. Near Stars: 25 dots at 1.5 - 2 px, faster drift, a few get a soft glow
  const nearStars: Star[] = [];
  for (let i = 0; i < 25; i++) {
    const isGlow = prng() < 0.32; // stars with soft glow
    nearStars.push({
      x: prng() * width,
      y: prng() * height,
      size: 1.5 + prng() * 0.5,
      color: pickColor(),
      baseAlpha: 0.8 + prng() * 0.2,
      twinkleSpeed: 1.2 + prng() * 1.5,
      twinklePhase: prng() * Math.PI * 2,
      glow: isGlow
    });
  }

  return { farStars, midStars, nearStars };
}
