import { Container, Contracts, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Crypto, Managers, Utils } from "@arkecosystem/crypto";
import cloneDeep from "lodash.clonedeep";

export const snoozeForBlock = async (sleep: number = 0, height: number = 1): Promise<void> => {
    const blockTime: number = Managers.configManager.getMilestone(height).blocktime * 1000;
    const remainingTimeInSlot: number = Crypto.Slots.getTimeInMsUntilNextSlot();
    const sleepTime: number = sleep * 1000;

    return AppUtils.sleep(blockTime + remainingTimeInSlot + sleepTime);
};

export const injectMilestone = (index: number, milestone: Record<string, any>): void =>
    (Managers.configManager as any).milestones.splice(index, 0, {
        ...cloneDeep(Managers.configManager.getMilestone()),
        ...milestone,
    });

export const getLastHeight = (app: Contracts.Kernel.Application): number =>
    app.get<Contracts.State.StateStore>(Container.Identifiers.StateStore).getLastHeight();

export const getSenderNonce = (app: Contracts.Kernel.Application, senderPublicKey: string): Utils.BigNumber => {
    return app
        .getTagged<Contracts.State.WalletRepository>(Container.Identifiers.WalletRepository, "state", "blockain")
        .getNonce(senderPublicKey);
};

export const resetBlockchain = async (app: Contracts.Kernel.Application) => {
    // Resets everything so that it can be used in beforeAll to start clean a test suite
    // Now resets: blocks (remove blocks other than genesis), transaction pool
    // TODO: reset rounds, transactions in db...

    // reset to block height 1
    const blockchain = app.get<Contracts.Blockchain.Blockchain>(Container.Identifiers.BlockchainService);
    const height: number = blockchain.getLastBlock().data.height;

    if (height) {
        await blockchain.removeBlocks(height - 1);
    }

    // app.get<Contracts.TransactionPool.Connection>(Container.Identifiers.TransactionPoolService).flush();
};

export const getWalletNonce = (app: Contracts.Kernel.Application, publicKey: string): Utils.BigNumber => {
    try {
        return app
            .getTagged<Contracts.State.WalletRepository>(Container.Identifiers.WalletRepository, "state", "blockchain")
            .getNonce(publicKey);
    } catch {
        return Utils.BigNumber.ZERO;
    }
};
