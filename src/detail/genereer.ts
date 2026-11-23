import type AxonController from "@asr-tools/axon-controller";
import type { DocUploadBody, Polisdata } from "@asr-tools/axon-controller";
import assert from "assert";
import { naarPDF, vulTemplate } from "@asr-tools/document-factory";

const path = "C:\\Users\\cbe025ont\\Documents\\packages\\recht-verhogen-naveeg\\input\\template.docx";

export async function genereerDocument(datum: string) {
    const buffer = vulTemplate(path, { datum });
    const pdf = await naarPDF(buffer);
    return pdf;
}

export async function uploadDoc(session: AxonController, polisdata: Polisdata, bufferPromise: Promise<Buffer>) {
    const buffer = await bufferPromise;

    const payload: DocUploadBody = {
        description: "Verklaring van geen instemming",
        fileName: `Verklaring van geen instemming ${polisdata.externalIdentifier}.pdf`,

        policyVersionNumber: polisdata.policyVersionExtId,
        contents: buffer.toString("base64"),

    }

    const documentId = await session.documenten.uploadFromBuffer(
        polisdata.externalIdentifier,
        payload,
    ).then(d => d.externalIdentifier);

    const [doc, ...rest] = await session.documenten.getUploadedFromPolis(
        polisdata.externalIdentifier,
        d => d.externalIdentifier === documentId,
    );

    assert(rest.length === 0, `Meerdere documenten in Axon gevonden met ID ${documentId}`);

    return doc;
}