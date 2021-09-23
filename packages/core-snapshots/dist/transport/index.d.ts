export declare const exportTable: (table: any, options: any) => Promise<{
    count: any;
    startHeight: any;
    endHeight: any;
}>;
export declare const importTable: (table: any, options: any) => Promise<void>;
export declare const verifyTable: (table: any, options: any) => Promise<void>;
export declare const backupTransactionsToJSON: (snapFileName: any, query: any, database: any) => Promise<any>;
