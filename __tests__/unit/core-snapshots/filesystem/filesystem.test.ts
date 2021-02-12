import "jest-extended";

import { Container } from "@arkecosystem/core-kernel";
import { LocalFilesystem } from "@packages/core-kernel/src/services/filesystem/drivers/local";
import { Filesystem } from "@packages/core-snapshots/src/filesystem/filesystem";
import { Identifiers } from "@packages/core-snapshots/src/ioc";
import { Sandbox } from "@packages/core-test-framework";
import { cloneDeep } from "lodash";
import { dirSync, setGracefulCleanup } from "tmp";

import { metaData } from "../__fixtures__/assets";

let sandbox: Sandbox;

let filesystem: Filesystem;

beforeEach(() => {
    sandbox = new Sandbox();

    sandbox.app.bind(Container.Identifiers.FilesystemService).to(LocalFilesystem).inSingletonScope();

    sandbox.app.bind(Identifiers.SnapshotFilesystem).to(Filesystem).inSingletonScope();

    filesystem = sandbox.app.get<Filesystem>(Identifiers.SnapshotFilesystem);
});

afterEach(() => {
    setGracefulCleanup();
    jest.resetAllMocks();
});

describe("Filesystem", () => {
    describe("getSnapshotFolderPath", () => {
        it("should return if network and snapshot are set", async () => {
            filesystem.setSnapshot("1-200");

            expect(filesystem.getSnapshotPath()).toBeString();
        });

        it("should throw error if no snapshot is set", async () => {
            expect(() => {
                filesystem.getSnapshotPath();
            }).toThrowError();
        });
    });

    describe("prepareDir", () => {
        it("should make directory", async () => {
            const dir: string = dirSync().name;
            const subdir: string = `${dir}/sub`;

            filesystem.getSnapshotPath = jest.fn().mockReturnValue(subdir);

            await expect(filesystem.prepareDir()).toResolve();

            await expect(filesystem.snapshotExists()).resolves.toBeTrue();
        });
    });

    describe("deleteSnapshot", () => {
        it("should make directory", async () => {
            const dir: string = dirSync().name;

            filesystem.getSnapshotPath = jest.fn().mockReturnValue(dir);

            await expect(filesystem.writeMetaData(metaData)).toResolve();

            await expect(filesystem.snapshotExists()).resolves.toBeTrue();
            await expect(filesystem.deleteSnapshot()).toResolve();
            await expect(filesystem.snapshotExists()).resolves.toBeFalse();
        });
    });

    describe("writeMetaData", () => {
        it("should write meta data", async () => {
            const dir: string = dirSync().name;
            const subdir: string = `${dir}/sub`;

            filesystem.getSnapshotPath = jest.fn().mockReturnValue(subdir);

            await expect(filesystem.writeMetaData(metaData)).toResolve();

            await expect(filesystem.readMetaData()).resolves.toEqual(metaData);
        });
    });

    describe("validateMetaData", () => {
        let tmpMeta;

        beforeEach(() => {
            const dir: string = dirSync().name;
            const subdir: string = `${dir}/sub`;

            filesystem.getSnapshotPath = jest.fn().mockReturnValue(subdir);

            tmpMeta = cloneDeep(metaData);
        });

        it("should throw if codec is missing", async () => {
            delete tmpMeta.codec;

            await expect(filesystem.writeMetaData(tmpMeta)).toResolve();

            await expect(filesystem.readMetaData()).rejects.toThrowError();
        });

        it("should throw if skipCompression is missing", async () => {
            delete tmpMeta.skipCompression;

            await expect(filesystem.writeMetaData(tmpMeta)).toResolve();

            await expect(filesystem.readMetaData()).rejects.toThrowError();
        });

        it("should throw if blocks is missing", async () => {
            delete tmpMeta.blocks;

            await expect(filesystem.writeMetaData(tmpMeta)).toResolve();

            await expect(filesystem.readMetaData()).rejects.toThrowError();
        });

        it("should throw if blocks.count is missing", async () => {
            delete tmpMeta.blocks.count;

            await expect(filesystem.writeMetaData(tmpMeta)).toResolve();

            await expect(filesystem.readMetaData()).rejects.toThrowError();
        });

        it("should throw if transactions is missing", async () => {
            delete tmpMeta.transactions;

            await expect(filesystem.writeMetaData(tmpMeta)).toResolve();

            await expect(filesystem.readMetaData()).rejects.toThrowError();
        });

        it("should throw if transactions.count is missing", async () => {
            delete tmpMeta.transactions.count;

            await expect(filesystem.writeMetaData(tmpMeta)).toResolve();

            await expect(filesystem.readMetaData()).rejects.toThrowError();
        });

        it("should throw if rounds is missing", async () => {
            delete tmpMeta.rounds;

            await expect(filesystem.writeMetaData(tmpMeta)).toResolve();

            await expect(filesystem.readMetaData()).rejects.toThrowError();
        });

        it("should throw if rounds.count is missing", async () => {
            delete tmpMeta.rounds.count;

            await expect(filesystem.writeMetaData(tmpMeta)).toResolve();

            await expect(filesystem.readMetaData()).rejects.toThrowError();
        });
    });
});
