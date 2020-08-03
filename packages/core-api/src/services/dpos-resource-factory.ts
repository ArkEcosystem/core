import { Container, Contracts, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Utils } from "@arkecosystem/crypto";

import { DposDelegate, DposDelegateLastBlock } from "./dpos-delegate";

@Container.injectable()
export class DposResourceFactory {
    public getDelegateFromWallet(wallet: Contracts.State.Wallet): DposDelegate {
        AppUtils.assert.defined<string>(wallet.publicKey);

        let delegateLastBlock: DposDelegateLastBlock | undefined;

        if (wallet.hasAttribute("delegate.lastBlock")) {
            delegateLastBlock = {
                id: wallet.getAttribute<string>("delegate.lastBlock.id"),
                height: wallet.getAttribute<number>("delegate.lastBlock.height"),
                timestamp: wallet.getAttribute<number>("delegate.lastBlock.timestamp"),
            };
        }

        return {
            username: wallet.getAttribute<string>("delegate.username"),
            address: wallet.address,
            publicKey: wallet.publicKey,
            votes: wallet.getAttribute<Utils.BigNumber>("delegate.voteBalance"),
            rank: wallet.getAttribute<number>("delegate.rank"),
            isResigned: wallet.getAttribute<boolean>("delegate.resigned", false),
            blocks: {
                produced: wallet.getAttribute<number>("delegate.producedBlocks"),
                last: delegateLastBlock,
            },
            production: {
                approval: AppUtils.delegateCalculator.calculateApproval(wallet),
            },
            forged: {
                fees: wallet.getAttribute<Utils.BigNumber>("delegate.forgedFees"),
                rewards: wallet.getAttribute<Utils.BigNumber>("delegate.forgedRewards"),
                total: Utils.BigNumber.make(AppUtils.delegateCalculator.calculateForgedTotal(wallet)),
            },
        };
    }
}
