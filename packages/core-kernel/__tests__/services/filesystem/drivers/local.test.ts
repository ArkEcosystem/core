import "jest-extended";

import { LocalFilesystem } from "@packages/core-kernel/src/services/filesystem/drivers/local";
import { dirSync, fileSync, setGracefulCleanup } from "tmp";

let fs: LocalFilesystem;
beforeEach(() => (fs = new LocalFilesystem()));

afterAll(() => setGracefulCleanup());

describe("LocalFilesystem", () => {
    it("should make an instance of the filesystem", async () => {
        await expect(fs.make()).resolves.toBeInstanceOf(LocalFilesystem);
    });

    it("should write and read the given value", async () => {
        const file: string = fileSync().name;

        await expect(fs.put(file, "Hello World")).resolves.toBeTrue();
        await expect(fs.get(file)).resolves.toEqual(Buffer.from("Hello World"));
    });

    it("should fail to write the given value", async () => {
        await expect(fs.put(undefined, "Hello World")).resolves.toBeFalse();
    });

    it("should delete the given file", async () => {
        const file: string = fileSync().name;

        await expect(fs.exists(file)).resolves.toBeTrue();

        await expect(fs.delete(file)).resolves.toBeTrue();

        await expect(fs.exists(file)).resolves.toBeFalse();
    });

    it("should fail to delete the given file", async () => {
        await expect(fs.delete(undefined)).resolves.toBeFalse();
    });

    it("should copy the given file", async () => {
        const fileSource: string = fileSync().name;
        const fileDest: string = `${fileSource}.copy`;

        await expect(fs.exists(fileSource)).resolves.toBeTrue();
        await expect(fs.exists(fileDest)).resolves.toBeFalse();

        await expect(fs.copy(fileSource, fileDest)).resolves.toBeTrue();

        await expect(fs.exists(fileSource)).resolves.toBeTrue();
        await expect(fs.exists(fileDest)).resolves.toBeTrue();
    });

    it("should fail to copy the given file", async () => {
        await expect(fs.copy(undefined, undefined)).resolves.toBeFalse();
    });

    it("should move the given file", async () => {
        const fileSource: string = fileSync().name;
        const fileDest: string = `${fileSource}.move`;

        await expect(fs.exists(fileSource)).resolves.toBeTrue();
        await expect(fs.exists(fileDest)).resolves.toBeFalse();

        await expect(fs.move(fileSource, fileDest)).resolves.toBeTrue();

        await expect(fs.exists(fileSource)).resolves.toBeFalse();
        await expect(fs.exists(fileDest)).resolves.toBeTrue();
    });

    it("should fail to move the given file", async () => {
        await expect(fs.move(undefined, undefined)).resolves.toBeFalse();
    });

    it("should return the size of the given file", async () => {
        const file: string = fileSync().name;

        await fs.put(file, "Hello World");

        await expect(fs.size(file)).resolves.toBe(11);
    });

    it("should return the last time the file was modified", async () => {
        const file: string = fileSync().name;

        await fs.put(file, "Hello World");

        await expect(fs.lastModified(file)).resolves.toBeNumber();
    });

    it(".files", async () => {
        const dir: string = dirSync().name;
        const file: string = `${dir}/files.txt`;

        await fs.put(file, "Hello World");

        await expect(fs.files(dir)).resolves.toEqual([file]);
    });

    it(".directories", async () => {
        const dir: string = dirSync().name;
        const subdir: string = `${dir}/sub`;

        await fs.makeDirectory(subdir);

        await expect(fs.directories(dir)).resolves.toEqual([subdir]);
    });

    it("should create the given directory", async () => {
        const dir: string = `${dirSync().name}/sub`;

        await expect(fs.exists(dir)).resolves.toBeFalse();

        await expect(fs.makeDirectory(dir)).resolves.toBeTrue();

        await expect(fs.exists(dir)).resolves.toBeTrue();
    });

    it("should fail to create the given directory", async () => {
        await expect(fs.makeDirectory(undefined)).resolves.toBeFalse();
    });

    it("should delete the given directory", async () => {
        const dir: string = dirSync().name;

        await expect(fs.exists(dir)).resolves.toBeTrue();

        await expect(fs.deleteDirectory(dir)).resolves.toBeTrue();

        await expect(fs.exists(dir)).resolves.toBeFalse();
    });

    it("should fail to delete the given directory", async () => {
        await expect(fs.deleteDirectory(undefined)).resolves.toBeFalse();
    });
});
