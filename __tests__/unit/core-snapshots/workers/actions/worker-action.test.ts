import "jest-extended";

import { dirSync, setGracefulCleanup } from "tmp";
import { Connection } from "typeorm";
// @ts-ignore
import * as WorkerThreads from "worker_threads";

import { Assets } from "../../__fixtures__";
import { CryptoSuite } from "../../../../../packages/core-crypto";
import { Container } from "../../../../../packages/core-kernel";
import * as Codecs from "../../../../../packages/core-snapshots/src/codecs";
import { StreamReader, StreamWriter } from "../../../../../packages/core-snapshots/src/codecs";
import { Identifiers } from "../../../../../packages/core-snapshots/src/ioc";
import * as Actions from "../../../../../packages/core-snapshots/src/workers/actions";
import { Sandbox } from "../../../../../packages/core-test-framework/src";
import { Types } from "../../../../../packages/crypto";
import { ReadableStream, waitForMessage } from "./__support__";

jest.mock("worker_threads", () => {
    const { EventEmitter } = require("events");
    // @ts-ignore
    class ParentPort extends EventEmitter {
        constructor() {
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

const stream = new ReadableStream("Block_", "blocks");

class Repository {
    getReadStream = jest.fn().mockResolvedValue(stream);
    async save(val) {}
}

const crypto = new CryptoSuite.CryptoSuite(CryptoSuite.CryptoManager.findNetworkByName("testnet"));

beforeEach(() => {
    connection = {
        isConnected: true,
    };

    blockRepository = new Repository();

    transactionRepository = new Repository();

    roundRepository = new Repository();

    sandbox = new Sandbox(crypto);

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
                dbStream: NodeJS.ReadableStream,
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

    describe.each(cases)("Blocks with [%s] codec and compression: [%s]", (table, codec, skipCompression) => {
        let dir: string;
        const genesisBlockId = Assets.blocks[1].previousBlock;

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
                genesisBlockId: genesisBlockId,
                updateStep: 1,
                verify: true,
                network: "testnet" as Types.NetworkName,
            };

            dumpWorkerAction.init(options);

            await expect(dumpWorkerAction.start()).toResolve();
        });

        it(`should VERIFY with [${codec}] codec`, async () => {
            const options = {
                action: "dump",
                table: table as string,
                codec: codec as string,
                start: 1,
                end: 100,
                skipCompression: skipCompression as boolean,
                filePath: dir + "/" + table,
                genesisBlockId: genesisBlockId,
                updateStep: 1,
                verify: true,
                network: "testnet" as Types.NetworkName,
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
                action: "dump",
                table: table as string,
                codec: codec as string,
                start: 1,
                end: 100,
                skipCompression: skipCompression as boolean,
                filePath: dir + "/" + table,
                genesisBlockId: genesisBlockId,
                updateStep: 1,
                verify: true,
                network: "testnet" as Types.NetworkName,
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
    });
});
