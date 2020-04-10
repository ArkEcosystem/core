import { Container, Contracts, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Interfaces, Transactions } from "@arkecosystem/crypto";

import { Resource } from "../interfaces";

@Container.injectable()
export class TransactionResource implements Resource {
    /**
     * @protected
     * @type {Contracts.State.WalletRepository}
     * @memberof TransactionResource
     */
    @Container.inject(Container.Identifiers.WalletRepository)
    @Container.tagged("state", "blockchain")
    protected readonly walletRepository!: Contracts.State.WalletRepository;

    /**
     * @protected
     * @type {Contracts.Blockchain.Blockchain}
     * @memberof Resource
     */
    @Container.inject(Container.Identifiers.BlockchainService)
    protected readonly blockchainService!: Contracts.Blockchain.Blockchain;

    @Container.inject(Container.Identifiers.DatabaseBlockService)
    protected readonly databaseBlockService!: Contracts.Database.BlockService;

    /**
     * Return the raw representation of the resource.
     *
     * @param {*} resource
     * @returns {object}
     * @memberof Resource
     */
    public raw(resource: Interfaces.ITransactionData): object {
        return Transactions.TransactionFactory.fromData(resource).toJson();
    }

    /**
     * Return the transformed representation of the resource.
     *
     * @param {*} resource
     * @returns {object}
     * @memberof Resource
     */
    public transform(resource: Interfaces.ITransactionData): object {
        AppUtils.assert.defined<string>(resource.senderPublicKey);

        const sender: string = this.walletRepository.findByPublicKey(resource.senderPublicKey).address;

        return {
            id: resource.id,
            blockId: resource.blockId,
            version: resource.version,
            type: resource.type,
            typeGroup: resource.typeGroup,
            amount: resource.amount.toFixed(),
            fee: resource.fee.toFixed(),
            sender,
            senderPublicKey: resource.senderPublicKey,
            recipient: resource.recipientId || sender,
            signature: resource.signature,
            signSignature: resource.signSignature || resource.secondSignature,
            signatures: resource.signatures,
            vendorField: resource.vendorField,
            asset: resource.asset,
            timestamp: resource.timestamp !== undefined ? AppUtils.formatTimestamp(resource.timestamp) : undefined,
            nonce: resource.nonce!.toFixed(),
        };
    }
}
