// Run: node --test src/lib/data.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { attendanceRate, daysAgo, fetchAll, inPeriod, localDate } from "./data.ts";

test("fetchAll reads every page until a short page", async () => {
  const table = Array.from({ length: 2345 }, (_, i) => i);
  const rows = await fetchAll<number>((from, to) => Promise.resolve({ data: table.slice(from, to + 1), error: null }));
  assert.equal(rows.length, 2345);
  assert.equal(rows.at(-1), 2344);
});

test("fetchAll surfaces errors instead of returning partial data", async () => {
  await assert.rejects(fetchAll(() => Promise.resolve({ data: null, error: { message: "boom" } })), /boom/);
});

test("attendanceRate excludes leave and handles no data", () => {
  assert.equal(attendanceRate(["present", "absent", "leave", "present"]), 67);
  assert.equal(attendanceRate(["leave"]), null);
  assert.equal(attendanceRate([]), null);
});

test("dates use the local calendar day", () => {
  const today = localDate();
  assert.equal(daysAgo(today), 0);
  assert.ok(inPeriod(today, "week"));
  assert.ok(!inPeriod("2000-01-01", "3_months"));
  assert.ok(inPeriod("2000-01-01", "complete"));
});

test("cleanTitle drops a stored 'Topic N:' prefix only", async () => {
  const { cleanTitle } = await import("./data.ts");
  assert.equal(cleanTitle("Topic 1: ثنائے رب (Praise of the Lord)"), "ثنائے رب (Praise of the Lord)");
  assert.equal(cleanTitle("Wealth of Faith"), "Wealth of Faith");
  assert.equal(cleanTitle(null), "");
});
