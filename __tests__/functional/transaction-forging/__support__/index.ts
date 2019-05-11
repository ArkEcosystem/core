import "jest-extended";

import { Container, Database, State } from "@arkecosystem/core-interfaces";
import { Identities, Managers, Utils } from "@arkecosystem/crypto";
import delay from "delay";
import { secrets } from "../../../utils/config/testnet/delegates.json";
import { setUpContainer } from "../../../utils/helpers/container";

jest.setTimeout(1200000);

let app: Container.IContainer;
export const setUp = async (): Promise<void> => {
    process.env.CORE_SKIP_COLD_START = "true";

    try {
        app = await setUpContainer({
            include: [
                "@arkecosystem/core-event-emitter",
                "@arkecosystem/core-logger-pino",
                "@arkecosystem/core-state",
                "@arkecosystem/core-database-postgres",
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
            secrets.map(
                secret =>
                    ({
                        round: 1,
                        publicKey: Identities.PublicKey.fromPassphrase(secret),
                        voteBalance: Utils.BigNumber.make("245098000000000"),
                    } as State.IDelegateWallet),
            ),
        );
    } catch (error) {
        console.error(error.stack);
    }
};

export const tearDown = async (): Promise<void> => {
    await app.tearDown();
};

export const snoozeForBlock = async (sleep: number = 0, height: number = 1): Promise<void> => {
    const blockTime = Managers.configManager.getMilestone(height).blocktime * 1000;
    const sleepTime = sleep * 1000;

    return delay(blockTime + sleepTime);
};

export const getLastHeight = (): number => {
    return app
        .resolvePlugin<State.IStateService>("state")
        .getStore()
        .getLastHeight();
};

export const getSenderNonce = (senderPublicKey: string): Utils.BigNumber => {
    return app.resolvePlugin<State.IWalletManager>("state").getNonce(senderPublicKey);
};

export const passphrases = {
    passphrase: "this is top secret passphrase number 1",
    secondPassphrase: "this is top secret passphrase number 2",
};
