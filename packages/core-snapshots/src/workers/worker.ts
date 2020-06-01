import { CryptoSuite } from "@arkecosystem/core-crypto";
import { Models, Utils } from "@arkecosystem/core-database";
import { Container } from "@arkecosystem/core-kernel";
import { Transactions as MagistrateTransactions } from "@arkecosystem/core-magistrate-crypto";
import { Connection, createConnection, getCustomRepository } from "typeorm";
import { parentPort, workerData } from "worker_threads";

import * as Codecs from "../codecs";
import { StreamReader, StreamWriter } from "../codecs";
import { Repository, Worker, WorkerAction } from "../contracts";
import { Identifiers } from "../ioc";
import * as Repositories from "../repositories";
import * as Actions from "./actions";
import { Application } from "./application";

let app: Application;
let action: WorkerAction;
const _workerData: Worker.WorkerData = workerData;

/* istanbul ignore next */
const connect = async (options: any): Promise<Connection> => {
    return createConnection({
        ...options.connection,
        namingStrategy: new Utils.SnakeNamingStrategy(),
        entities: [Models.Block, Models.Transaction, Models.Round],
    });
};

export const init = async (cryptoSuite?: CryptoSuite.CryptoSuite) => {
    const crypto = cryptoSuite
        ? cryptoSuite
        : new CryptoSuite.CryptoSuite(CryptoSuite.CryptoManager.findNetworkByName(workerData.actionOptions.network));
    const transactionManager = crypto.TransactionManager;

    transactionManager.TransactionTools.TransactionRegistry.registerTransactionType(
        MagistrateTransactions.BridgechainRegistrationTransaction,
    );
    transactionManager.TransactionTools.TransactionRegistry.registerTransactionType(
        MagistrateTransactions.BridgechainResignationTransaction,
    );
    transactionManager.TransactionTools.TransactionRegistry.registerTransactionType(
        MagistrateTransactions.BridgechainUpdateTransaction,
    );
    transactionManager.TransactionTools.TransactionRegistry.registerTransactionType(
        MagistrateTransactions.BusinessRegistrationTransaction,
    );
    transactionManager.TransactionTools.TransactionRegistry.registerTransactionType(
        MagistrateTransactions.BusinessResignationTransaction,
    );
    transactionManager.TransactionTools.TransactionRegistry.registerTransactionType(
        MagistrateTransactions.BusinessUpdateTransaction,
    );

    app = new Application(new Container.Container());
    app.bind(Container.Identifiers.CryptoManager).toConstantValue(crypto.CryptoManager);
    app.bind(Container.Identifiers.BlockFactory).toConstantValue(crypto.BlockFactory);
    app.bind(Container.Identifiers.TransactionManager).toConstantValue(crypto.TransactionManager);

    if (_workerData.connection) {
        /* istanbul ignore next */
        app.bind(Identifiers.SnapshotDatabaseConnection).toConstantValue(
            await connect({ connection: _workerData.connection }),
        );
    }

    /* istanbul ignore next */
    app.bind<Repository>(Identifiers.SnapshotRepositoryFactory).toFactory<Repository>(
        (context: Container.interfaces.Context) => (table: string) => {
            if (table === "blocks") {
                return getCustomRepository(Repositories.BlockRepository);
            }
            if (table === "transactions") {
                return getCustomRepository(Repositories.TransactionRepository);
            }
            return getCustomRepository(Repositories.RoundRepository);
        },
    );

    /* istanbul ignore next */
    app.bind<StreamReader>(Identifiers.StreamReaderFactory).toFactory<StreamReader>(
        (context: Container.interfaces.Context) => (path: string, useCompression: boolean, decode: Function) =>
            new StreamReader(path, useCompression, decode),
    );

    /* istanbul ignore next */
    app.bind<StreamWriter>(Identifiers.StreamWriterFactory).toFactory<StreamWriter>(
        (context: Container.interfaces.Context) => (
            dbStream: NodeJS.ReadableStream,
            path: string,
            useCompression: boolean,
            encode: Function,
        ) => new StreamWriter(dbStream, path, useCompression, encode),
    );

    app.bind(Identifiers.SnapshotCodec)
        .to(Codecs.MessagePackCodec)
        .inSingletonScope()
        .when(Container.Selectors.anyAncestorOrTargetTaggedFirst("codec", "default"));

    app.bind(Identifiers.SnapshotCodec)
        .to(Codecs.JSONCodec)
        .inSingletonScope()
        .when(Container.Selectors.anyAncestorOrTargetTaggedFirst("codec", "json"));

    app.bind(Identifiers.SnapshotAction)
        .to(Actions.DumpWorkerAction)
        .inSingletonScope()
        .when(Container.Selectors.anyAncestorOrTargetTaggedFirst("action", "dump"));

    app.bind(Identifiers.SnapshotAction)
        .to(Actions.RestoreWorkerAction)
        .inSingletonScope()
        .when(Container.Selectors.anyAncestorOrTargetTaggedFirst("action", "restore"));

    app.bind(Identifiers.SnapshotAction)
        .to(Actions.VerifyWorkerAction)
        .inSingletonScope()
        .when(Container.Selectors.anyAncestorOrTargetTaggedFirst("action", "verify"));

    // For testing purposes only
    app.bind(Identifiers.SnapshotAction)
        .to(Actions.TestWorkerAction)
        .inSingletonScope()
        .when(Container.Selectors.anyAncestorOrTargetTaggedFirst("action", "test"));

    action = app.getTagged<WorkerAction>(Identifiers.SnapshotAction, "action", _workerData.actionOptions.action);

    action.init(workerData.actionOptions);
};

export const dispose = async (): Promise<void> => {
    /* istanbul ignore next */
    if (_workerData.connection) {
        const connection = app.get<Connection>(Identifiers.SnapshotDatabaseConnection);

        await connection.close();
    }
};

/* istanbul ignore next */
parentPort?.on("message", async (data) => {
    if (data.action === "start") {
        await init();

        await action.start();

        await dispose();

        process.exit();
    }
    if (data.action === "sync") {
        action.sync(data.data);
    }
});

/* istanbul ignore next */
const handleException = (err: any) => {
    parentPort!.postMessage({
        action: "exception",
        data: err,
    });

    process.exit();
};

/* istanbul ignore next */
process.on("unhandledRejection", (err) => {
    handleException(err);
});

/* istanbul ignore next */
process.on("uncaughtException", (err) => {
    handleException(err);
});

/* istanbul ignore next */
process.on("multipleResolves", (err) => {
    handleException(err);
});
