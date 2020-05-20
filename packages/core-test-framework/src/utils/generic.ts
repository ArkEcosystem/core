import { CryptoSuite } from "@arkecosystem/core-crypto";
import { Container, Contracts, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Types } from "@arkecosystem/crypto";
import cloneDeep from "lodash.clonedeep";

export const snoozeForBlock = async (
    cryptoManager: CryptoSuite.CryptoManager,
    sleep: number = 0,
    height: number = 1,
): Promise<void> => {
    const blockTime: number = cryptoManager.MilestoneManager.getMilestone(height).blocktime * 1000;
    const remainingTimeInSlot: number = cryptoManager.LibraryManager.Crypto.Slots.getTimeInMsUntilNextSlot();
    const sleepTime: number = sleep * 1000;

    return AppUtils.sleep(blockTime + remainingTimeInSlot + sleepTime);
};

export const injectMilestone = (
    cryptoManager: CryptoSuite.CryptoManager,
    index: number,
    milestone: Record<string, any>,
): void =>
    (cryptoManager.MilestoneManager as any).milestones.splice(index, 0, {
        ...cloneDeep(cryptoManager.MilestoneManager.getMilestone()),
        ...milestone,
    });

export const getLastHeight = (app: Contracts.Kernel.Application): number =>
    app.get<Contracts.State.StateStore>(Container.Identifiers.StateStore).getLastHeight();

export const getSenderNonce = (app: Contracts.Kernel.Application, senderPublicKey: string): Types.BigNumber => {
    return app
        .getTagged<Contracts.State.WalletRepository>(Container.Identifiers.WalletRepository, "state", "blockchain")
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

export const getWalletNonce = (
    app: Contracts.Kernel.Application,
    cryptoManager: CryptoSuite.CryptoManager,
    publicKey: string,
): Types.BigNumber => {
    try {
        return app
            .getTagged<Contracts.State.WalletRepository>(Container.Identifiers.WalletRepository, "state", "blockchain")
            .getNonce(publicKey);
    } catch {
        return cryptoManager.LibraryManager.Libraries.BigNumber.ZERO;
    }
};
