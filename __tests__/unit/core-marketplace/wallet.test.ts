import "jest-extended";

import { Wallets } from "@arkecosystem/core-state";
import { Handlers } from "@arkecosystem/core-transactions";
import { BusinessRegistrationTransactionHandler } from "../../src/handlers";
import { IBusinessWalletAttributes } from "../../src/interfaces";

describe("should test wallet", () => {
    it("should return the same data as added", () => {
        Handlers.Registry.registerTransactionHandler(BusinessRegistrationTransactionHandler);
        const senderWallet: Wallets.Wallet = new Wallets.Wallet("ANBkoGqWeTSiaEVgVzSKZd3jS7UWzv9PSo");
        const businessProperty: IBusinessWalletAttributes = {
            businessAsset: {
                name: "google",
                website: "www.google.com",
            },
            resigned: false,
            bridgechains: [
                {
                    registrationTransactionId: "127e6fbfe24a750e72930c220a8e138275656b8e5d8f48a98c3c92df2caba935",
                    bridgechainNonce: 1001,
                    bridgechain: {
                        name: "googleCrypto",
                        seedNodes: [
                            "1.2.3.4",
                            "2001:0db8:85a3:0000:0000:8a2e:0370:7334",
                            "1.2.3.5",
                            "2001:0db8:85a3:0000:0000:8a2e:0370:7332",
                        ],
                        genesisHash: "127e6fbfe24a750e72930c220a8e138275656b8e5d8f48a98c3c92df2caba935",
                        bridgechainRepository: "github",
                    },
                },
            ],
        };
        senderWallet.setAttribute<IBusinessWalletAttributes>("business", businessProperty);
        const senderWalletData = senderWallet.getAttribute<IBusinessWalletAttributes>("business");
        expect(senderWalletData).toStrictEqual(businessProperty);
    });

    describe("should test wallet attributes for BusinessRegistrationTransactionHandler", () => {
        Handlers.Registry.registerTransactionHandler(BusinessRegistrationTransactionHandler);
        const senderWallet: Wallets.Wallet = new Wallets.Wallet("ANBkoGqWeTSiaEVgVzSKZd3jS7UWzv9PSo");

        it("should not throw, because of correct attributes", () => {
            expect(() => senderWallet.setAttribute("business", "test")).not.toThrow();
        });
    });
});
