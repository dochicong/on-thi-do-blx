import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const bundle = JSON.parse(fs.readFileSync(path.join(root, "assets/data/dataset.bundle.json"), "utf8"));
const signs = JSON.parse(fs.readFileSync(path.join(root, "assets/data/signs_ja.index.json"), "utf8"));

const totalQ = bundle.exams.reduce((s, e) => s + e.questions.length, 0);
if (totalQ !== 1505) throw new Error(`Expected 1505 questions, got ${totalQ}`);
if (signs.signs.length !== 152) throw new Error(`Expected 152 signs, got ${signs.signs.length}`);
console.log(`PASS verify-stage2-ui: ${totalQ} questions (1405 theory + 100 situational) & ${signs.signs.length} road signs verified.`);
