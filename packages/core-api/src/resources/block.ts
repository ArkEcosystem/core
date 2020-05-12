import { CryptoManager, Interfaces } from "@arkecosystem/core-crypto";
import { Container, Contracts, Utils as AppUtils } from "@arkecosystem/core-kernel";

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

    @Container.inject(Container.Identifiers.CryptoManager)
    private readonly cryptoManager!: CryptoManager;

    /**
     * Return the raw representation of the resource.
     *
     * @param {*} resource
     * @returns {object}
     * @memberof Resource
     */
    public raw(resource: Interfaces.IBlockData): object {
        return JSON.parse(JSON.stringify(resource));
    }

    /**
     * Return the transformed representation of the resource.
     *
     * @param {*} resource
     * @returns {object}
     * @memberof Resource
     */
    public transform(resource: Interfaces.IBlockData): object {
        const generator: Contracts.State.Wallet = this.walletRepository.findByPublicKey(resource.generatorPublicKey);
        const lastBlock: Interfaces.IBlock = this.blockchainService.getLastBlock();

        return {
            id: resource.id,
            version: +resource.version,
            height: +resource.height,
            previous: resource.previousBlock,
            forged: {
                reward: resource.reward.toFixed(),
                fee: resource.totalFee.toFixed(),
                amount: this.cryptoManager.LibraryManager.Libraries.BigNumber.make(resource.totalAmount).toFixed(),
                total: resource.reward.plus(resource.totalFee).toFixed(),
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
            timestamp: AppUtils.formatTimestamp(resource.timestamp, this.cryptoManager),
        };
    }
}
