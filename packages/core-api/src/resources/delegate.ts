import { CryptoManager } from "@arkecosystem/core-crypto";
import { Container, Contracts, Utils as AppUtils } from "@arkecosystem/core-kernel";

import { Resource } from "../interfaces";

@Container.injectable()
export class DelegateResource implements Resource {
    @Container.inject(Container.Identifiers.CryptoManager)
    private readonly cryptoManager!: CryptoManager;

    /**
     * Return the raw representation of the resource.
     *
     * @param {*} resource
     * @returns {object}
     * @memberof Resource
     */
    public raw(resource): object {
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
        const attributes: Contracts.State.WalletDelegateAttributes = resource.getAttribute("delegate");

        const data = {
            username: attributes.username,
            address: resource.address,
            publicKey: resource.publicKey,
            votes: this.cryptoManager.LibraryManager.Libraries.BigNumber.make(attributes.voteBalance).toFixed(),
            rank: attributes.rank,
            isResigned: !!attributes.resigned,
            blocks: {
                produced: attributes.producedBlocks,
            },
            production: {
                approval: AppUtils.delegateCalculator.calculateApproval(this.cryptoManager, resource),
            },
            forged: {
                fees: attributes.forgedFees.toFixed(),
                rewards: attributes.forgedRewards.toFixed(),
                total: AppUtils.delegateCalculator.calculateForgedTotal(this.cryptoManager, resource),
            },
        };

        const lastBlock = attributes.lastBlock;

        if (lastBlock) {
            // @ts-ignore
            data.blocks.last = {
                id: lastBlock.id,
                height: lastBlock.height,
                timestamp: AppUtils.formatTimestamp(lastBlock.timestamp, this.cryptoManager),
            };
        }

        return data;
    }
}
