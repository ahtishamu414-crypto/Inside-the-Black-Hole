import { describe, it, expect } from 'vitest';
import { generateStarfield } from '../src/sim/starfield';

describe('Seeded Starfield Generator', () => {
  it('generates the exact required star counts per layer', () => {
    const data = generateStarfield(42, 1920, 1080);
    expect(data.farStars.length).toBe(220);
    expect(data.midStars.length).toBe(90);
    expect(data.nearStars.length).toBe(25);
  });

  it('is completely deterministic: same seed gives identical starfield', () => {
    const run1 = generateStarfield(12345, 1920, 1080);
    const run2 = generateStarfield(12345, 1920, 1080);

    expect(run1).toEqual(run2);

    for (let i = 0; i < 220; i++) {
      expect(run1.farStars[i].x).toBe(run2.farStars[i].x);
      expect(run1.farStars[i].y).toBe(run2.farStars[i].y);
      expect(run1.farStars[i].size).toBe(run2.farStars[i].size);
      expect(run1.farStars[i].color).toBe(run2.farStars[i].color);
    }
  });

  it('different seeds produce different star distributions', () => {
    const runA = generateStarfield(111, 1920, 1080);
    const runB = generateStarfield(999, 1920, 1080);

    expect(runA.farStars[0].x).not.toBe(runB.farStars[0].x);
  });

  it('generates valid sizes and bounds', () => {
    const data = generateStarfield(42, 1920, 1080);

    // Far stars: 0.5 to 0.8 px
    data.farStars.forEach(s => {
      expect(s.size).toBeGreaterThanOrEqual(0.5);
      expect(s.size).toBeLessThanOrEqual(0.8);
      expect(s.x).toBeGreaterThanOrEqual(0);
      expect(s.x).toBeLessThanOrEqual(1920);
      expect(s.y).toBeGreaterThanOrEqual(0);
      expect(s.y).toBeLessThanOrEqual(1080);
    });

    // Mid stars: around 1.0 px (0.9 to 1.1 px)
    data.midStars.forEach(s => {
      expect(s.size).toBeGreaterThanOrEqual(0.85);
      expect(s.size).toBeLessThanOrEqual(1.15);
    });

    // Near stars: 1.5 to 2.0 px
    data.nearStars.forEach(s => {
      expect(s.size).toBeGreaterThanOrEqual(1.5);
      expect(s.size).toBeLessThanOrEqual(2.0);
    });
  });
});
