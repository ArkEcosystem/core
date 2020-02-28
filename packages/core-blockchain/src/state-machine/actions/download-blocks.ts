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

    public async handle(): Promise<void> {
        const lastDownloadedBlock: Interfaces.IBlockData =
            this.stateStore.lastDownloadedBlock || this.stateStore.getLastBlock().data;

        const blocks: Interfaces.IBlockData[] = await this.app
            .get<Contracts.P2P.NetworkMonitor>(Container.Identifiers.PeerNetworkMonitor)
            .downloadBlocksFromHeight(lastDownloadedBlock.height);

        if (this.blockchain.isStopped) {
            return;
        }

        // Could have changed since entering this function, e.g. due to a rollback.
        if (this.stateStore.lastDownloadedBlock && lastDownloadedBlock.id !== this.stateStore.lastDownloadedBlock.id) {
            return;
        }

        const empty: boolean = !blocks || blocks.length === 0;
        const chained: boolean =
            !empty && (AppUtils.isBlockChained(lastDownloadedBlock, blocks[0]) || Utils.isException(blocks[0].id));

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
                this.blockchain.dispatch("DOWNLOADED");
            } catch (error) {
                this.logger.warning(`Failed to enqueue downloaded block.`);

                this.blockchain.dispatch("NOBLOCK");

                return;
            }
        } else {
            if (empty) {
                this.logger.info(
                    `Could not download any blocks from any peer from height ${lastDownloadedBlock.height + 1}`,
                );
            } else {
                this.logger.warning(`Downloaded block not accepted: ${JSON.stringify(blocks[0])}`);
                this.logger.warning(`Last downloaded block: ${JSON.stringify(lastDownloadedBlock)}`);

                this.blockchain.clearQueue();
            }

            if (this.blockchain.queue.length() === 0) {
                this.stateStore.noBlockCounter++;
                this.stateStore.lastDownloadedBlock = this.stateStore.getLastBlock().data;
            }

            this.blockchain.dispatch("NOBLOCK");
        }
    }
}
