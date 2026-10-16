import { describe, it, expect } from 'vitest';
import { statisticInput, placeInput } from '../modules/cms/region.js';
const stat = { period: '2026-10', source: 'Sumber uji agregat', referenceDate: '2026-10-17', population: 10, male: 4, female: 6, households: null, rt: 2, rw: 1, status: 'DRAFT', expectedVersion: 0 };
const place = { name: 'Fasilitas uji', description: '', category: 'Kesehatan', location: 'Lokasi publik uji', latitude: null, longitude: null, photoId: null, photoAlt: '', status: 'DRAFT', expectedVersion: 0 };
describe('regional information validation', () => {
  it('accepts incomplete aggregate metrics but refuses inconsistent, negative, malformed or individual fields', () => {
    expect(statisticInput.safeParse(stat).success).toBe(true);
    expect(statisticInput.safeParse({ ...stat, population: null, male: null, female: null }).success).toBe(true);
    for (const extra of [{ population: -1 }, { male: 5 }, { rt: 0.5 }, { period: '2026-13' }, { period: '1800' }, { source: '' }, { referenceDate: '2026-02-30' }, { nik: 'test-individual' }, { residents: [{ name: 'personal' }] }, { householdNumber: 'private' }, { population: null, male: null, female: null, households: null, rt: null, rw: null }]) expect(statisticInput.safeParse({ ...stat, ...extra }).success).toBe(false);
  });
  it('validates paired coordinates, alt and strict public place fields', () => {
    expect(placeInput.safeParse(place).success).toBe(true);
    for (const extra of [{ latitude: 1 }, { latitude: 91, longitude: 100 }, { photoId: 'b6bd6fc0-50dd-4b06-80b8-b74eb855997e' }, { ownerPhone: '+621234567' }, { photoId: 'data:image/png;base64,abc' }, { status: 'PUBLIC' }]) expect(placeInput.safeParse({ ...place, ...extra }).success).toBe(false);
  });
});
