import "jest-extended";

import { Container } from "@packages/core-kernel";
import * as Codecs from "@packages/core-snapshots/src/codecs";
import { StreamReader, StreamWriter } from "@packages/core-snapshots/src/codecs";
import { Identifiers } from "@packages/core-snapshots/src/ioc";
import * as Actions from "@packages/core-snapshots/src/workers/actions";
import { Sandbox } from "@packages/core-test-framework";
import { Managers } from "@packages/crypto";
import { Readable } from "stream";
import { dirSync, setGracefulCleanup } from "tmp";
import { Connection } from "typeorm";

import { ReadableStream, waitForMessage } from "./__support__";

jest.mock("worker_threads", () => {
    const { EventEmitter } = require("events");
    class ParentPort extends EventEmitter {
        public constructor() {
            super();
        }

        public postMessage(data) {
            this.emit("message", data);
        }
    }

    return {
        parentPort: new ParentPort(),
    };
});

let sandbox: Sandbox;
let dumpWorkerAction: Actions.DumpWorkerAction;
let verifyWorkerAction: Actions.VerifyWorkerAction;
let restoreWorkerAction: Actions.RestoreWorkerAction;

let connection: Partial<Connection>;
let blockRepository: any;
let transactionRepository: any;
let roundRepository: any;

const blocksStream = new ReadableStream("Block_", "blocks");
const transactionsStream = new ReadableStream("Transaction_", "transactions");
const roundsStream = new ReadableStream("Round_", "rounds");

class Repository {
    public constructor(private table: string) {}

    public getReadStream() {
        if (this.table === "blocks") {
            return blocksStream;
        }
        if (this.table === "transactions") {
            return transactionsStream;
        }

        return roundsStream;
    }
    public async save(val) {}
}

beforeEach(() => {
    Managers.configManager.setFromPreset("testnet");

    connection = {
        isConnected: true,
    };

    blockRepository = new Repository("blocks");

    transactionRepository = new Repository("transactions");

    roundRepository = new Repository("rounds");

    sandbox = new Sandbox();

    sandbox.app.bind(Container.Identifiers.DatabaseConnection).toConstantValue(connection);

    sandbox.app
        .bind<Repository>(Identifiers.SnapshotRepositoryFactory)
        .toFactory<Repository>((context: Container.interfaces.Context) => (table: string) => {
            if (table === "blocks") {
                return blockRepository;
            }

            if (table === "transactions") {
                return transactionRepository;
            }

            return roundRepository;
        });

    sandbox.app
        .bind<StreamReader>(Identifiers.StreamReaderFactory)
        .toFactory<StreamReader>(
            (context: Container.interfaces.Context) => (path: string, useCompression: boolean, decode: Function) =>
                new StreamReader(path, useCompression, decode),
        );

    sandbox.app
        .bind<StreamWriter>(Identifiers.StreamWriterFactory)
        .toFactory<StreamWriter>(
            (context: Container.interfaces.Context) => (
                dbStream: Readable,
                path: string,
                useCompression: boolean,
                encode: Function,
            ) => new StreamWriter(dbStream, path, useCompression, encode),
        );

    sandbox.app
        .bind(Identifiers.SnapshotCodec)
        .to(Codecs.MessagePackCodec)
        .inSingletonScope()
        .when(Container.Selectors.anyAncestorOrTargetTaggedFirst("codec", "default"));

    sandbox.app
        .bind(Identifiers.SnapshotCodec)
        .to(Codecs.JSONCodec)
        .inSingletonScope()
        .when(Container.Selectors.anyAncestorOrTargetTaggedFirst("codec", "json"));

    sandbox.app
        .bind(Identifiers.SnapshotAction)
        .to(Actions.DumpWorkerAction)
        .inSingletonScope()
        .when(Container.Selectors.anyAncestorOrTargetTaggedFirst("action", "dump"));

    sandbox.app
        .bind(Identifiers.SnapshotAction)
        .to(Actions.RestoreWorkerAction)
        .inSingletonScope()
        .when(Container.Selectors.anyAncestorOrTargetTaggedFirst("action", "restore"));

    sandbox.app
        .bind(Identifiers.SnapshotAction)
        .to(Actions.VerifyWorkerAction)
        .inSingletonScope()
        .when(Container.Selectors.anyAncestorOrTargetTaggedFirst("action", "verify"));

    dumpWorkerAction = sandbox.app.getTagged<Actions.DumpWorkerAction>(Identifiers.SnapshotAction, "action", "dump");
    verifyWorkerAction = sandbox.app.getTagged<Actions.VerifyWorkerAction>(
        Identifiers.SnapshotAction,
        "action",
        "verify",
    );
    restoreWorkerAction = sandbox.app.getTagged<Actions.RestoreWorkerAction>(
        Identifiers.SnapshotAction,
        "action",
        "restore",
    );
});

afterAll(() => {
    setGracefulCleanup();
});

describe("WorkerAction", () => {
    const cases = [
        ["blocks", "default", true],
        ["blocks", "default", false],
        ["blocks", "json", true],
        ["blocks", "json", false],
        ["transactions", "default", true],
        ["transactions", "default", false],
        ["transactions", "json", true],
        ["transactions", "json", false],
        ["rounds", "default", true],
        ["rounds", "default", false],
        ["rounds", "json", true],
        ["rounds", "json", false],
    ];

    describe.each(cases)("Table [%s] with codec [%s] and compression: [%s]", (table, codec, skipCompression) => {
        let dir: string;

        it(`should DUMP with [${codec}] codec`, async () => {
            dir = dirSync({ mode: 0o777 }).name;

            const options = {
                action: "dump",
                table: table as string,
                codec: codec as string,
                start: 1,
                end: 100,
                skipCompression: skipCompression as boolean,
                filePath: dir + "/" + table,
                updateStep: 1,
                verify: true,
            };

            dumpWorkerAction.init(options);

            await expect(dumpWorkerAction.start()).toResolve();
        });

        it(`should VERIFY with [${codec}] codec`, async () => {
            const options = {
                action: "verify",
                table: table as string,
                codec: codec as string,
                start: 1,
                end: 100,
                skipCompression: skipCompression as boolean,
                filePath: dir + "/" + table,
                updateStep: 1,
                verify: true,
            };

            verifyWorkerAction.init(options);

            await expect(waitForMessage(verifyWorkerAction, "start", undefined)).toResolve();

            await new Promise((resolve) => {
                setTimeout(() => {
                    resolve();
                }, 10);
            });

            await expect(
                waitForMessage(verifyWorkerAction, "sync", {
                    nextCount: Number.POSITIVE_INFINITY,
                }),
            ).toResolve();
        });

        it(`should RESTORE with [${codec}] codec`, async () => {
            const options = {
                action: "restore",
                table: table as string,
                codec: codec as string,
                start: 1,
                end: 100,
                skipCompression: skipCompression as boolean,
                filePath: dir + "/" + table,
                updateStep: 1,
                verify: true,
            };

            restoreWorkerAction.init(options);

            await expect(waitForMessage(restoreWorkerAction, "start", undefined)).toResolve();

            await new Promise((resolve) => {
                setTimeout(() => {
                    resolve();
                }, 10);
            });

            await expect(
                waitForMessage(restoreWorkerAction, "sync", {
                    nextCount: Number.POSITIVE_INFINITY,
                }),
            ).toResolve();
        });

        it(`should RESTORE with [${codec}] codec - without verify`, async () => {
            const options = {
                action: "restore",
                table: table as string,
                codec: codec as string,
                start: 1,
                end: 100,
                skipCompression: skipCompression as boolean,
                filePath: dir + "/" + table,
                updateStep: 2,
                verify: false,
            };

            restoreWorkerAction.init(options);

            await expect(waitForMessage(restoreWorkerAction, "start", undefined)).toResolve();

            await new Promise((resolve) => {
                setTimeout(() => {
                    resolve();
                }, 10);
            });

            await expect(
                waitForMessage(restoreWorkerAction, "sync", {
                    nextCount: Number.POSITIVE_INFINITY,
                    height: 1,
                }),
            ).toResolve();
        });
    });
});
