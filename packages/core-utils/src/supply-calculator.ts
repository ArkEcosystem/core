import { app } from "@arkecosystem/core-container";
import { Blockchain, Database } from "@arkecosystem/core-interfaces";
import { Enums, Identities, Utils } from "@arkecosystem/crypto";

export const calculate = async (height: number): Promise<string> => {
    const { genesisBlock, milestones } = app.getConfig().all();

    if (!height) {
        const blockchain = app.resolvePlugin<Blockchain.IBlockchain>("blockchain");
        height = blockchain ? blockchain.getLastBlock().data.height : 0;
    }

    if (height === 0 || milestones.length === 0) {
        return genesisBlock.totalAmount;
    }

    const databaseService: Database.IDatabaseService = app.resolvePlugin<Database.IDatabaseService>("database");

    const senderPublicKeys: string[] = [];

    const balances: Utils.BigNumber = await genesisBlock.transactions.reduce(async (accPromise, { amount, senderPublicKey }) => {
        let acc = await accPromise;

        if (amount !== "0") {
            acc = acc.plus(amount);

            if (senderPublicKeys.includes(senderPublicKey)) {
                return acc;
            }

            const address = Identities.Address.fromPublicKey(senderPublicKey);
            let receivedByAddress = (await databaseService.transactionsBusinessRepository.findAllByRecipient(address)).rows;

            receivedByAddress = receivedByAddress.filter(transaction => (transaction as any).block.height <= height);

            for (const transaction of receivedByAddress) {
                if (transaction.typeGroup === Enums.TransactionTypeGroup.Core) {
                    switch (transaction.type) {
                        case Enums.TransactionType.Transfer: {
                            acc.minus(transaction.amount);
                            break;
                        }
                        case Enums.TransactionType.MultiPayment: {
                            const payments = transaction.asset.payments.filter(payment => payment.recipientId === address);
                            const sum = payments.reduce((sum, payment) => {
                                sum = sum.plus(payment.amount);
                                return sum;
                            }, Utils.BigNumber.ZERO);

                            acc = acc.minus(sum);
                            break;
                        }
                    }
                }
            }

            senderPublicKeys.push(senderPublicKey);
        }

        return acc;
    }, Promise.resolve(Utils.BigNumber.ZERO));

    let rewards: Utils.BigNumber = Utils.BigNumber.ZERO;
    let currentHeight: number = 0;
    let constantIndex: number = 0;

    while (currentHeight < height) {
        const constants = milestones[constantIndex];
        const nextConstants = milestones[constantIndex + 1];

        let heightJump: number = height - currentHeight;

        if (nextConstants && height >= nextConstants.height && currentHeight < nextConstants.height - 1) {
            heightJump = nextConstants.height - 1 - currentHeight;
            constantIndex += 1;
        }

        currentHeight += heightJump;

        if (currentHeight >= constants.height) {
            rewards = rewards.plus(Utils.BigNumber.make(constants.reward).times(heightJump));
        }
    }

    return balances.plus(rewards).toFixed();
};
