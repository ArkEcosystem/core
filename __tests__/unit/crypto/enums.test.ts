import "jest-extended";
import * as enums from "../../../packages/crypto/src/enums";

describe("Constants", () => {
    it("transaction types are defined", () => {
        expect(enums.TransactionType).toBeDefined();

        expect(enums.TransactionType.Transfer).toBeDefined();
        expect(enums.TransactionType.Transfer).toBe(0);

        expect(enums.TransactionType.SecondSignature).toBeDefined();
        expect(enums.TransactionType.SecondSignature).toBe(1);

        expect(enums.TransactionType.DelegateRegistration).toBeDefined();
        expect(enums.TransactionType.DelegateRegistration).toBe(2);

        expect(enums.TransactionType.Vote).toBeDefined();
        expect(enums.TransactionType.Vote).toBe(3);

        expect(enums.TransactionType.MultiSignature).toBeDefined();
        expect(enums.TransactionType.MultiSignature).toBe(4);

        expect(enums.TransactionType.Ipfs).toBeDefined();
        expect(enums.TransactionType.Ipfs).toBe(5);

        expect(enums.TransactionType.MultiPayment).toBeDefined();
        expect(enums.TransactionType.MultiPayment).toBe(6);

        expect(enums.TransactionType.DelegateResignation).toBeDefined();
        expect(enums.TransactionType.DelegateResignation).toBe(7);

        expect(enums.TransactionType.HtlcLock).toBeDefined();
        expect(enums.TransactionType.HtlcLock).toBe(8);

        expect(enums.TransactionType.HtlcClaim).toBeDefined();
        expect(enums.TransactionType.HtlcClaim).toBe(9);

        expect(enums.TransactionType.HtlcRefund).toBeDefined();
        expect(enums.TransactionType.HtlcRefund).toBe(10);
    });
});
