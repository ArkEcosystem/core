import { BusinessRegistrationTransactionHandler } from "@arkecosystem/core-magistrate-transactions/src/handlers";
import { Wallets } from "@arkecosystem/core-state";
import { Handlers } from "@arkecosystem/core-transactions";
import { IBusinessWalletAttributes } from "../../../packages/core-magistrate-transactions/src/interfaces";

const genesisHash = "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61";
describe("should test wallet", () => {
    it("should return the same data as added", () => {
        Handlers.Registry.registerTransactionHandler(BusinessRegistrationTransactionHandler);
        const senderWallet: Wallets.Wallet = new Wallets.Wallet("ANBkoGqWeTSiaEVgVzSKZd3jS7UWzv9PSo");
        const businessAttributes: IBusinessWalletAttributes = {
            businessAsset: {
                name: "google",
                website: "https://www.google.com",
            },
            resigned: false,
            bridgechains: {
                [genesisHash]: {
                    bridgechainAsset: {
                        name: "googleCrypto",
                        seedNodes: [
                            "1.2.3.4",
                            "2001:0db8:85a3:0000:0000:8a2e:0370:7334",
                            "1.2.3.5",
                            "2001:0db8:85a3:0000:0000:8a2e:0370:7332",
                        ],
                        genesisHash: "127e6fbfe24a750e72930c220a8e138275656b8e5d8f48a98c3c92df2caba935",
                        bridgechainRepository: "http://github.com",
                        bridgechainAssetRepository: "http://github.com/asset",
                        ports: { "@arkecosystem/core-api": 12345 },
                    },
                },
            },
        };
        senderWallet.setAttribute<IBusinessWalletAttributes>("business", businessAttributes);
        const senderWalletData = senderWallet.getAttribute<IBusinessWalletAttributes>("business");
        expect(senderWalletData).toStrictEqual(businessAttributes);
    });

    describe("should test wallet attributes for BusinessRegistrationTransactionHandler", () => {
        Handlers.Registry.registerTransactionHandler(BusinessRegistrationTransactionHandler);
        const senderWallet: Wallets.Wallet = new Wallets.Wallet("ANBkoGqWeTSiaEVgVzSKZd3jS7UWzv9PSo");

        it("should not throw, because of correct attributes", () => {
            expect(() => senderWallet.setAttribute("business", "test")).not.toThrow();
        });
    });
});
