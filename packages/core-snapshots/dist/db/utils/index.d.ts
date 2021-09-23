import { QueryFile } from "pg-promise";
export declare const loadQueryFile: (directory: any, file: any) => QueryFile;
export declare const rawQuery: (pgp: any, queryFile: any, parameters: any) => any;
