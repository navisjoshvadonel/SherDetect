export type StoredDocument = {
 id:string; name:string; kind:string; domain:string; score:number;
 verdict:string; tone:"red"|"green"|"amber"; date:string; statement?:string; previewUrl?:string; mimeType?:string;
};

export const documents: StoredDocument[] = [];

export const DOCUMENTS_KEY = "sherdetect-review-queue";
