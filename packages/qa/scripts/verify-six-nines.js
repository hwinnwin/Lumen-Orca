const fs = require("fs");

// Very small HTML scraper: looks for data-ftotal="..."
// Your evidence bundle generator should embed this attribute.
const html = fs.readFileSync("./_evidence/index.html", "utf8");
const match = html.match(/data-ftotal="([\deE\.\-\+]+)"/);
if (!match) {
  console.error("F_total not found in evidence bundle.");
  process.exit(1);
}
const fTotal = Number(match[1]);
console.log("F_total:", fTotal);
if (!(fTotal <= 1e-6)) {
  console.error("Six-nines gate failed: F_total must be ≤ 1e-6");
  process.exit(1);
}
