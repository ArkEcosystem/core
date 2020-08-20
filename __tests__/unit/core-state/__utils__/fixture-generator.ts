import { Services } from "@packages/core-kernel";
import { Wallet } from "@packages/core-state/src/wallets";
import { Identities } from "@packages/crypto";
import { Utils } from "@packages/crypto/src";

import compact from "./compact";
import unique from "./unique";

export class FixtureGenerator {
    private genesisSenders;

    public constructor(private genesisBlock, private attributeSet: Services.Attributes.AttributeSet) {
        this.genesisSenders = unique(compact(genesisBlock.transactions.map((tx) => tx.senderPublicKey)));
    }

    public generateFullWallets(): Wallet[] {
        return this.genesisSenders.map((senderPublicKey) => {
            const address = Identities.Address.fromPublicKey(senderPublicKey);
            const wallet = new Wallet(address, new Services.Attributes.AttributeMap(this.attributeSet));
            wallet.publicKey = `${address}`;
            wallet.setAttribute("delegate.username", `username-${address}`);

            wallet.balance = Utils.BigNumber.make(100);
            wallet.setAttribute("delegate", {
                username: `username-${address}`,
                voteBalance: Utils.BigNumber.make(200),
                forgedRewards: Utils.BigNumber.ZERO,
                forgedFees: Utils.BigNumber.ZERO,
            });
            wallet.setAttribute("secondPublicKey", `secondPublicKey-${address}`);
            wallet.setAttribute("vote", `vote-${address}`);
            return wallet;
        });
    }

    public generateHtlcLocks(): Wallet[] {
        const wallets: Wallet[] = [];

        this.genesisBlock.transactions
            .filter((transaction) => transaction.recipientId)
            .forEach((transaction, i) => {
                const address = Identities.Address.fromPublicKey(transaction.senderPublicKey);
                let wallet = wallets.find((x) => x.address === address);

                if (!wallet) {
                    wallet = new Wallet(address, new Services.Attributes.AttributeMap(this.attributeSet));
                    wallet.publicKey = transaction.senderPublicKey;
                    wallets.push(wallet);
                }

                if (wallet.hasAttribute("htlc.locks")) {
                    const locks: any = wallet.getAttribute("htlc.locks");

                    locks[transaction.id] = {
                        amount: Utils.BigNumber.make(10),
                        recipientId: transaction.recipientId,
                        secretHash: transaction.id,
                        expiration: {
                            type: 1,
                            value: 100 * (i + 1),
                        },
                    };
                } else {
                    wallet.setAttribute("htlc.locks", {
                        [transaction.id]: {
                            amount: Utils.BigNumber.make(10),
                            recipientId: transaction.recipientId,
                            secretHash: transaction.id,
                            expiration: {
                                type: 1,
                                value: 100 * (i + 1),
                            },
                        },
                    });
                }
            });

        return wallets;
    }

    public generateBridgeChainWallets(): Wallet[] {
        return this.genesisSenders.map((senderPublicKey, i) => {
            const address = Identities.Address.fromPublicKey(senderPublicKey);

            const wallet = new Wallet(address, new Services.Attributes.AttributeMap(this.attributeSet));
            wallet.publicKey = senderPublicKey;

            wallet.setAttribute("business", {
                publicKey: senderPublicKey,
                businessRegistrationAsset: {},
                isResigned: false,
            });

            const bridgechainAsset = {
                [senderPublicKey]: {
                    bridgechainAsset: {},
                    resigned: false,
                },
            };

            wallet.setAttribute("business.bridgechains", bridgechainAsset);
            return wallet;
        });
    }

    public generateBusinesses(): Wallet[] {
        return this.genesisSenders.map((senderPublicKey, i) => {
            const address = Identities.Address.fromPublicKey(senderPublicKey);

            const wallet = new Wallet(address, new Services.Attributes.AttributeMap(this.attributeSet));
            wallet.publicKey = senderPublicKey;

            const businessRegistrationAsset = {
                name: "DummyBusiness",
                website: "https://www.dummy.example",
                vat: "EX1234567890",
                repository: "https://www.dummy.example/repo",
            };

            wallet.setAttribute("business", {
                publicKey: senderPublicKey,
                businessRegistrationAsset,
                isResigned: false,
            });

            wallet.setAttribute("business.businessAsset", businessRegistrationAsset);
            return wallet;
        });
    }

    public generateVotes(): Wallet[] {
        return this.genesisSenders.map((senderPublicKey) => {
            const address = Identities.Address.fromPublicKey(senderPublicKey);
            const wallet = new Wallet(address, new Services.Attributes.AttributeMap(this.attributeSet));
            wallet.setAttribute("vote", wallet.publicKey);
            return wallet;
        });
    }
}
