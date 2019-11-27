import { DelegateFactory } from "@arkecosystem/core-forger";
import { Crypto, Managers } from "@arkecosystem/crypto";

import { Signer } from "../../internal/signer";
import secrets from "../../internal/secrets.json";
import { FactoryBuilder } from "../factory-builder";

export const registerBlockFactory = (factory: FactoryBuilder): void => {
    factory.set("Block", ({ options }) => {
        const signer = new Signer(options.config, options.nonce);

        const previousBlock = Managers.configManager.get("genesisBlock");

        const { blocktime, reward } = Managers.configManager.getMilestone(previousBlock.height);

        const transactions = options.transactions || [];

        if (options.transactionsCount) {
            const genesisWallets = previousBlock.transactions.map(t => t.recipientId).filter(a => !!a);

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
            timestamp: Crypto.Slots.getSlotNumber(Crypto.Slots.getTime()) * options.blocktime || blocktime,
            reward: options.reward || reward,
        })!;
    });
};
