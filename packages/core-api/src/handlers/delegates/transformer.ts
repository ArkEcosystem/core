import { Contracts, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Utils } from "@arkecosystem/crypto";

// todo: turn into class so that ioc can be used
// todo: review the implementation
export const transformDelegate = (delegate: Contracts.State.Wallet) => {
    const attributes: Contracts.State.WalletDelegateAttributes = delegate.getAttribute("delegate");

    const data = {
        username: attributes.username,
        address: delegate.address,
        publicKey: delegate.publicKey,
        votes: Utils.BigNumber.make(attributes.voteBalance).toFixed(),
        rank: attributes.rank,
        isResigned: attributes.resigned,
        blocks: {
            produced: attributes.producedBlocks,
        },
        production: {
            approval: AppUtils.delegateCalculator.calculateApproval(delegate),
        },
        forged: {
            fees: attributes.forgedFees.toFixed(),
            rewards: attributes.forgedRewards.toFixed(),
            total: AppUtils.delegateCalculator.calculateForgedTotal(delegate),
        },
    };

    const lastBlock = attributes.lastBlock;

    if (lastBlock) {
        // @ts-ignore
        data.blocks.last = {
            id: lastBlock.id,
            height: lastBlock.height,
            timestamp: AppUtils.formatTimestamp(lastBlock.timestamp),
        };
    }

    return data;
};
