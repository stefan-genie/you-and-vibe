import "dotenv/config";
import { generateCode } from "../src/accessCodes.js";

const count = parseInt(process.argv[2], 10);
const n = Number.isNaN(count) || count < 1 ? 1 : count;

for (let i = 0; i < n; i++) {
  console.log(generateCode());
}
