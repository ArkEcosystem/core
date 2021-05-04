import { Container, Contracts, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Enums, Interfaces, Utils } from "@arkecosystem/crypto";

import { Resource } from "../interfaces";

@Container.injectable()
export class BlockWithTransactionsResource implements Resource {
    @Container.inject(Container.Identifiers.WalletRepository)
    @Container.tagged("state", "blockchain")
    private readonly walletRepository!: Contracts.State.WalletRepository;

    @Container.inject(Container.Identifiers.BlockchainService)
    private readonly blockchainService!: Contracts.Blockchain.Blockchain;

    public raw(resource: Contracts.Shared.BlockDataWithTransactionData): object {
        return JSON.parse(JSON.stringify(resource));
    }

    public transform(resource: Contracts.Shared.BlockDataWithTransactionData): object {
        const blockData: Interfaces.IBlockData = resource.data;
        const blockTransactions: Interfaces.ITransactionData[] = resource.transactions;

        const totalMultiPaymentTransferred: Utils.BigNumber = blockTransactions
            .filter((t) => t.typeGroup === Enums.TransactionTypeGroup.Core)
            .filter((t) => t.type === Enums.TransactionType.MultiPayment)
            .flatMap((t) => t.asset!.payments)
            .reduce((sum, payment) => sum.plus(payment!.amount), Utils.BigNumber.ZERO);

        const totalAmountTransferred: Utils.BigNumber = blockData.totalAmount.plus(totalMultiPaymentTransferred);
        const generator: Contracts.State.Wallet = this.walletRepository.findByPublicKey(blockData.generatorPublicKey);
        const lastBlock: Interfaces.IBlock = this.blockchainService.getLastBlock();

        return {
            id: blockData.id,
            version: +blockData.version,
            height: +blockData.height,
            previous: blockData.previousBlock,
            forged: {
                reward: blockData.reward.toFixed(),
                fee: blockData.totalFee.toFixed(),
                amount: totalAmountTransferred.toFixed(),
                total: blockData.reward.plus(blockData.totalFee).toFixed(),
            },
            payload: {
                hash: blockData.payloadHash,
                length: blockData.payloadLength,
            },
            generator: {
                username: generator.hasAttribute("delegate.username")
                    ? generator.getAttribute("delegate.username")
                    : undefined,
                address: generator.getAddress(),
                publicKey: generator.getPublicKey(),
            },
            signature: blockData.blockSignature,
            confirmations: lastBlock ? lastBlock.data.height - blockData.height : 0,
            transactions: blockData.numberOfTransactions,
            timestamp: AppUtils.formatTimestamp(blockData.timestamp),
        };
    }
}
