import { Container, Contracts, Utils as AppUtils } from "@arkecosystem/core-kernel";

import { Resource } from "../interfaces";

@Container.injectable()
export class TransactionWithBlockResource implements Resource {
    @Container.inject(Container.Identifiers.WalletRepository)
    @Container.tagged("state", "blockchain")
    protected readonly walletRepository!: Contracts.State.WalletRepository;

    @Container.inject(Container.Identifiers.StateStore)
    private readonly stateStore!: Contracts.State.StateStore;

    public raw(resource: Contracts.Shared.TransactionDataWithBlockData): object {
        return JSON.parse(JSON.stringify(resource));
    }

    public transform(resource: Contracts.Shared.TransactionDataWithBlockData): object {
        const transactionData = resource.data;
        const blockData = resource.block;

        AppUtils.assert.defined<string>(transactionData.senderPublicKey);

        const sender: string = this.walletRepository.findByPublicKey(transactionData.senderPublicKey).getAddress();
        const recipient: string = transactionData.recipientId ?? sender;
        const signSignature: string | undefined = transactionData.signSignature ?? transactionData.secondSignature;
        const confirmations: number = this.stateStore.getLastHeight() - blockData.height + 1;

        return {
            id: transactionData.id,
            blockId: transactionData.blockId,
            version: transactionData.version,
            type: transactionData.type,
            typeGroup: transactionData.typeGroup,
            amount: transactionData.amount.toFixed(),
            fee: transactionData.fee.toFixed(),
            sender,
            senderPublicKey: transactionData.senderPublicKey,
            recipient,
            signature: transactionData.signature,
            signSignature,
            signatures: transactionData.signatures,
            vendorField: transactionData.vendorField,
            asset: transactionData.asset,
            confirmations,
            timestamp: AppUtils.formatTimestamp(blockData.timestamp),
            nonce: transactionData.nonce!.toFixed(),
        };
    }
}
