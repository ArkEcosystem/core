import { Container, Contracts, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Interfaces, Utils } from "@arkecosystem/crypto";

import { Resource } from "../interfaces";

@Container.injectable()
export class BlockResource implements Resource {
    /**
     * @protected
     * @type {Contracts.State.WalletRepository}
     * @memberof BlockResource
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
        resource.reward = Utils.BigNumber.make(resource.reward).toFixed();
        resource.totalFee = Utils.BigNumber.make(resource.totalFee).toFixed();
        resource.totalAmount = Utils.BigNumber.make(resource.totalAmount).toFixed();

        return resource;
    }

    /**
     * Return the transformed representation of the resource.
     *
     * @param {*} resource
     * @returns {object}
     * @memberof Resource
     */
    public transform(resource): object {
        const generator: Contracts.State.Wallet = this.walletRepository.findByPublicKey(resource.generatorPublicKey);

        const lastBlock: Interfaces.IBlock = this.blockchainService.getLastBlock();

        resource.reward = Utils.BigNumber.make(resource.reward);
        resource.totalFee = Utils.BigNumber.make(resource.totalFee);

        return {
            id: resource.id,
            version: +resource.version,
            height: +resource.height,
            previous: resource.previousBlock,
            forged: {
                reward: resource.reward.toFixed(),
                fee: resource.totalFee.toFixed(),
                total: resource.reward.plus(resource.totalFee).toFixed(),
                amount: Utils.BigNumber.make(resource.totalAmount).toFixed(),
            },
            payload: {
                hash: resource.payloadHash,
                length: resource.payloadLength,
            },
            generator: {
                username: generator.hasAttribute("delegate.username")
                    ? generator.getAttribute("delegate.username")
                    : undefined,
                address: generator.address,
                publicKey: generator.publicKey,
            },
            signature: resource.blockSignature,
            confirmations: lastBlock ? lastBlock.data.height - resource.height : 0,
            transactions: resource.numberOfTransactions,
            timestamp: AppUtils.formatTimestamp(resource.timestamp),
        };
    }
}
