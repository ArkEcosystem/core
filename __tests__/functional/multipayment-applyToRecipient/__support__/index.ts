import "jest-extended";

import { Delegate } from "@arkecosystem/core-forger";
import { Container, Database, State, TransactionPool } from "@arkecosystem/core-interfaces";
import { Wallets } from "@arkecosystem/core-state";
import { roundCalculator } from "@arkecosystem/core-utils";
import { Blocks, Crypto, Identities, Interfaces, Managers, Utils } from "@arkecosystem/crypto";
import delay from "delay";
import cloneDeep from "lodash.clonedeep";
import socketCluster from "socketcluster-client";
import { secrets } from "../../../utils/config/testnet/delegates.json";
import { setUpContainer } from "../../../utils/helpers/container";

jest.setTimeout(1200000);

const delegates: { [publicKey: string]: string } = {}; // public key => secret
let clientSocket: socketCluster.SCClientSocket;

let app: Container.IContainer;
export const setUp = async (): Promise<Container.IContainer | undefined> => {
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
            ],
        });

        for (const secret of secrets) {
            delegates[Identities.PublicKey.fromPassphrase(secret)] = secret;
        }

        const txpoolConnection = app.resolvePlugin<TransactionPool.IConnection>("transaction-pool");
        txpoolConnection.flush();

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

        clientSocket = socketCluster.create({
            hostname: "127.0.0.1",
            port: 4000,
            autoReconnectOptions: {
                initialDelay: 1000,
                maxDelay: 1000,
            },
        });

        return app;
    } catch (error) {
        console.error(error.stack);
    }

    return undefined;
};

export const tearDown = async (): Promise<void> => {
    const databaseService = app.resolvePlugin<Database.IDatabaseService>("database");
    await databaseService.reset();

    await app.tearDown();
};

export const forge = async (transactions: Interfaces.ITransactionData[]): Promise<Interfaces.IBlock> => {
    const lastHeight = getLastHeight();
    const blockTime = Managers.configManager.getMilestone(lastHeight).blocktime;
    const reward = Managers.configManager.getMilestone(lastHeight).reward;
    const remainingTimeInSlot = Crypto.Slots.getTimeInMsUntilNextSlot();
    await delay(remainingTimeInSlot + 1000);

    const roundInfo = roundCalculator.calculateRound(lastHeight + 1);
    const databaseService = app.resolvePlugin<Database.IDatabaseService>("database");
    const timestamp = Crypto.Slots.getTime();
    const currentForger = parseInt((timestamp / blockTime) as any) % roundInfo.maxDelegates;
    const activeDelegates = await databaseService.getActiveDelegates(roundInfo);
    // app.resolvePlugin("logger").debug(`activeDelegates: ${JSON.stringify(activeDelegates)}`)
    // app.resolvePlugin("logger").debug(`delegates: ${JSON.stringify(delegates)}`)
    const delegate = new Delegate(delegates[activeDelegates[currentForger].publicKey], app.getConfig().get("network"));
    const lastBlock = getLastBlock();
    const block: Interfaces.IBlock = delegate.forge(transactions, {
        previousBlock: {
            id: lastBlock.data.id,
            idHex: lastBlock.data.idHex,
            height: lastHeight,
        },
        timestamp,
        reward,
    });
    app.resolvePlugin("logger").debug(`block: ${JSON.stringify(block)}`);

    clientSocket.emit("p2p.peer.postBlock", {
        data: {
            block: Blocks.Block.serializeWithTransactions({
                ...block.data,
                transactions: block.transactions.map(tx => tx.data),
            }),
        },
        headers: { "Content-Type": "application/json" },
    });

    return block;
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

export const getLastBlock = (): Interfaces.IBlock => {
    return app
        .resolvePlugin<State.IStateService>("state")
        .getStore()
        .getLastBlock();
};

export const getSenderNonce = (senderPublicKey: string): Utils.BigNumber => {
    return app.resolvePlugin<Database.IDatabaseService>("database").walletManager.getNonce(senderPublicKey);
};

export const passphrases = {
    passphrase: "this is top secret passphrase number 1",
    secondPassphrase: "this is top secret passphrase number 2",
};
