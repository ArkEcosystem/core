import "jest-extended";
import * as constants from "../../../packages/crypto/src/constants";

describe("Constants", () => {
    it("satoshi is valid", () => {
        expect(constants.SATOSHI).toBeDefined();
        expect(constants.SATOSHI).toBe(100000000);
    });

    it("transaction types are defined", () => {
        expect(constants.TransactionTypes).toBeDefined();

        expect(constants.TransactionTypes.Transfer).toBeDefined();
        expect(constants.TransactionTypes.Transfer).toBe(0);

        expect(constants.TransactionTypes.SecondSignature).toBeDefined();
        expect(constants.TransactionTypes.SecondSignature).toBe(1);

        expect(constants.TransactionTypes.DelegateRegistration).toBeDefined();
        expect(constants.TransactionTypes.DelegateRegistration).toBe(2);

        expect(constants.TransactionTypes.Vote).toBeDefined();
        expect(constants.TransactionTypes.Vote).toBe(3);

        expect(constants.TransactionTypes.MultiSignature).toBeDefined();
        expect(constants.TransactionTypes.MultiSignature).toBe(4);

        expect(constants.TransactionTypes.Ipfs).toBeDefined();
        expect(constants.TransactionTypes.Ipfs).toBe(5);

        expect(constants.TransactionTypes.TimelockTransfer).toBeDefined();
        expect(constants.TransactionTypes.TimelockTransfer).toBe(6);

        expect(constants.TransactionTypes.MultiPayment).toBeDefined();
        expect(constants.TransactionTypes.MultiPayment).toBe(7);

        expect(constants.TransactionTypes.DelegateResignation).toBeDefined();
        expect(constants.TransactionTypes.DelegateResignation).toBe(8);
    });
});
