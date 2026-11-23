// TIJDELIJK: onderzoek naar "Geen AVB-dekking gevonden".
// Draaien: node --no-warnings src/control/tmp-onderzoek-avb.ts
// Leest errors-geen-avb-dekking.txt, schrijft onderzoek-avb.json.
//
// Privacy: er worden GEEN klant-/tussenpersoongegevens of bedragen opgeslagen,
// alleen polisnummer, product, status en dekking-identifiers.

import AxonController, { type PolisId } from "@asr-tools/axon-controller";
import fs from "fs";
import * as c from "./constants.ts";

const INPUT = "errors-geen-avb-dekking.txt";
const OUTPUT = "onderzoek-avb.json";
const AVB_ID = "dekAVBLegAansprakelijkheid";

const polisnummers = fs.readFileSync(INPUT, "utf-8")
    .split(/\r?\n/)
    .map(l => l.trim().split(/\s+/)[0])
    .filter(id => /^\d+$/.test(id ?? "")) as PolisId[];

const session = await AxonController.create(c.GEBRUIK_TEST, c.CONCURRENCY).then(s => s.bootstrapTo.polis());

type Resultaat = Record<string, unknown>;
const resultaten: Resultaat[] = [];

async function onderzoek(polisnummer: PolisId): Promise<Resultaat> {
    // Bewust `any`: bij een pakket wijkt de vorm af van Polisdata
    const data: any = await session.polissen.getPolisData(polisnummer);

    const basis = {
        polisnummer,
        isPackage: data.isPackage,
        productExtId: data.productExtId,
        productName: data.productName,
        status: data.policyStatusExtId,
        packagePolicyExtId: data.packagePolicyExtId ?? null,
        subpolissen: data.isPackage
            ? (data.subPolicyList ?? []).map((s: any) => ({
                polisnummer: s.policyIdentifier,
                productName: s.productName,
                status: s.policyStatusCode,
            }))
            : undefined,
    };

    const details: any = await session.polisversies.getVersieDetails(polisnummer, data.policyVersionExtId);
    const dekkingen: any[] = details?.policyInstanceCoverageList ?? [];
    const avb = dekkingen.find(d => d.externalIdentifier === AVB_ID);

    return {
        ...basis,
        aantalDekkingen: dekkingen.length,
        avbExact: avb ? { isDeleted: avb.isDeleted } : null,
        // Alles wat op AVB/aansprakelijkheid lijkt, voor als de identifier afwijkt
        avbAchtig: dekkingen
            .filter(d => /avb|aansprak/i.test(`${d.externalIdentifier} ${d.name}`))
            .map(d => ({
                id: d.externalIdentifier,
                name: d.name,
                isDeleted: d.isDeleted,
                velden: (d.coverageFieldList ?? []).map((f: any) => f.externalIdentifier),
            })),
        dekkingen: dekkingen.map(d => ({
            id: d.externalIdentifier,
            type: d.coverageTypeName,
            isDeleted: d.isDeleted,
        })),
    };
}

let next = 0;
async function worker() {
    while (next < polisnummers.length) {
        const polisnummer = polisnummers[next++]!;
        try {
            resultaten.push(await onderzoek(polisnummer));
            console.log("OK   ", polisnummer);
        } catch (err) {
            const fout = (err instanceof Error ? err.message : String(err)).slice(0, 200);
            resultaten.push({ polisnummer, fout });
            console.error("FOUT ", polisnummer, fout);
        }
    }
}

await Promise.all(Array.from({ length: c.CONCURRENCY }, () => worker()));

resultaten.sort((a, b) => String(a.polisnummer).localeCompare(String(b.polisnummer)));
fs.writeFileSync(OUTPUT, JSON.stringify(resultaten, null, 2), "utf-8");
console.log(`\n${resultaten.length}/${polisnummers.length} polissen geschreven naar ${OUTPUT}`);
