import { Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Blocks, Crypto, Interfaces, Utils } from "@arkecosystem/crypto";

/**
 * @export
 * @abstract
 * @class Method
 */
export abstract class Method {
    /**
     * @protected
     * @param {Interfaces.IKeyPair} keys
     * @param {Interfaces.ITransactionData[]} transactions
     * @param {Record<string, any>} options
     * @returns {Interfaces.IBlock}
     * @memberof Method
     */
    protected createBlock(
        keys: Interfaces.IKeyPair,
        transactions: Interfaces.ITransactionData[],
        options: Record<string, any>,
    ): Interfaces.IBlock {
        const totals: { amount: Utils.BigNumber; fee: Utils.BigNumber } = {
            amount: Utils.BigNumber.ZERO,
            fee: Utils.BigNumber.ZERO,
        };

        const payloadBuffers: Buffer[] = [];
        for (const transaction of transactions) {
            AppUtils.assert.defined<string>(transaction.id);

            totals.amount = totals.amount.plus(transaction.amount);
            totals.fee = totals.fee.plus(transaction.fee);

            payloadBuffers.push(Buffer.from(transaction.id, "hex"));
        }

        return Blocks.BlockFactory.make(
            {
                version: 0,
                generatorPublicKey: keys.publicKey,
                timestamp: options.timestamp,
                previousBlock: options.previousBlock.id,
                previousBlockHex: options.previousBlock.idHex,
                height: options.previousBlock.height + 1,
                numberOfTransactions: transactions.length,
                totalAmount: totals.amount,
                totalFee: totals.fee,
                reward: options.reward,
                payloadLength: 32 * transactions.length,
                payloadHash: Crypto.HashAlgorithms.sha256(payloadBuffers).toString("hex"),
                transactions,
            },
            keys,
        )!; // todo: this method should never return undefined
    }
}
