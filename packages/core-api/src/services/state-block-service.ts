import { Container, Contracts, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Enums, Interfaces, Utils } from "@arkecosystem/crypto";

import { SomeBlockResource, TransformedBlockResource } from "./block-resource";

@Container.injectable()
export class StateBlockService {
    @Container.inject(Container.Identifiers.StateStore)
    private readonly stateStore!: Contracts.State.StateStore;

    @Container.inject(Container.Identifiers.WalletRepository)
    @Container.tagged("state", "blockchain")
    private readonly walletRepository!: Contracts.State.WalletRepository;

    public getGenesisBlock(transform: boolean): SomeBlockResource {
        if (transform) {
            return this.getTransformedBlockResource(this.stateStore.getGenesisBlock());
        } else {
            return this.getRawBlockResource(this.stateStore.getGenesisBlock());
        }
    }

    public getLastBlock(transform: boolean): SomeBlockResource {
        if (transform) {
            return this.getTransformedBlockResource(this.stateStore.getLastBlock());
        } else {
            return this.getRawBlockResource(this.stateStore.getLastBlock());
        }
    }

    private getTransformedBlockResource(block: Interfaces.IBlock): TransformedBlockResource {
        const blockData = block.data;

        AppUtils.assert.defined<string>(blockData.id);
        AppUtils.assert.defined<string>(blockData.blockSignature);
        AppUtils.assert.defined<Interfaces.ITransactionData[]>(blockData.transactions);

        const totalMultiPaymentTransferred = blockData.transactions
            .filter((t) => t.typeGroup === Enums.TransactionTypeGroup.Core)
            .filter((t) => t.type === Enums.TransactionType.MultiPayment)
            .flatMap((t) => t.asset!.payments!)
            .reduce((sum, payment) => sum.plus(payment.amount), Utils.BigNumber.ZERO);

        const totalAmountTransferred = blockData.totalAmount.plus(totalMultiPaymentTransferred);

        const generator = this.walletRepository.findByPublicKey(blockData.generatorPublicKey);
        const generatorUsername = generator.hasAttribute("delegate.username")
            ? generator.getAttribute("delegate.username")
            : undefined;

        const confirmations = this.stateStore.getLastHeight() - blockData.height;

        return {
            id: blockData.id,
            version: blockData.version,
            height: blockData.height,
            previous: blockData.previousBlock,
            forged: {
                reward: blockData.reward,
                fee: blockData.totalFee,
                amount: totalAmountTransferred,
                total: blockData.reward.plus(blockData.totalFee),
            },
            payload: {
                hash: blockData.payloadHash,
                length: blockData.payloadLength,
            },
            generator: {
                username: generatorUsername,
                address: generator.address,
                publicKey: blockData.generatorPublicKey,
            },
            signature: blockData.blockSignature,
            confirmations,
            transactions: blockData.numberOfTransactions,
            timestamp: AppUtils.formatTimestamp(blockData.timestamp),
        };
    }

    private getRawBlockResource(block: Interfaces.IBlock): Interfaces.IBlockData {
        return block.data;
    }
}
