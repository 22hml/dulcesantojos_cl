import { readFileSync } from "fs";

const env = readFileSync(".env.local", "utf8");
const get = (k) => {
  const m = env.match(new RegExp(`^${k}=(.+)$`, "m"));
  return m ? m[1].trim().replace(/^["']|["']$/g, "") : "";
};

const mp = get("MP_ACCESS_TOKEN");
const sr = get("SUPABASE_SERVICE_ROLE_KEY");

console.log(
  "MP_ACCESS_TOKEN:",
  mp
    ? mp.startsWith("eyJ")
      ? "MAL (parece JWT de Supabase, no MP)"
      : `${mp.slice(0, 12)}... len=${mp.length}`
    : "FALTA"
);
console.log(
  "SUPABASE_SERVICE_ROLE_KEY:",
  sr ? (sr.startsWith("eyJ") ? "OK (JWT)" : "revisar formato") : "FALTA"
);
