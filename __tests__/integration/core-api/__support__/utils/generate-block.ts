import { Delegate } from "@arkecosystem/core-forger";
import { Crypto, Interfaces, Managers } from "@arkecosystem/crypto";

export const generateBlocks = (): Interfaces.IBlockJson[] => {
    const flags: any = {};

    if (!flags.number) {
        flags.number = 1;
    }

    if (!flags.transactions) {
        flags.transactions = 0;
    }

    if (!flags.transactionAmount) {
        flags.transactionAmount = 2;
    }

    if (!flags.transactionFee) {
        flags.transactionFee = 0.1;
    }

    if (!flags.passphrase) {
        flags.passphrase = "clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire";
    }

    const genesisBlock = Managers.configManager.get("genesisBlock");
    const genesisWallets = genesisBlock.transactions.map(t => t.recipientId).filter(a => !!a);

    let previousBlock = genesisBlock;

    const blocks: Interfaces.IBlockJson[] = [];

    for (let i = 0; i < flags.number; i++) {
        const milestone = Managers.configManager.getMilestone(previousBlock.height);
        const delegate = new Delegate(flags.passphrase, Managers.configManager.get("network.pubKeyHash"));

        const transactions = [];
        for (let i = 0; i < flags.transactions; i++) {
            transactions.push(
                this.signer.makeTransfer({
                    ...flags,
                    ...{
                        amount: flags.transactionAmount + i,
                        transferFee: flags.transactionFee,
                        recipient: genesisWallets[Math.floor(Math.random() * genesisWallets.length)],
                    },
                }),
            );
        }

        const newBlock = delegate.forge(transactions, {
            previousBlock,
            timestamp: Crypto.Slots.getSlotNumber(Crypto.Slots.getTime()) * milestone.blocktime,
            reward: milestone.reward,
        });

        const blockPayload: Interfaces.IBlockJson = newBlock.toJson();
        blockPayload.transactions = newBlock.transactions.map(tx => ({
            ...tx.toJson(),
            serialized: tx.serialized.toString("hex"),
        }));
        blockPayload.serialized = newBlock.serialized;
        previousBlock = blockPayload;

        blocks.push(blockPayload);
    }

    return blocks;
};
