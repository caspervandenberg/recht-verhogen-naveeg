import AxonController, { type CommunicatieAanmaakOpties, type PolisId } from "@asr-tools/axon-controller";
import assert from "assert";
import * as c from "./control/constants.ts";
import maakMailInhoud from "./maakMailIhoud.ts";
import { formatBedrag, formatDatum, overDagen } from "./detail/utils.ts";
import { genereerDocument, uploadDoc } from "./detail/genereer.ts";

const session = await AxonController.create(c.GEBRUIK_TEST, c.CONCURRENCY).then(s => s.bootstrapTo.polis());

export default async function verstuurBrief(polisnummer: PolisId, factor: 1.25 | 1.35) {
    const polisVersiesPromise = session.polisversies.getVersieRows(
        polisnummer,
        r => r.appTypeMutationTypeName === "Prolongeren" && r.dateStart.includes(c.JAAR)
    ).catch(() => { });
    const { polisdata, polisdetails } = await getPolisData();

    if (polisdata.policyStatusExtId === "deactivated") {
        throw new Error(`Polis is geroyeerd`)
    }
    assert(polisdata.policyStatusExtId === "active" || polisdata.policyStatusExtId === "coverageRevoked", `Polis is niet actief, maar '${polisdata.policyStatusExtId}'`);

    checkVerzekerdeBedragen();

    // Prolongatiedatum: van de polis als die al in `jaar` valt, anders uit de prolongatieversie
    const toekomstProlongatiedatum: string = polisdata.datePolicyContinuation;
    const prolongatieDatum = toekomstProlongatiedatum.includes(c.JAAR)
        ? toekomstProlongatiedatum
        : await getProlongatieDatum();

    // Vind jaarbedrag en bereken nieuwe uit
    const oudePremie = polisdetails.premiumTable.table.rows.find(r => r.headerText === "Eindpremie")?.amtYear as number;
    assert(
        typeof oudePremie === "number",
        "Geen jaarbedrag gevonden" + (oudePremie ? `, wel ${oudePremie}` : "")
    );
    const nieuwePremie = oudePremie * factor;

    // Datums voor in de brief
    const prolongatieDatumFMT = formatDatum(prolongatieDatum);
    const reactieDatumFMT = formatDatum(overDagen(c.REACTIETERMIJN_DAGEN));

    const docPromise = uploadDoc(session, polisdata, genereerDocument(prolongatieDatumFMT))

    await maakCommunicatie();

    async function getProlongatieDatum() {
        const versies = await polisVersiesPromise;
        assert(versies, "Fout bij versies zoeken");
        assert(
            versies.length === 1,
            `${versies.length} prolongatieversies gevonden in ${c.JAAR}`
        );
        return versies[0].dateStart
    }

    // HELPERS

    async function getPolisData() {
        const polisdata = await session.polissen.getPolisData(polisnummer);
        const polisdetails = await session.polisversies.getActueleVersieDetails(polisdata);

        return { polisdata, polisdetails };
    }

    async function maakCommunicatie() {
        // Hulpvariabelen
        const vzNaam = polisdata.policyHolder.name;
        const oudePremieFMT = formatBedrag(oudePremie);
        const nieuwePremieFMT = formatBedrag(nieuwePremie);

        // Emailgegevens
        const ontvangerAdres = polisdata.intermediary.emailAddress;

        // Controle
        assert(
            typeof vzNaam === "string" && vzNaam.length > 0,
            `naam van verzekeringnemer niet gevonden: ${vzNaam}`
        );
        assert(
            typeof ontvangerAdres === "string" && ontvangerAdres.length > 0,
            `emailadres van de ontvanger niet gevonden: ${ontvangerAdres}`
        );

        // Opties assembleren
        const opts: CommunicatieAanmaakOpties = {
            polisnummer,
            actueleVersieId: polisdata.policyVersionExtId,
            tussenpersoonId: polisdata.intermediary.externalIdentifier,
            bericht: {
                inhoud: maakMailInhoud(vzNaam, polisnummer, oudePremieFMT, nieuwePremieFMT, prolongatieDatumFMT, reactieDatumFMT),
                onderwerp: `Polisnummer ${polisnummer} | Aanpassing verzekerde som AVB | ${vzNaam}`,
                verzenderAlias: "Acceptatie Schade Zakelijk AVB en Rechtsbijstand",
                verzenderAdres: "avbrecht@asr.nl",
                ontvangerAdres,
            }
        };

        // Communicatie maken
        const { externalIdentifier: comId } = await session.communicaties.create(opts);

        // Koppel document
        const { externalIdentifier: docId, changeToken: docCT } = await docPromise;
        await session.documenten.koppelAanCommunicatie(comId, docId, docCT);

        // Meld gereed
        if (c.MELD_GEREED) {
            const com = await session.communicaties.vindDetails(comId, false);
            await session.communicaties.gekoppeld.meldGereed(com);
        }
        else console.log("Niet gereed gemeld, want c.MELD_GEREED is false");

        console.log("Klaar voor", polisnummer);
    }

    function checkVerzekerdeBedragen() {
        const { perAanspraak, perVerzJaar } = getVerzekerdeBedragen();

        assert(perAanspraak && perVerzJaar, "Geen verzekerde som AVB per aanspraak of per verzekeringsjaar gevonden");
        assert(typeof perAanspraak === "number" && typeof perVerzJaar === "number", `Verzekerde som AVB per aanspraak of per verzekeringsjaar is geen number, maar ${typeof perAanspraak} en ${typeof perVerzJaar}`);

        assert(perAanspraak <= 1_250_000, `Verzekerde som AVB aanspraak is niet 1.250.000, maar ${perAanspraak}`);
        assert(perVerzJaar <= 2_500_000, `Verzekerde som AVB per verzekeringsjaar is niet 2.500.000, maar ${perVerzJaar}`);
    }

    /**
     * Legacy (`dekAVBLeg…`): bedragen staan als velden op de dekking.
     * Nieuw (`dekAVBAansprakelijkheid`): bedragen staan als polisvelden; per aanspraak is een lijstwaarde (string).
     */
    function getVerzekerdeBedragen() {
        const dekkingen = polisdetails.policyInstanceCoverageList;

        const legacy = dekkingen.find(cov => cov.externalIdentifier === "dekAVBLegAansprakelijkheid");
        if (legacy) {
            const veld = (id: string) => legacy.coverageFieldList.find(f => f.externalIdentifier === id)?.value.value;
            return {
                perAanspraak: veld("dekAVBLegAansprakelijkheidBedragAanspraakBd"),
                perVerzJaar: veld("dekAVBLegAansprakelijkheidBedragVerzekeringsjaarBd"),
            };
        }

        const nieuw = dekkingen.find(cov => cov.externalIdentifier === "dekAVBAansprakelijkheid");
        assert(nieuw, "Geen AVB-dekking gevonden");

        const veld = (id: string) => polisdetails.policyInstanceFieldList.find(f => f.externalIdentifier === id)?.value.value;
        const perAanspraak = veld("polAVBVerzekerdBedragLs");
        return {
            perAanspraak: typeof perAanspraak === "string" && /^\d+$/.test(perAanspraak) ? Number(perAanspraak) : perAanspraak,
            perVerzJaar: veld("polAVBVerzekerdBedragPerVerzekeringsjaarBd"),
        };
    }
}
