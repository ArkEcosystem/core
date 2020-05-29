import { CryptoSuite } from "@packages/core-crypto";
import { Services } from "@packages/core-kernel";
import { Wallet } from "@packages/core-state/src/wallets";

import compact from "./compact";
import unique from "./unique";

export class FixtureGenerator {
    private genesisSenders;

    public constructor(
        private genesisBlock,
        private attributeSet: Services.Attributes.AttributeSet,
        private cryptoManager: CryptoSuite.CryptoManager,
    ) {
        this.genesisSenders = unique(compact(genesisBlock.transactions.map((tx) => tx.senderPublicKey)));
    }

    public generateFullWallets(): Wallet[] {
        return this.genesisSenders.map((senderPublicKey) => {
            const address = this.cryptoManager.Identities.Address.fromPublicKey(senderPublicKey);
            const wallet = new Wallet(
                this.cryptoManager,
                address,
                new Services.Attributes.AttributeMap(this.attributeSet),
            );
            wallet.publicKey = `${address}`;
            wallet.setAttribute("delegate.username", `username-${address}`);

            wallet.balance = this.cryptoManager.LibraryManager.Libraries.BigNumber.make(100);
            wallet.setAttribute("delegate", {
                username: `username-${address}`,
                voteBalance: this.cryptoManager.LibraryManager.Libraries.BigNumber.make(200),
                forgedRewards: this.cryptoManager.LibraryManager.Libraries.BigNumber.ZERO,
                forgedFees: this.cryptoManager.LibraryManager.Libraries.BigNumber.ZERO,
            });
            wallet.setAttribute("secondPublicKey", `secondPublicKey-${address}`);
            wallet.setAttribute("vote", `vote-${address}`);
            return wallet;
        });
    }

    public generateHtlcLocks(): Wallet[] {
        return this.genesisBlock.transactions
            .filter((transaction) => transaction.recipientId)
            .map((transaction, i) => {
                const address = this.cryptoManager.Identities.Address.fromPublicKey(transaction.senderPublicKey);
                const wallet = new Wallet(
                    this.cryptoManager,
                    address,
                    new Services.Attributes.AttributeMap(this.attributeSet),
                );
                wallet.publicKey = transaction.senderPublicKey;
                wallet.setAttribute("htlc.locks", {
                    [transaction.id]: {
                        amount: this.cryptoManager.LibraryManager.Libraries.BigNumber.make(10),
                        recipientId: transaction.recipientId,
                        secretHash: transaction.id,
                        expiration: {
                            type: 1,
                            value: 100 * (i + 1),
                        },
                    },
                });
                return wallet;
            });
    }

    public generateBridgeChainWallets(): Wallet[] {
        return this.genesisSenders.map((senderPublicKey, i) => {
            const address = this.cryptoManager.Identities.Address.fromPublicKey(senderPublicKey);

            const wallet = new Wallet(
                this.cryptoManager,
                address,
                new Services.Attributes.AttributeMap(this.attributeSet),
            );
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
            const address = this.cryptoManager.Identities.Address.fromPublicKey(senderPublicKey);

            const wallet = new Wallet(
                this.cryptoManager,
                address,
                new Services.Attributes.AttributeMap(this.attributeSet),
            );
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
            const address = this.cryptoManager.Identities.Address.fromPublicKey(senderPublicKey);
            const wallet = new Wallet(
                this.cryptoManager,
                address,
                new Services.Attributes.AttributeMap(this.attributeSet),
            );
            wallet.setAttribute("vote", wallet.publicKey);
            return wallet;
        });
    }
}
