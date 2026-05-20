import fs from "fs";

const path = "app/admin/page.tsx";
let s = fs.readFileSync(path, "utf8");

s = s.replace(
  /paidUnprocessed > 0 \? `● \(\$\{paidUnprocessed\}\) \$\{base\}` : base : base;/,
  "paidUnprocessed > 0 ? `● (${paidUnprocessed}) ${base}` : base;"
);

s = s.replace(
  /\{uploading \? "Subiendo…" : "[^"]+" \}/,
  '{uploading ? "Subiendo…" : "📷 Elegir archivo" }'
);

s = s.replace(
  /placeholder="[^"]*pedida[^"]*"/,
  'placeholder="Más pedida, Nuevo…"'
);

s = s.replace(
  /<p className="mt-1 text-sm text-gold\/90">\s*[^\u0000-\u007F]*\s*\{o\.observaciones\}/,
  '<p className="mt-1 text-sm text-gold/90">\n                            📝 {o.observaciones}'
);

// Remove any remaining replacement chars / mojibake fragments in string literals (conservative)
s = s.replace(/\uFFFD/g, "");

fs.writeFileSync(path, s, "utf8");
console.log("Fixed", path);
