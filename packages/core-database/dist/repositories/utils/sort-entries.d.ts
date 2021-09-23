import { Database } from "@arkecosystem/core-interfaces";
export declare const sortEntries: <T extends Record<string, any>>(params: Database.IParameters, entries: T[], defaultOrder: string[]) => T[];
