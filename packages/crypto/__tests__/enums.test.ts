import "jest-extended";

import { TransactionType } from "@packages/crypto/src/enums";

describe("Constants", () => {
    it("transaction types are defined", () => {
        expect(TransactionType).toBeDefined();

        expect(TransactionType.Transfer).toBeDefined();
        expect(TransactionType.Transfer).toBe(0);

        expect(TransactionType.SecondSignature).toBeDefined();
        expect(TransactionType.SecondSignature).toBe(1);

        expect(TransactionType.DelegateRegistration).toBeDefined();
        expect(TransactionType.DelegateRegistration).toBe(2);

        expect(TransactionType.Vote).toBeDefined();
        expect(TransactionType.Vote).toBe(3);

        expect(TransactionType.MultiSignature).toBeDefined();
        expect(TransactionType.MultiSignature).toBe(4);

        expect(TransactionType.Ipfs).toBeDefined();
        expect(TransactionType.Ipfs).toBe(5);

        expect(TransactionType.MultiPayment).toBeDefined();
        expect(TransactionType.MultiPayment).toBe(6);

        expect(TransactionType.DelegateResignation).toBeDefined();
        expect(TransactionType.DelegateResignation).toBe(7);

        expect(TransactionType.HtlcLock).toBeDefined();
        expect(TransactionType.HtlcLock).toBe(8);

        expect(TransactionType.HtlcClaim).toBeDefined();
        expect(TransactionType.HtlcClaim).toBe(9);

        expect(TransactionType.HtlcRefund).toBeDefined();
        expect(TransactionType.HtlcRefund).toBe(10);
    });
});
