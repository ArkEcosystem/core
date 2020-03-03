import { Services } from "@packages/core-kernel";
import { Wallet } from "@packages/core-state/src/wallets";
import { getWalletAttributeSet } from "@packages/core-test-framework/src/internal/wallet-attributes";
import { Identities } from "@packages/crypto";
import { Utils } from "@packages/crypto/src";

import compact from "./compact";
import unique from "./unique";

export class FixtureGenerator {
    private genesisSenders;
    private attributeMap: Services.Attributes.AttributeMap;

    public constructor(private genesisBlock) {
        this.genesisSenders = unique(compact(genesisBlock.transactions.map(tx => tx.senderPublicKey)));
        this.attributeMap = new Services.Attributes.AttributeMap(getWalletAttributeSet());
    }

    public generateWallets(): Wallet[] {
        return this.genesisSenders.map((senderPublicKey, index) =>
            Object.assign(new Wallet(Identities.Address.fromPublicKey(senderPublicKey), this.attributeMap), {
                balance: Utils.BigNumber.make(index),
            }),
        );
    }

    public generateFullWallets(): Wallet[] {
        return this.genesisSenders.map(senderPublicKey => {
            const address = Identities.Address.fromPublicKey(senderPublicKey);
            const wallet = new Wallet(address, this.attributeMap);
            wallet.publicKey = `publicKey-${address}`;
            wallet.setAttribute("delegate", {
                username: `username-${address}`,
                balance: Utils.BigNumber.make(100),
                voteBalance: Utils.BigNumber.make(200),
            });
            wallet.setAttribute("secondPublicKey", `secondPublicKey-${address}`);
            wallet.setAttribute("vote", `vote-${address}`);
            return wallet;
        });
    }

    public generateHtlcLocks(): Wallet[] {
        return this.genesisBlock.transactions.map((transaction, i) => {
            const address = Identities.Address.fromPublicKey(transaction.senderPublicKey);
            const wallet = new Wallet(address, this.attributeMap);
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
            return wallet;
        });
    }
}
