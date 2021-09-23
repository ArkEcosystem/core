import { Database } from "@arkecosystem/core-interfaces";
export declare const searchEntries: <T extends Record<string, any>>(params: Database.IParameters, query: Record<string, string[]>, entries: readonly T[], defaultOrder: string[]) => Database.IRowsPaginated<T>;
