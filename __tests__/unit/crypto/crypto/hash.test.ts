import "jest-extended";

import { Utils } from "../../../../packages/crypto/src";
import { Hash } from "../../../../packages/crypto/src/crypto";
import { configManager } from "../../../../packages/crypto/src/managers";
import { Utils as TransactionUtils } from "../../../../packages/crypto/src/transactions";
import { identity } from "../../../utils/identities";

beforeEach(() => configManager.setFromPreset("devnet"));

describe("Hash", () => {
    describe("schnorr", () => {
        const transaction = {
            type: 0,
            amount: Utils.BigNumber.make(1000),
            fee: Utils.BigNumber.make(2000),
            recipientId: "AJWRd23HNEhPLkK1ymMnwnDBX2a7QBZqff",
            timestamp: 141738,
            asset: {},
            senderPublicKey: identity.publicKey,
        };

        it("sign and verify should be ok", () => {
            const hash: Buffer = TransactionUtils.toHash(transaction);
            const signature: string = Hash.signSchnorr(hash, identity.keys);

            expect(Hash.verifySchnorr(hash, signature, identity.publicKey)).toBeTrue();
            expect(signature).toEqual(
                "b335d8630413fdf5f8f739d3b2d3bcc19cfdb811acf0c769cc2b2faf477c1e053b6974ccaba086fc6e1dd0cfc16bba2f18ab3d8b6624f16479886d9e4cfeb95e",
            );
        });
    });
});
