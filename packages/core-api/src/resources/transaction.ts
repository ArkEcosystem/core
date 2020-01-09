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

    /**
     * Return the raw representation of the resource.
     *
     * @param {*} resource
     * @returns {object}
     * @memberof Resource
     */
    public raw(resource): object {
        return Transactions.TransactionFactory.fromBytesUnsafe(resource.serialized, resource.id).toJson();
    }

    /**
     * Return the transformed representation of the resource.
     *
     * @param {*} resource
     * @returns {object}
     * @memberof Resource
     */
    public transform(resource): object {
        const { data } = Transactions.TransactionFactory.fromBytesUnsafe(resource.serialized, resource.id);

        AppUtils.assert.defined<string>(data.senderPublicKey);

        const sender: string = this.walletRepository.findByPublicKey(data.senderPublicKey).address;

        const lastBlock: Interfaces.IBlock = this.blockchainService.getLastBlock();
        const timestamp: number = data.version === 1 ? data.timestamp : resource.timestamp;
        const nonce: string = data.nonce ? data.nonce.toFixed() : resource.nonce ? resource.nonce : undefined;

        return {
            id: data.id,
            blockId: resource.blockId,
            version: data.version,
            type: data.type,
            typeGroup: data.typeGroup,
            amount: data.amount.toFixed(),
            fee: data.fee.toFixed(),
            sender,
            senderPublicKey: data.senderPublicKey,
            recipient: data.recipientId || sender,
            signature: data.signature,
            signSignature: data.signSignature || data.secondSignature,
            signatures: data.signatures,
            vendorField: data.vendorField,
            asset: data.asset,
            confirmations: resource.block ? lastBlock.data.height - resource.block.height + 1 : 0,
            timestamp: timestamp !== undefined ? AppUtils.formatTimestamp(timestamp) : undefined,
            nonce,
        };
    }
}
