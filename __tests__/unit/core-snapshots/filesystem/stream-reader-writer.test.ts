import "jest-extended";

import { Readable } from "stream";
import { dirSync, setGracefulCleanup } from "tmp";
import {decamelize} from "xcase";

import { Container } from "@packages/core-kernel";
import { Sandbox } from "@packages/core-test-framework/src";

import { StreamReader, StreamWriter } from "@packages/core-snapshots/src/filesystem";
import { Identifiers } from "@packages/core-snapshots/src/ioc";
import * as Contracts from "@packages/core-snapshots/src/contracts";
import { JSONCodec, MessagePackCodec } from "@packages/core-snapshots/src/codecs";
import * as Exceptions from "@packages/core-snapshots/src/exceptions";

import { Assets } from "../__fixtures__";


class DbStream extends Readable {
    private count = 0;
    private prefix: string = "";

    constructor(private table: string) {
        super({objectMode: true});

        switch (table) {
            case "blocks":
                this.prefix = "Block_"
                break;
            case "transactions":
                this.prefix = "Transaction_"
                break
            case "rounds":
                this.prefix = "Round_"
                break;
        }
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

        for(let key of Object.keys(item)) {
            itemToReturn[this.prefix + decamelize(key)] = item[key];
        }

        return itemToReturn;
    }
}

let sandbox: Sandbox;
let streamWriterFactory: Contracts.Stream.StreamWriterFactory;
let streamReaderFactory: Contracts.Stream.StreamReaderFactory;

beforeEach(() => {
    sandbox = new Sandbox();

    sandbox.app
        .bind<StreamWriter>(Identifiers.StreamWriterFactory)
        .toFactory<StreamWriter>((context: Container.interfaces.Context) => (dbStream: NodeJS.ReadableStream, path: string, useCompression: boolean, encode: Function) =>
            new StreamWriter(dbStream, path, useCompression, encode)
        );

    sandbox.app
        .bind<StreamReader>(Identifiers.StreamReaderFactory)
        .toFactory<StreamReader>((context: Container.interfaces.Context) => (path: string, useCompression: boolean, decode: Function) =>
            new StreamReader(path, useCompression, decode)
        );

    streamWriterFactory = sandbox.app.get<Contracts.Stream.StreamWriterFactory>(Identifiers.StreamWriterFactory);
    streamReaderFactory = sandbox.app.get<Contracts.Stream.StreamReaderFactory>(Identifiers.StreamReaderFactory);
})

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
]

const getEncode = (table, codec) => {
    if (codec === "json") {
        return new JSONCodec()[`${table}Encode`];
    } else {
        return new MessagePackCodec()[`${table}Encode`];
    }
}

const getDecode = (table, codec) => {
    if (codec === "json") {
        return new JSONCodec()[`${table}Decode`];
    } else {
        return new MessagePackCodec()[`${table}Decode`];
    }
}

describe("StreamReader and StreamWriter", () => {
    describe.each(cases)("Table: [%s], Codec: [%s], UseCompression : [%s]", (table, codec, useCompression) => {
        let file: string;

        it(`Should throw error if stream not open`, async () => {
            file = dirSync({mode: 0o777}).name +  "/" +  table;

            let dbStream = new DbStream(table as string);
            let streamWriter = streamWriterFactory(dbStream, file, useCompression as boolean, getEncode(table, codec));

            await expect(streamWriter.write()).rejects.toThrow(Exceptions.Stream.StreamNotOpen);
        })

        it(`Should write all entities`, async () => {
            file = dirSync({mode: 0o777}).name +  "/" +  table;

            let dbStream = new DbStream(table as string);
            let streamWriter = streamWriterFactory(dbStream, file, useCompression as boolean, getEncode(table, codec));

            await expect(streamWriter.open()).toResolve();

            await expect(streamWriter.write()).toResolve();
        })

        it(`Should read all entities`, async () => {
            let streamReader = streamReaderFactory(file, useCompression as boolean, getDecode(table, codec))

            await expect(streamReader.open()).toResolve();

            // @ts-ignore
            for(let item of Assets[table]) {
                // await expect(streamWriter.readNext()).resolves.toEqual(item);
                await expect(streamReader.readNext()).toResolve();
            }

            await expect(streamReader.readNext()).resolves.toBeNull();
        })

        it(`Should throw error if stream not open`, async () => {
            let streamReader = streamReaderFactory(file, useCompression as boolean, getDecode(table, codec))

            await expect(streamReader.readNext()).rejects.toThrow(Exceptions.Stream.StreamNotOpen);
        })

        it(`Should throw error if file is not valid`, async () => {
            let streamReader = streamReaderFactory(file + "invalid_file", useCompression as boolean, getDecode(table, codec))

            await expect(streamReader.open()).rejects.toThrow();
        })

        it(`Should throw error if error in codec`, async () => {
            let streamReader = streamReaderFactory(file, useCompression as boolean,() => {
                throw new Error();
            })

            await expect(streamReader.open()).toResolve();

            await expect(streamReader.readNext()).rejects.toThrow();
        })
    })
});
