import { Database } from "@arkecosystem/core-interfaces";

export class MockDatabaseModel implements Database.IDatabaseModel {
    public getName(): string {
        return this.constructor.name;
    }

    public getSearchableFields(): Database.SearchableField[] {
        return [
            {
                fieldName: "id",
                supportedOperators: [Database.SearchOperator.OP_EQ],
            },
            {
                fieldName: "timestamp",
                supportedOperators: [Database.SearchOperator.OP_GTE, Database.SearchOperator.OP_LTE],
            },
            {
                fieldName: "sentence",
                supportedOperators: [Database.SearchOperator.OP_EQ, Database.SearchOperator.OP_LIKE],
            },
            {
                fieldName: "basket",
                supportedOperators: [Database.SearchOperator.OP_IN],
            },
            {
                fieldName: "range",
                supportedOperators: [
                    Database.SearchOperator.OP_EQ,
                    Database.SearchOperator.OP_GTE,
                    Database.SearchOperator.OP_LTE,
                ],
            },
        ];
    }
}
