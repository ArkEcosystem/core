import { Database } from "@arkecosystem/core-interfaces";

export interface IMigration {
    id: number;
    name: string;
}

export interface ColumnDescriptor {
    name: string;
    supportedOperators?: Database.SearchOperator[];
    prop?: string;
    init?: any;
    def?: any;
}
