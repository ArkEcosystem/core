import "jest-extended";

import {decamelize} from "xcase";
import { dirSync, setGracefulCleanup } from "tmp";
import { Connection } from "typeorm";
import { Assets } from "../../__fixtures__";
import { Container } from "@packages/core-kernel";
import { Identifiers } from "@packages/core-snapshots/src/ioc";
import { Sandbox } from "@packages/core-test-framework/src";
import * as Codecs from "@packages/core-snapshots/src/codecs";
import * as Actions from "@packages/core-snapshots/src/workers/actions";
import {Readable} from "stream";

let sandbox: Sandbox;
let dumpWorkerAction: Actions.DumpWorkerAction;
let verifyWorkerAction: Actions.VerifyWorkerAction;
let restoreWorkerAction: Actions.RestoreWorkerAction;


let connection: Partial<Connection>;
let blockRepository: any;
let transactionRepository: any;
let roundRepository: any;

class ReadableStream extends Readable {
    private count = 0;

    constructor(private prefix: string, private table: string) {
        super({objectMode: true});
    }

    _read() {
        if (this.count !== Assets[this.table].length) {
            this.push(this.appendPrefix(Assets[this.table][this.count]));
            this.count++;
        }
        else {
            this.push(null)
        }
    }

    private appendPrefix(entity: any) {
        let itemToReturn = {};

        let item = entity;
        // let item = decamelizeKeys(itemToReturn)

        for(let key of Object.keys(item)) {
            itemToReturn[this.prefix + decamelize(key)] = item[key];
        }

        return itemToReturn;
    }
}

let stream = new ReadableStream("Block_", "blocks");

class Repository {
    public createQueryBuilder = jest.fn().mockReturnValue(this);

    orderBy = jest.fn().mockReturnValue(this);
    stream = jest.fn().mockReturnValue(stream);
    async save(val) {};
}


beforeEach(() => {

    connection = {
        isConnected: true
    };

    blockRepository = new Repository();

    transactionRepository = new Repository();

    roundRepository = new Repository();

    sandbox = new Sandbox;

    sandbox.app.bind(Container.Identifiers.DatabaseConnection).toConstantValue(connection);

    sandbox.app.bind(Identifiers.SnapshotBlockRepository).toConstantValue(blockRepository);
    sandbox.app.bind(Identifiers.SnapshotTransactionRepository).toConstantValue(transactionRepository);
    sandbox.app.bind(Identifiers.SnapshotRoundRepository).toConstantValue(roundRepository);

    sandbox.app.bind(Identifiers.SnapshotCodec)
        .to(Codecs.Codec)
        .inSingletonScope()
        .when(Container.Selectors.anyAncestorOrTargetTaggedFirst("codec", "default"));

    sandbox.app.bind(Identifiers.SnapshotCodec)
        .to(Codecs.JSONCodec)
        .inSingletonScope()
        .when(Container.Selectors.anyAncestorOrTargetTaggedFirst("codec", "json"));

    sandbox.app.bind(Identifiers.SnapshotAction)
        .to(Actions.DumpWorkerAction)
        .inSingletonScope()
        .when(Container.Selectors.anyAncestorOrTargetTaggedFirst("action", "dump"));

    sandbox.app.bind(Identifiers.SnapshotAction)
        .to(Actions.RestoreWorkerAction)
        .inSingletonScope()
        .when(Container.Selectors.anyAncestorOrTargetTaggedFirst("action", "restore"));

    sandbox.app.bind(Identifiers.SnapshotAction)
        .to(Actions.VerifyWorkerAction)
        .inSingletonScope()
        .when(Container.Selectors.anyAncestorOrTargetTaggedFirst("action", "verify"));

    dumpWorkerAction = sandbox.app.getTagged<Actions.DumpWorkerAction>(Identifiers.SnapshotAction, "action", "dump");
    verifyWorkerAction = sandbox.app.getTagged<Actions.VerifyWorkerAction>(Identifiers.SnapshotAction, "action", "verify");
    restoreWorkerAction = sandbox.app.getTagged<Actions.RestoreWorkerAction>(Identifiers.SnapshotAction, "action", "restore");
});

afterAll(() => {
    setGracefulCleanup();
});

describe("WorkerAction", () => {
    const cases = [
        ["default", true],
        ["default", false],
        ["json", true],
        ["json", false]
    ]

    describe.each(cases)("Blocks with [%s] codec and compression: [%s]", (codec, skipCompression) => {
        let dir: string;
        let table = "blocks";
        let genesisBlockId = Assets.blocks[1].previousBlock;

        it(`should DUMP with [${codec}] codec`, async () => {
            dir = dirSync({mode: 0o777}).name;

            let options = {
                table: table,
                codec: codec,
                skipCompression: skipCompression,
                trace: false,
                filePath: dir + "/" + table,
                genesisBlockId: genesisBlockId,
                updateStep: 1,
            }

            dumpWorkerAction.init(options);

            await expect(dumpWorkerAction.start()).toResolve();
        });

        it(`should VERIFY with [${codec}] codec`, async () => {
            let options = {
                table: table,
                codec: codec,
                skipCompression: skipCompression,
                trace: false,
                filePath: dir + "/" + table,
                genesisBlockId: genesisBlockId,
                updateStep: 1,
            }

            verifyWorkerAction.init(options);

            await expect(verifyWorkerAction.start()).toResolve();
        });

        it(`should RESTORE with [${codec}] codec`, async () => {
            let options = {
                table: table,
                codec: codec,
                skipCompression: skipCompression,
                trace: false,
                filePath: dir + "/" + table,
                genesisBlockId: genesisBlockId,
                updateStep: 1,
            }

            restoreWorkerAction.init(options);

            await expect(restoreWorkerAction.start()).toResolve();
        });
    })
});
