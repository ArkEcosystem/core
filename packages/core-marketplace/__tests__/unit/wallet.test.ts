import "jest-extended";

import { Wallets } from "@arkecosystem/core-state";
import { IBusinessWalletProperty } from "../../src/interfaces";

describe("should test wallet", () => {
    it("should", () => {
        const senderWallet: Wallets.Wallet = new Wallets.Wallet("ANBkoGqWeTSiaEVgVzSKZd3jS7UWzv9PSo");
        const businessProperty: IBusinessWalletProperty = {
            businessAsset: {
                name: "google",
                website: "www.google.com",
            },
            isBusinessResigned: false,
            bridgechains: [
                {
                    registrationTransactionId: "127e6fbfe24a750e72930c220a8e138275656b8e5d8f48a98c3c92df2caba935",
                    bridgechain: {
                        name: "nameeeee",
                        seedNodes: [
                            {
                                ipv4: "1.2.3.4",
                                ipv6: "2001:0db8:85a3:0000:0000:8a2e:0370:7334",
                            },
                            {
                                ipv4: "1.2.3.5",
                                ipv6: "2001:0db8:85a3:0000:0000:8a2e:0370:7332",
                            },
                        ],
                        genesisHash: "127e6fbfe24a750e72930c220a8e138275656b8e5d8f48a98c3c92df2caba935",
                        githubRepository: "github",
                    },
                },
            ],
        };
        senderWallet.setAttribute("business", businessProperty);
        // console.log(senderWallet.getAttribute<IBusinessWalletProperty>("business"));
    });
});
