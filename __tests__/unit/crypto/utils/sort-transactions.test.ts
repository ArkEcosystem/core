import { ITransactionData } from "../../../../packages/crypto/src/interfaces";
import { sortTransactions } from "../../../../packages/crypto/src/utils";

describe("sortTransactions", () => {
    it("should sort by type", () => {
        const transactions = [{ type: 1, id: "10" }, { type: 2, id: "11" }, { type: 0, id: "12" }];

        sortTransactions(transactions as ITransactionData[]);
        expect(transactions[0].id).toBe("12");
        expect(transactions[1].id).toBe("10");
        expect(transactions[2].id).toBe("11");
    });

    it("should sort by id", () => {
        const transactions = [{ type: 0, id: "57" }, { type: 0, id: "21" }, { type: 0, id: "35" }];

        sortTransactions(transactions as ITransactionData[]);
        expect(transactions[0].id).toBe("21");
        expect(transactions[1].id).toBe("35");
        expect(transactions[2].id).toBe("57");
    });

    it("should sort by type and id", () => {
        const transactions = [
            { type: 2, id: "12" },
            { type: 0, id: "87" },
            { type: 3, id: "45" },
            { type: 1, id: "36" },
            { type: 1, id: "47" },
            { type: 3, id: "14" },
            { type: 2, id: "16" },
            { type: 3, id: "98" },
            { type: 1, id: "39" },
        ];

        sortTransactions(transactions as ITransactionData[]);
        expect(transactions[0].id).toBe("87");
        expect(transactions[1].id).toBe("36");
        expect(transactions[2].id).toBe("39");
        expect(transactions[3].id).toBe("47");
        expect(transactions[4].id).toBe("12");
        expect(transactions[5].id).toBe("16");
        expect(transactions[6].id).toBe("14");
        expect(transactions[7].id).toBe("45");
        expect(transactions[8].id).toBe("98");
    });
});
