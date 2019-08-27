import { Contracts } from "@arkecosystem/core-kernel";

export interface Migration {
    id: number;
    name: string;
}

export interface ColumnDescriptor {
    name: string;
    supportedOperators?: Contracts.Database.SearchOperator[];
    prop?: string;
    init?: any;
    def?: any;
}
