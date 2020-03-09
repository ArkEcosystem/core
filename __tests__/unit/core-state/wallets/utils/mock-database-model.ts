import { Contracts } from "@packages/core-kernel";

export class MockDatabaseModel {
    // TODO: formerly implemented: Contracts.Database.IModel - does this type exist yet?
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

    public getSearchableFields() {
        // TODO: formerly returned: Database.ISearchableField[] - does this type exist yet?
        return [
            {
                fieldName: "id",
                supportedOperators: [Contracts.Database.SearchOperator.OP_EQ],
            },
            {
                fieldName: "timestamp",
                supportedOperators: [
                    Contracts.Database.SearchOperator.OP_GTE,
                    Contracts.Database.SearchOperator.OP_LTE,
                ],
            },
            {
                fieldName: "sentence",
                supportedOperators: [
                    Contracts.Database.SearchOperator.OP_EQ,
                    Contracts.Database.SearchOperator.OP_LIKE,
                ],
            },
            {
                fieldName: "basket",
                supportedOperators: [Contracts.Database.SearchOperator.OP_IN],
            },
            {
                fieldName: "range",
                supportedOperators: [
                    Contracts.Database.SearchOperator.OP_EQ,
                    Contracts.Database.SearchOperator.OP_GTE,
                    Contracts.Database.SearchOperator.OP_LTE,
                ],
            },
            {
                fieldName: "testContains",
                supportedOperators: [Contracts.Database.SearchOperator.OP_CONTAINS],
            },
        ];
    }
}
