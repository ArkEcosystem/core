import { Container, Contracts, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Interfaces } from "@arkecosystem/crypto";

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
     * Return the raw representation of the resource.
     *
     * @param {Interfaces.ITransactionData} resource
     * @returns {object}
     * @memberof Resource
     */
    public raw(resource: Interfaces.ITransactionData): object {
        return JSON.parse(JSON.stringify(resource));
    }

    /**
     * Return the transformed representation of the resource.
     *
     * @param {Interfaces.ITransactionData} resource
     * @returns {object}
     * @memberof Resource
     */
    public transform(resource: Interfaces.ITransactionData): object {
        AppUtils.assert.defined<string>(resource.senderPublicKey);

        const sender: string = this.walletRepository.findByPublicKey(resource.senderPublicKey).getAddress();

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
            confirmations: 0, // ! resource.block ? lastBlock.data.height - resource.block.height + 1 : 0
            timestamp:
                typeof resource.timestamp !== "undefined" ? AppUtils.formatTimestamp(resource.timestamp) : undefined,
            nonce: resource.nonce?.toFixed(),
        };
    }
}
