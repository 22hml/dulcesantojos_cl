import fs from "fs";

const p = "app/admin/page.tsx";
const lines = fs.readFileSync(p, "utf8").split(/\r?\n/);

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("Elegir archivo")) {
    lines[i] = lines[i].replace(
      /: ".*Elegir archivo"/,
      ': "\u{1F4F7} Elegir archivo"'
    );
  }
  if (
    lines[i].includes("{o.observaciones}") &&
    !lines[i].includes("o.observaciones &&")
  ) {
    lines[i] = "                            \u{1F4DD} {o.observaciones}";
  }
}

fs.writeFileSync(p, lines.join("\n"), "utf8");
console.log("ok");
