import "jest-extended";

import { Utils } from "@arkecosystem/crypto";
import { TransactionVersionError } from "../../../../packages/crypto/src/errors";
import { Keys } from "../../../../packages/crypto/src/identities";
import { configManager } from "../../../../packages/crypto/src/managers";
import { Signer } from "../../../../packages/crypto/src/transactions";

describe("Signer", () => {
    describe("sign", () => {
        const keys = Keys.fromPassphrase("secret");
        const transaction = {
            type: 0,
            amount: Utils.BigNumber.make(1000),
            fee: Utils.BigNumber.make(2000),
            recipientId: "AJWRd23HNEhPLkK1ymMnwnDBX2a7QBZqff",
            timestamp: 141738,
            asset: {},
            senderPublicKey: keys.publicKey,
        };

        it("should return a valid signature", () => {
            const signature = Signer.sign(transaction, keys);
            expect(signature).toBe(
                "3045022100f5c4ec7b3f9a2cb2e785166c7ae185abbff0aa741cbdfe322cf03b914002efee02206261cd419ea9074b5d4a007f1e2fffe17a38338358f2ac5fcc65d810dbe773fe",
            );
        });

        it("should throw for unsupported versions", () => {
            expect(() => {
                Signer.sign(Object.assign({}, transaction, { version: 110 }), keys);
            }).toThrow(TransactionVersionError);
        });

        it("should sign version 2 if aip11 milestone is true", () => {
            expect(() => {
                Signer.sign(Object.assign({}, transaction, { version: 2 }), keys);
            }).toThrow(TransactionVersionError);

            configManager.getMilestone().aip11 = true;

            expect(() => {
                Signer.sign(Object.assign({}, transaction, { version: 2 }), keys);
            }).not.toThrow(TransactionVersionError);

            delete configManager.getMilestone().aip11;
        });
    });
});
