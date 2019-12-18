import "jest-extended";

import { Blockchain, Container, Database, State } from "@arkecosystem/core-interfaces";
import { Wallets } from "@arkecosystem/core-state";
import { Identities, Managers, Utils } from "@arkecosystem/crypto";
import { Crypto } from "@arkecosystem/crypto";
import delay from "delay";
import cloneDeep from "lodash.clonedeep";
import { secrets } from "../../../utils/config/testnet/delegates.json";
import { setUpContainer } from "../../../utils/helpers/container";

jest.setTimeout(1200000);

let app: Container.IContainer;
export const setUp = async (): Promise<Container.IContainer> => {
    try {
        process.env.CORE_RESET_DATABASE = "1";

        app = await setUpContainer({
            include: [
                "@arkecosystem/core-event-emitter",
                "@arkecosystem/core-logger-pino",
                "@arkecosystem/core-state",
                "@arkecosystem/core-database-postgres",
                "@arkecosystem/core-magistrate-transactions",
                "@arkecosystem/core-transaction-pool",
                "@arkecosystem/core-p2p",
                "@arkecosystem/core-blockchain",
                "@arkecosystem/core-api",
                "@arkecosystem/core-forger",
            ],
        });

        const databaseService = app.resolvePlugin<Database.IDatabaseService>("database");
        await databaseService.reset();
        await databaseService.buildWallets();
        await databaseService.saveRound(
            secrets.map(secret =>
                Object.assign(new Wallets.Wallet(Identities.Address.fromPassphrase(secret)), {
                    publicKey: Identities.PublicKey.fromPassphrase(secret),
                    attributes: {
                        delegate: {
                            voteBalance: Utils.BigNumber.make("245098000000000"),
                            round: 1,
                        },
                    },
                }),
            ),
        );
        await (databaseService as any).initializeActiveDelegates(1);
    } catch (error) {
        console.error(error.stack);
    }
    return app;
};

export const tearDown = async (): Promise<void> => {
    const databaseService = app.resolvePlugin<Database.IDatabaseService>("database");
    await databaseService.reset();

    await app.tearDown();
};

export const snoozeForBlock = async (sleep: number = 0, height: number = 1): Promise<void> => {
    const blockTime = Managers.configManager.getMilestone(height).blocktime * 1000;
    const remainingTimeInSlot = Crypto.Slots.getTimeInMsUntilNextSlot();
    const sleepTime = sleep * 1000;

    return delay(blockTime + remainingTimeInSlot + sleepTime);
};

export const revertLastBlock = async () => {
    const blockchainService: Blockchain.IBlockchain = app.resolvePlugin<Blockchain.IBlockchain>("blockchain");
    await blockchainService.removeBlocks(1);
};

export const injectMilestone = (index: number, milestone: Record<string, any>): void => {
    (Managers.configManager as any).milestones.splice(
        index,
        0,
        Object.assign(cloneDeep(Managers.configManager.getMilestone()), milestone),
    );
};

export const getLastHeight = (): number => {
    return app
        .resolvePlugin<State.IStateService>("state")
        .getStore()
        .getLastHeight();
};

export const getSenderNonce = (senderPublicKey: string): Utils.BigNumber => {
    return app.resolvePlugin<Database.IDatabaseService>("database").walletManager.getNonce(senderPublicKey);
};

export const passphrases = {
    passphrase: "this is top secret passphrase number 1",
    secondPassphrase: "this is top secret passphrase number 2",
};
