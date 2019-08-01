import "jest-extended";

import { Managers, Transactions, Utils } from "@arkecosystem/crypto";
import { BridgechainRegistrationBuilder } from "../../../src/builders";
import { MarketplaceTransactionTypes } from "../../../src/marketplace-transactions";
import { BridgechainRegistrationTransaction } from "../../../src/transactions";

let builder: BridgechainRegistrationBuilder;

describe("Bridgechain registration builder", () => {
    Managers.configManager.setFromPreset("testnet");
    Transactions.TransactionRegistry.registerCustomType(BridgechainRegistrationTransaction);

    beforeEach(() => {
        builder = new BridgechainRegistrationBuilder();
    });

    describe("should test verification", () => {
        it("should verify correctly with single passphrase", () => {
            const actual = builder
                .bridgechainRegistrationAsset({
                    name: "name",
                    seedNodes: [
                        {
                            ipv4: "1.2.3.3",
                            ipv6: "2001:0db8:85a3:0000:0000:8a2e:0370:7333",
                        },
                        {
                            ipv4: "1.2.3.4",
                            ipv6: "2001:0db8:85a3:0000:0000:8a2e:0370:7334",
                        },
                    ],
                    genesisHash: "127e6fbfe24a750e72930c220a8e138275656b8e5d8f48a98c3c92df2caba935",
                    githubRepository: "github",
                })
                .sign("passphrase");
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
