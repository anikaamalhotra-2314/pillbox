#!/usr/bin/env node
// Summarizes docs/decisions/*.md frontmatter.
// Usage: node scripts/decision-stats.mjs
import { readdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = join(root, "docs", "decisions");

function parseFrontmatter(text) {
  const match = text.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;
  const fields = {};
  for (const line of match[1].split("\n")) {
    const m = line.match(/^(\w+):\s*(.*)$/);
    if (m) fields[m[1]] = m[2].replace(/\s+#.*$/, "").replace(/^"|"$/g, "").trim();
  }
  return fields;
}

function tally(items, key) {
  const counts = {};
  for (const item of items) counts[item[key] || "(unset)"] = (counts[item[key] || "(unset)"] || 0) + 1;
  return counts;
}

function printTable(title, counts, total) {
  console.log(`\n${title}`);
  const rows = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const width = Math.max(...rows.map(([k]) => k.length), 5);
  for (const [k, n] of rows) {
    const pct = total ? Math.round((n / total) * 100) : 0;
    console.log(`  ${k.padEnd(width)}  ${String(n).padStart(3)}  ${String(pct).padStart(3)}%`);
  }
}

// --- Decision entries
const entries = readdirSync(dir)
  .filter((f) => /^\d{4}-.*\.md$/.test(f))
  .map((f) => ({ file: f, ...parseFrontmatter(readFileSync(join(dir, f), "utf8")) }));

console.log(`Decisions: ${entries.length}`);
if (entries.length) {
  printTable("By origin (who first proposed)", tally(entries, "origin"), entries.length);
  printTable("By outcome (what happened to AI's proposal)", tally(entries, "outcome"), entries.length);
  printTable("By area", tally(entries, "area"), entries.length);
}

const open = entries.filter((e) =>
  readFileSync(join(dir, e.file), "utf8").includes("TODO(anika)")
);
if (open.length) {
  console.log(`\nEntries with TODO(anika) still open: ${open.length}`);
  for (const e of open) console.log(`  ${e.file}`);
}

