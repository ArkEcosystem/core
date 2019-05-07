import { Database } from "@arkecosystem/core-interfaces";

export class MockDatabaseModel implements Database.IModel {
    public getName(): string {
        return this.constructor.name;
    }

    public getTable(): string {
        return "test";
    }

    public query(): any {
        return;
    }

    public getColumnSet(): any {
        return;
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
