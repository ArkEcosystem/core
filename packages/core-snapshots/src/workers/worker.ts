import { workerData, parentPort } from "worker_threads";
import { getCustomRepository, Connection, createConnection } from "typeorm";

import { Container } from "@arkecosystem/core-kernel";
import { Models } from "@arkecosystem/core-database";

import { WorkerAction } from "../contracts";
import { Identifiers } from "../ioc";
import { Application } from "./application";
import * as Codecs from "../codecs";
import * as Actions from "./actions";
import * as Repositories from "../repositories";

let app: Application;
let action: WorkerAction;

export const init = async () => {
    app = new Application(new Container.Container());

    app.bind(Identifiers.SnapshotDatabaseConnection).toConstantValue(
        await connect({ connection: workerData.connection }),
    );

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

    action = app.getTagged<WorkerAction>(Identifiers.SnapshotAction, "action", workerData.actionOptions.action);

    action.init(workerData.actionOptions);
};

const dispose = async (): Promise<void> => {
    let connection = app.get<Connection>(Identifiers.SnapshotDatabaseConnection);

    await connection.close();
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

process.on('unhandledRejection', (err) => {
    console.log("unhandledRejection", err)

    parentPort!.postMessage({
        action: "unhandledRejection",
        data: err,
    });

    process.exit();
});

process.on('uncaughtException', (err) => {
    console.log("uncaughtException", err)

    parentPort!.postMessage({
        action: "unhandledRejection",
        data: err,
    });

    process.exit();
});

// TODO: uncaughtException

