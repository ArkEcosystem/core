import { DelegateFactory } from "@arkecosystem/core-forger";
import { Crypto, Managers } from "@arkecosystem/crypto";

import secrets from "../../internal/passphrases.json";
import { Signer } from "../../internal/signer";
import { FactoryBuilder } from "../factory-builder";

const defaultBlockTimestampLookup = (height: number): number => {
    /* istanbul ignore next */
    if (height === 1) return 0;
    /* istanbul ignore next */
    throw new Error(`Attempted to lookup block with height ${height}, but no lookup implementation was provided`);
};

export const registerBlockFactory = (
    factory: FactoryBuilder,
    blockTimestampLookup = defaultBlockTimestampLookup,
): void => {
    factory.set("Block", ({ options }) => {
        let previousBlock;
        if (options.getPreviousBlock) {
            previousBlock = options.getPreviousBlock();
        } else {
            previousBlock = options.config?.genesisBlock || Managers.configManager.get("genesisBlock");
        }

        const { blocktime, reward } = Managers.configManager.getMilestone(previousBlock.height);

        const transactions = options.transactions || [];

        if (options.transactionsCount) {
            const signer = new Signer(options.config, options.nonce);

            const genesisWallets = previousBlock.transactions
                .map((transaction) => transaction.recipientId)
                .filter((address: string) => !!address);

            for (let i = 0; i < options.transactionsCount; i++) {
                transactions.push(
                    signer.makeTransfer({
                        amount: (options.amount || 2) + i,
                        transferFee: options.fee || 0.1,
                        recipient: genesisWallets[Math.floor(Math.random() * genesisWallets.length)],
                        passphrase: secrets[0],
                    }),
                );
            }
        }

        return DelegateFactory.fromBIP39(options.passphrase || secrets[0]).forge(transactions, {
            previousBlock,
            timestamp:
                Crypto.Slots.getSlotNumber(blockTimestampLookup, Crypto.Slots.getTime()) * options.blocktime ||
                blocktime,
            reward: options.reward || reward,
        })!;
    });
};
