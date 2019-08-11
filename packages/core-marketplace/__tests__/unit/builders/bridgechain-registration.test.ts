import "jest-extended";

import { Managers, Transactions, Utils } from "@arkecosystem/crypto";
import { BridgechainRegistrationBuilder } from "../../../src/builders";
import { MarketplaceTransactionTypes } from "../../../src/marketplace-transactions";
import { BridgechainRegistrationTransaction } from "../../../src/transactions";
import { bridgechainRegistrationAsset1, bridgechainRegistrationAsset2 } from "../helper";

let builder: BridgechainRegistrationBuilder;

describe("Bridgechain registration builder", () => {
    Managers.configManager.setFromPreset("testnet");
    Transactions.TransactionRegistry.registerTransactionType(BridgechainRegistrationTransaction);

    beforeEach(() => {
        builder = new BridgechainRegistrationBuilder();
    });

    describe("should test verification", () => {
        it("should verify correctly with single passphrase", () => {
            let actual = builder
                .bridgechainRegistrationAsset(bridgechainRegistrationAsset1)
                .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquirev");
            expect(actual.build().verified).toBeTrue();
            expect(actual.verify()).toBeTrue();

            actual = builder
                .bridgechainRegistrationAsset(bridgechainRegistrationAsset2)
                .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquirev");
            expect(actual.build().verified).toBeTrue();
            expect(actual.verify()).toBeTrue();
        });
    });

    describe("should test properties", () => {
        it("should have its specific properties", () => {
            expect(builder).toHaveProperty("data.type", MarketplaceTransactionTypes.BridgechainRegistration);
            expect(builder).toHaveProperty("data.amount", Utils.BigNumber.ZERO);
            expect(builder).toHaveProperty("data.fee", BridgechainRegistrationTransaction.staticFee());
            expect(builder).toHaveProperty("data.recipientId", undefined);
            expect(builder).toHaveProperty("data.senderPublicKey", undefined);
            expect(builder).toHaveProperty("data.asset", { bridgechainRegistration: {} });
            expect(builder).toHaveProperty("data.version", 2);
            expect(builder).toHaveProperty("data.nonce");
        });

        it("should not have properties", () => {
            expect(builder).not.toHaveProperty("data.name");
            expect(builder).not.toHaveProperty("data.seedNodes");
            expect(builder).not.toHaveProperty("data.genesisHash");
            expect(builder).not.toHaveProperty("data.githubRepository");
        });
    });
});
