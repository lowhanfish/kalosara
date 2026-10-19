const { test } = require("node:test");
const assert = require("node:assert/strict");
const {
  genderComposition,
  chartMaximum,
  chronologicalStatistics,
  statisticPeriod,
  validCount,
} = require("../.test-build/lib/statistics.js");
test("composition uses recorded genders and never invents missing or zero values", () => {
  assert.equal(genderComposition({ male: null, female: 10 }), null);
  assert.equal(genderComposition({ male: 0, female: 0 }), null);
  assert.equal(genderComposition({ male: -1, female: 10 }), null);
  assert.deepEqual(genderComposition({ male: 0, female: 10 }), {
    total: 10,
    malePercent: 0,
    femalePercent: 100,
  });
  assert.deepEqual(
    genderComposition({ male: 40, female: 60, population: 120 }),
    { total: 100, malePercent: 40, femalePercent: 60 },
  );
});
test("comparison scales remain finite, include zero, and never undershoot data", () => {
  for (const value of [null, undefined, NaN, Infinity, -1])
    assert.equal(validCount(value), false);
  assert.equal(validCount(0), true);
  for (const values of [
    [null, null],
    [0, 0],
    [2828, 2846],
    [734, 738],
  ]) {
    const max = chartMaximum(values);
    assert.ok(Number.isFinite(max) && max > 0);
    assert.ok(values.filter(validCount).every((value) => value <= max));
  }
});
test("comparison orders periods without mutating server data and formats monthly/yearly periods", () => {
  const items = [
    { period: "2026-10" },
    { period: "2025" },
    { period: "2026-09" },
  ];
  assert.deepEqual(
    chronologicalStatistics(items).map((x) => x.period),
    ["2025", "2026-09", "2026-10"],
  );
  assert.equal(items[0].period, "2026-10");
  assert.equal(statisticPeriod("2026-10"), "Oktober 2026");
  assert.equal(statisticPeriod("2025"), "2025");
});
