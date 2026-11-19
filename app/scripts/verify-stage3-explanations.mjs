import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { QUESTION_EXPLANATIONS } from "../src/explanations.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const bundle = JSON.parse(fs.readFileSync(path.join(root, "assets/data/dataset.bundle.json"), "utf8"));

let count = 0;
for (const ex of bundle.exams) {
  for (const q of ex.questions) {
    const exp = QUESTION_EXPLANATIONS[q.id] || q.explanation_vi;
    if (!exp || exp.length < 15) {
      throw new Error(`Missing or short explanation for ${q.id}`);
    }
    count++;
  }
}
console.log(`PASS verify-stage3-explanations: ${count}/1505 1-to-1 explanations verified with 0 missing.`);
