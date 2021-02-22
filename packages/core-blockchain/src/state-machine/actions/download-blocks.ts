import { Container, Contracts, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Interfaces, Utils } from "@arkecosystem/crypto";

import { Action } from "../contracts";

@Container.injectable()
export class DownloadBlocks implements Action {
    @Container.inject(Container.Identifiers.Application)
    public readonly app!: Contracts.Kernel.Application;

    @Container.inject(Container.Identifiers.LogService)
    private readonly logger!: Contracts.Kernel.Logger;

    @Container.inject(Container.Identifiers.BlockchainService)
    private readonly blockchain!: Contracts.Blockchain.Blockchain;

    @Container.inject(Container.Identifiers.StateStore)
    private readonly stateStore!: Contracts.State.StateStore;

    @Container.inject(Container.Identifiers.PeerNetworkMonitor)
    private readonly networkMonitor!: Contracts.P2P.NetworkMonitor;

    public async handle(): Promise<void> {
        const lastDownloadedBlock: Interfaces.IBlockData =
            this.stateStore.getLastDownloadedBlock() || this.stateStore.getLastBlock().data;

        const blocks: Interfaces.IBlockData[] = await this.networkMonitor.downloadBlocksFromHeight(
            lastDownloadedBlock.height,
        );

        if (this.blockchain.isStopped()) {
            return;
        }

        // Could have changed since entering this function, e.g. due to a rollback.
        const lastDownloadedBlockFromStore = this.stateStore.getLastDownloadedBlock();
        if (lastDownloadedBlockFromStore && lastDownloadedBlock.id !== lastDownloadedBlockFromStore.id) {
            return;
        }

        const empty: boolean = !blocks || blocks.length === 0;

        const useLookupHeight = empty ? lastDownloadedBlock.height : blocks[0].height;
        const blockTimeLookup = await AppUtils.forgingInfoCalculator.getBlockTimeLookup(this.app, useLookupHeight);

        const chained: boolean =
            !empty &&
            (AppUtils.isBlockChained(lastDownloadedBlock, blocks[0], blockTimeLookup) || Utils.isException(blocks[0]));

        if (chained) {
            this.logger.info(
                `Downloaded ${blocks.length} new ${AppUtils.pluralize(
                    "block",
                    blocks.length,
                )} accounting for a total of ${AppUtils.pluralize(
                    "transaction",
                    blocks.reduce((sum, b) => sum + b.numberOfTransactions, 0),
                    true,
                )}`,
            );

            try {
                this.blockchain.enqueueBlocks(blocks);
                this.stateStore.setLastDownloadedBlock(blocks[blocks.length - 1]);
                this.blockchain.dispatch("DOWNLOADED");
            } catch (error) {
                this.logger.warning(`Failed to enqueue downloaded block.`);

                this.blockchain.dispatch("NOBLOCK");

                return;
            }
        } else {
            if (empty) {
                this.logger.info(
                    `Could not download any blocks from any peer from height ${(
                        lastDownloadedBlock.height + 1
                    ).toLocaleString()}`,
                );
            } else {
                this.logger.warning(`Downloaded block not accepted: ${JSON.stringify(blocks[0])}`);
                this.logger.warning(`Last downloaded block: ${JSON.stringify(lastDownloadedBlock)}`);

                this.blockchain.clearQueue();
            }

            /* istanbul ignore else */
            if (this.blockchain.getQueue().size() === 0) {
                this.stateStore.setNoBlockCounter(this.stateStore.getNoBlockCounter() + 1);
                this.stateStore.setLastDownloadedBlock(this.stateStore.getLastBlock().data);
            }

            this.blockchain.dispatch("NOBLOCK");
        }
    }
}
