import { Contracts } from "@arkecosystem/core-kernel";

export interface IMigration {
    id: number;
    name: string;
}

export interface IColumnDescriptor {
    name: string;
    supportedOperators?: Contracts.Database.SearchOperator[];
    prop?: string;
    init?: any;
    def?: any;
}
