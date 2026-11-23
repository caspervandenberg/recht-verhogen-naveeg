import type { PolisId } from "@asr-gar/axon-controller";
import fs from "fs";
import * as c from "../control/constants.ts";
import verstuurBrief from "../index.ts";

console.clear();

const [factor, ...polisnummers] = process.argv.slice(2);

if (factor !== "1.25" && factor !== "1.35") {
    throw new Error(`Factor moet 1.25 of 1.35 zijn, kreeg: ${factor}`);
}

for (const polisnummer of polisnummers) {
    if (!/^\d+$/.test(polisnummer)) {
        throw new Error(`Ongeldig polisnummer: ${polisnummer}`);
    }
}

let next = 0;
const errors: string[] = [];

async function worker() {
    while (next < polisnummers.length) {
        let polisnummer;
        try {
            polisnummer = polisnummers[next++]!;
            await verstuurBrief(polisnummer as PolisId, Number(factor) as 1.25 | 1.35);
        } catch (err) {
            const msg = `${polisnummer}`.padEnd(13) + (err instanceof Error ? err.message : String(err)).slice(0, 100);
            console.error("[ERROR]", msg);
            errors.push(msg);
        }
    }
}

await Promise.all(Array.from({ length: c.CONCURRENCY }, () => worker()));

fs.writeFileSync("errors.txt", errors.join("\n"), "utf-8");
