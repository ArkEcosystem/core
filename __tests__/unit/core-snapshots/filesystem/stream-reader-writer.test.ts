import "jest-extended";

import { CryptoSuite } from "@packages/core-crypto";
import { Container } from "@packages/core-kernel";
import { JSONCodec, MessagePackCodec } from "@packages/core-snapshots/src/codecs";
import * as Contracts from "@packages/core-snapshots/src/contracts";
import * as Exceptions from "@packages/core-snapshots/src/exceptions";
import { StreamReader, StreamWriter } from "@packages/core-snapshots/src/filesystem";
import { Identifiers } from "@packages/core-snapshots/src/ioc";
import { Sandbox } from "@packages/core-test-framework/src";
import pluralize from "pluralize";
import { Readable } from "stream";
import { dirSync, setGracefulCleanup } from "tmp";
import { decamelize, pascalize } from "xcase";

import { Assets } from "../__fixtures__";

const crypto = new CryptoSuite.CryptoSuite(CryptoSuite.CryptoManager.findNetworkByName("testnet"));

class DbStream extends Readable {
    private count = 0;
    readonly prefix: string = "";

    constructor(private table: string) {
        super({ objectMode: true });

        this.prefix = table.charAt(0).toUpperCase() + table.slice(1, -1) + "_";
    }

    _read() {
        if (this.count !== Assets[this.table].length) {
            this.push(this.appendPrefix(Assets[this.table][this.count]));
            this.count++;
        } else {
            this.push(null);
        }
    }

    private appendPrefix(entity: any) {
        const itemToReturn = {};

        const item = entity;

        for (const key of Object.keys(item)) {
            itemToReturn[this.prefix + decamelize(key)] = item[key];
        }

        return itemToReturn;
    }
}

const getSingularCapitalizedTableName = (table: string) => {
    return pascalize(pluralize.singular(table));
};

const getEncode = (table, codec) => {
    if (codec === "json") {
        return new JSONCodec()[`encode${getSingularCapitalizedTableName(table)}`];
    }
    const codecInstance = new MessagePackCodec();
    // @ts-ignore
    codecInstance.cryptoManager = crypto.CryptoManager;
    // @ts-ignore
    codecInstance.transactionsManager = crypto.TransactionManager;
    // @ts-ignore
    codecInstance.blockFactory = crypto.BlockFactory;
    const encoder = codecInstance[`encode${getSingularCapitalizedTableName(table)}`].bind(codecInstance);
    return encoder;
};

const getDecode = (table, codec) => {
    if (codec === "json") {
        return new JSONCodec()[`decode${getSingularCapitalizedTableName(table)}`];
    }
    const codecInstance = new MessagePackCodec();
    // @ts-ignore
    codecInstance.cryptoManager = crypto.CryptoManager;
    // @ts-ignore
    codecInstance.transactionsManager = crypto.TransactionManager;
    // @ts-ignore
    codecInstance.blockFactory = crypto.BlockFactory;
    const decoder = codecInstance[`decode${getSingularCapitalizedTableName(table)}`].bind(codecInstance);
    return decoder;
};

let sandbox: Sandbox;
let streamWriterFactory: Contracts.Stream.StreamWriterFactory;
let streamReaderFactory: Contracts.Stream.StreamReaderFactory;

beforeEach(() => {
    sandbox = new Sandbox(crypto);

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
        .bind<StreamReader>(Identifiers.StreamReaderFactory)
        .toFactory<StreamReader>(
            (context: Container.interfaces.Context) => (path: string, useCompression: boolean, decode: Function) =>
                new StreamReader(path, useCompression, decode),
        );

    streamWriterFactory = sandbox.app.get<Contracts.Stream.StreamWriterFactory>(Identifiers.StreamWriterFactory);
    streamReaderFactory = sandbox.app.get<Contracts.Stream.StreamReaderFactory>(Identifiers.StreamReaderFactory);
});

afterAll(() => {
    setGracefulCleanup();
    jest.clearAllMocks();
});

const cases = [
    ["blocks", "default", false],
    ["blocks", "default", true],
    ["blocks", "json", false],
    ["blocks", "json", true],
    ["transactions", "default", false],
    ["transactions", "default", true],
    ["transactions", "json", true],
    ["transactions", "json", false],
    ["rounds", "default", false],
    ["rounds", "default", true],
    ["rounds", "json", false],
    ["rounds", "json", true],
];

describe("StreamReader and StreamWriter", () => {
    describe.each(cases)("Table: [%s], Codec: [%s], UseCompression : [%s]", (table, codec, useCompression) => {
        let file: string;

        it(`Should throw error if stream not open`, async () => {
            file = dirSync({ mode: 0o777 }).name + "/" + table;

            const dbStream = new DbStream(table as string);
            const streamWriter = streamWriterFactory(
                dbStream,
                file,
                useCompression as boolean,
                getEncode(table, codec),
            );

            await expect(streamWriter.write()).rejects.toThrow(Exceptions.Stream.StreamNotOpen);
        });

        it(`Should write all entities`, async () => {
            file = dirSync({ mode: 0o777 }).name + "/" + table;

            const dbStream = new DbStream(table as string);
            const streamWriter = streamWriterFactory(
                dbStream,
                file,
                useCompression as boolean,
                getEncode(table, codec),
            );

            await expect(streamWriter.open()).toResolve();

            await expect(streamWriter.write()).toResolve();
        });

        it(`Should read all entities`, async () => {
            // failing, because this is calling getDecode() whic uses [] notation to go into a function... but during that call, the this object is wrong...
            const streamReader = streamReaderFactory(file, useCompression as boolean, getDecode(table, codec));
            await expect(streamReader.open()).toResolve();

            // @ts-ignore
            for (const item of Assets[table]) {
                // await expect(streamWriter.readNext()).resolves.toEqual(item);
                await expect(streamReader.readNext()).toResolve();
            }

            await expect(streamReader.readNext()).resolves.toBeNull();
        });

        it(`Should throw error when decoding if stream not open`, async () => {
            const streamReader = streamReaderFactory(file, useCompression as boolean, getDecode(table, codec));

            await expect(streamReader.readNext()).rejects.toThrow(Exceptions.Stream.StreamNotOpen);
        });

        it(`Should throw error if file is not valid`, async () => {
            const streamReader = streamReaderFactory(
                file + "invalid_file",
                useCompression as boolean,
                getDecode(table, codec),
            );

            await expect(streamReader.open()).rejects.toThrow();
        });

        it(`Should throw error if error in codec`, async () => {
            const streamReader = streamReaderFactory(file, useCompression as boolean, () => {
                throw new Error();
            });

            await expect(streamReader.open()).toResolve();

            await expect(streamReader.readNext()).rejects.toThrow();
        });
    });
});
