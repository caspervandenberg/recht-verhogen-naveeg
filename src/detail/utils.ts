import assert from "assert";
import { JAAR, MAANDEN } from "../control/constants.ts";

/** Datum over `n` dagen vanaf vandaag */
export function overDagen(n: number): Date {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return d;
}

/** Parst `"5-3"`, `"5-3-2026"`, `"2026-03-05"` of een Date naar `"5 maart 2026"` */
export function formatDatum(input: string | Date): string {
    let day: number, month: number, year: number;

    if (input instanceof Date) {
        [day, month, year] = [input.getDate(), input.getMonth() + 1, input.getFullYear()];
    } else {
        const delen = input.split(/[T ]/)[0].split(/[-/]/).map(Number);
        assert(delen.every(Number.isInteger), `Ongeldige datum: '${input}'`);

        if (delen[0] > 31) [year, month, day] = delen;
        else[day, month, year] = [delen[0], delen[1], delen[2] ?? +JAAR];
    }

    assert(day >= 1 && day <= 31, `Ongeldige dag in '${input}'`);
    assert(month >= 1 && month <= 12, `Ongeldige maand in '${input}'`);
    assert(year >= 2000 && year <= 2100, `Ongeldig jaar in '${input}'`);

    return `${day} ${MAANDEN[month - 1]} ${year}`;
}

export function formatBedrag(bedrag: number) {
    return bedrag.toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}