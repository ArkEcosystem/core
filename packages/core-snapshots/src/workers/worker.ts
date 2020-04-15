import { workerData, parentPort } from "worker_threads";

import { getCustomRepository, Connection } from "typeorm";
import { Identifiers } from "../ioc";

import { Container } from "@arkecosystem/core-kernel";

import { Application } from "./application";
import { connect } from "./utils";
import { Codec, JSONCodec } from "../transport";
import { DumpWorkerAction } from "./dump-action";
import { RestoreWorkerAction } from "./restore-action";
import { VerifyWorkerAction } from "./verify-action";
import {
    SnapshotBlockRepository,
    SnapshotRoundRepository,
    SnapshotTransactionRepository,
} from "../repositories";

let app: Application;
// @ts-ignore
let isExecuted: boolean = false;

// @ts-ignore
const init = async () => {
    console.log("Starting worker with data: ", workerData);

    app = new Application(new Container.Container());

    app.bind(Identifiers.SnapshotDatabaseConnection).toConstantValue(await connect({connection: workerData.connection}));

    app
        .bind(Identifiers.SnapshotBlockRepository)
        .toConstantValue(getCustomRepository(SnapshotBlockRepository));
    app
        .bind(Identifiers.SnapshotTransactionRepository)
        .toConstantValue(getCustomRepository(SnapshotTransactionRepository));
    app
        .bind(Identifiers.SnapshotRoundRepository)
        .toConstantValue(getCustomRepository(SnapshotRoundRepository));

    app
        .bind(Identifiers.SnapshotCodec)
        .to(Codec)
        .inRequestScope()
        .when(Container.Selectors.anyAncestorOrTargetTaggedFirst("codec", "default"));

    app
        .bind(Identifiers.SnapshotCodec)
        .to(JSONCodec)
        .inSingletonScope()
        .when(Container.Selectors.anyAncestorOrTargetTaggedFirst("codec", "json"));

    app
        .bind(Identifiers.SnapshotAction)
        .to(DumpWorkerAction)
        .inSingletonScope()
        .when(Container.Selectors.anyAncestorOrTargetTaggedFirst("action", "dump"));

    app
        .bind(Identifiers.SnapshotAction)
        .to(RestoreWorkerAction)
        .inSingletonScope()
        .when(Container.Selectors.anyAncestorOrTargetTaggedFirst("action", "restore"));

    app
        .bind(Identifiers.SnapshotAction)
        .to(VerifyWorkerAction)
        .inSingletonScope()
        .when(Container.Selectors.anyAncestorOrTargetTaggedFirst("action", "verify"));
};

// @ts-ignore
const start = async () => {
    let dump = app.getTagged<DumpWorkerAction>(Identifiers.SnapshotAction, "action", workerData.actionOptions.action);

    dump.init(workerData.actionOptions);

    await dump.start();

    let connection = app.get<Connection>(Identifiers.SnapshotDatabaseConnection);

    await connection.close();

    isExecuted = true;
};

// process.on('unhandledRejection', (err) => {
//     // TODO: Fix
//     throw err;
//     // throw new Error("Unhandled Rejection");
// });

console.log("We are in the worker", workerData);

// @ts-ignore
let timeout = (): Promise<void> => {
    return new Promise<void>((resolve) => {
        setTimeout(() => {
            resolve();
        }, 1000)
    })
};

parentPort!.on("message", async (data) => {
    console.log("MESSAGE FROM PARENT", data);
    await init();

    await start();

    process.exit();
});

// const main = async () => {
//     // while (true) {
//     //     await timeout();
//     //     console.log("Waiting for start: ", workerData.actionOptions.action, workerData.actionOptions.table, isExecuted)
//     // }
// };
//
// main();

