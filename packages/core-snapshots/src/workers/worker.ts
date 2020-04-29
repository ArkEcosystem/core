import { workerData, parentPort } from "worker_threads";
import { getCustomRepository, Connection, createConnection } from "typeorm";

import { Container } from "@arkecosystem/core-kernel";
import { Models } from "@arkecosystem/core-database";
import { Transactions } from "@arkecosystem/crypto";
import { Transactions as MagistrateTransactions } from "@arkecosystem/core-magistrate-crypto";

import { WorkerAction, Worker } from "../contracts";
import { Identifiers } from "../ioc";
import { Application } from "./application";
import * as Codecs from "../codecs";
import * as Actions from "./actions";
import * as Repositories from "../repositories";


let app: Application;
let action: WorkerAction;
let _workerData: Worker.WorkerData = workerData;

export const init = async () => {
    Transactions.TransactionRegistry.registerTransactionType(MagistrateTransactions.BridgechainRegistrationTransaction);
    Transactions.TransactionRegistry.registerTransactionType(MagistrateTransactions.BridgechainResignationTransaction);
    Transactions.TransactionRegistry.registerTransactionType(MagistrateTransactions.BridgechainUpdateTransaction);
    Transactions.TransactionRegistry.registerTransactionType(MagistrateTransactions.BusinessRegistrationTransaction);
    Transactions.TransactionRegistry.registerTransactionType(MagistrateTransactions.BusinessResignationTransaction);
    Transactions.TransactionRegistry.registerTransactionType(MagistrateTransactions.BusinessUpdateTransaction);

    app = new Application(new Container.Container());

    if (_workerData.connection) {
        app.bind(Identifiers.SnapshotDatabaseConnection).toConstantValue(
            await connect({ connection: _workerData.connection }),
        );
    }

    app.bind(Identifiers.SnapshotBlockRepository).toConstantValue(getCustomRepository(Repositories.BlockRepository));
    app.bind(Identifiers.SnapshotTransactionRepository).toConstantValue(
        getCustomRepository(Repositories.TransactionRepository),
    );
    app.bind(Identifiers.SnapshotRoundRepository).toConstantValue(getCustomRepository(Repositories.RoundRepository));

    app.bind(Identifiers.SnapshotCodec)
        .to(Codecs.Codec)
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
    if (workerData.connection) {
        let connection = app.get<Connection>(Identifiers.SnapshotDatabaseConnection);

        await connection.close();
    }
}

const connect = async (options: any): Promise<Connection> => {
    return createConnection({
        ...options.connection,
        namingStrategy: new Models.SnakeNamingStrategy(),
        entities: [Models.Block, Models.Transaction, Models.Round],
    });
};

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

const handleException = (err: any) => {
    parentPort!.postMessage({
        action: "exception",
        data: err,
    });

    process.exit();
}

process.on('unhandledRejection', (err) => {
    handleException(err);
});


process.on('uncaughtException', (err) => {
    handleException(err);
});


process.on('multipleResolves', (err) => {
    handleException(err);
});


