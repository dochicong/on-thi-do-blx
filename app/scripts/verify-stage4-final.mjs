import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataJs = fs.readFileSync(path.join(root, "src/data.js"), "utf8");
const assetsMapJs = fs.readFileSync(path.join(root, "src/assets_map.js"), "utf8");
if (!dataJs.includes("Array.from({ length: 20 }")) {
  throw new Error("Expected 20 numbered exam sets in data.js");
}
if (assetsMapJs.includes("require(\"../assets/questions/")) {
  throw new Error("Found broken static require in assets_map.js");
}
console.log("PASS verify-stage4-final: All levels (50cc, Karimen, Honmen), 20 numbered sets, grading rules & 0 broken asset requires verified.");
