import "jest-extended";
import { dirSync, setGracefulCleanup } from "tmp";

import { Container } from "@arkecosystem/core-kernel";
import { Sandbox } from "@packages/core-test-framework";
import { Identifiers } from "@packages/core-snapshots/src/ioc";
import { Filesystem } from "@packages/core-snapshots/src/filesystem/filesystem";
import { LocalFilesystem } from "@packages/core-kernel/src/services/filesystem/drivers/local";

import { metaData } from "../__fixtures__/assets";

let sandbox: Sandbox;

let filesystem: Filesystem;

beforeEach(() => {
    sandbox = new Sandbox;

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
            expect(() => {filesystem.getSnapshotPath()}).toThrowError();
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

    describe("writeMetaData", () => {
        it("should write meta data", async () => {
            const dir: string = dirSync().name;
            const subdir: string = `${dir}/sub`;

            filesystem.getSnapshotPath = jest.fn().mockReturnValue(subdir);

            await expect(filesystem.writeMetaData(metaData)).toResolve();

            await expect(filesystem.readMetaData()).resolves.toEqual(metaData);
        });
    });
});
