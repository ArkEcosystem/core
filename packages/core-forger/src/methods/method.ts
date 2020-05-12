import { Blocks, CryptoManager, Interfaces as BlockInterfaces } from "@arkecosystem/core-crypto";
import { Container, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Interfaces, Types } from "@arkecosystem/crypto";

/**
 * @export
 * @abstract
 * @class Method
 */
@Container.injectable()
export abstract class Method {
    @Container.inject(Container.Identifiers.CryptoManager)
    protected readonly cryptoManager!: CryptoManager;

    @Container.inject(Container.Identifiers.BlockFactory)
    private readonly blockFactory!: Blocks.BlockFactory;

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
    ): BlockInterfaces.IBlock {
        const totals: { amount: Types.BigNumber; fee: Types.BigNumber } = {
            amount: this.cryptoManager.LibraryManager.Libraries.BigNumber.ZERO,
            fee: this.cryptoManager.LibraryManager.Libraries.BigNumber.ZERO,
        };

        const payloadBuffers: Buffer[] = [];
        for (const transaction of transactions) {
            AppUtils.assert.defined<string>(transaction.id);

            totals.amount = totals.amount.plus(transaction.amount);
            totals.fee = totals.fee.plus(transaction.fee);

            payloadBuffers.push(Buffer.from(transaction.id, "hex"));
        }

        return this.blockFactory.make(
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
                payloadHash: this.cryptoManager.LibraryManager.Crypto.HashAlgorithms.sha256(payloadBuffers).toString(
                    "hex",
                ),
                transactions,
            },
            keys,
        )!; // todo: this method should never return undefined
    }
}
