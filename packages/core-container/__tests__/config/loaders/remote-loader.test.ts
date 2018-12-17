import "jest-extended";

import { existsSync, pathExistsSync, removeSync } from "fs-extra";
import * as mockProcess from "jest-mock-process";

import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { RemoteLoader } from "../../../src/config/loaders";

const axiosMock = new MockAdapter(axios);
const configDir = "./__test-remote-config__";

let testSubject;

afterAll(() => {
    removeSync(configDir);
});

beforeEach(() => {
    testSubject = new RemoteLoader({
        remote: "127.0.0.1:4002",
        config: configDir,
        data: "./data",
    });
});

afterEach(() => {
    axiosMock.reset();
});

describe.skip("Remote Loader", () => {
    it("should ensure the config directory exists", () => {
        expect(pathExistsSync(testSubject.config)).toBeTrue();
    });

    describe("__configureNetwork", () => {
        it("should not be OK", async () => {
            const mockExit = mockProcess.mockProcessExit();

            axiosMock.onGet("http://127.0.0.1:4002/config/network").reply(() => [404, {}]);

            await testSubject.__configureNetwork();

            expect(mockExit).toHaveBeenCalledWith(1);
        });

        it("should be OK", async () => {
            axiosMock.onGet("http://127.0.0.1:4002/config/network").reply(() => [
                200,
                {
                    data: require("../../crypto/src/networks/devnet.json"),
                },
            ]);

            await testSubject.__configureNetwork();

            expect(existsSync(`${configDir}/network.json`)).toBeTrue();
        });
    });

    describe("__configureGenesisBlock", () => {
        it("should not be OK", async () => {
            axiosMock.onGet("http://127.0.0.1:4002/config/genesis-block").reply(() => [404, {}]);

            await expect(testSubject.__configureGenesisBlock()).rejects.toThrowError();
        });

        it("should be OK", async () => {
            axiosMock.onGet("http://127.0.0.1:4002/config/genesis-block").reply(() => [
                200,
                {
                    data: require("../../core/src/config/devnet/genesisBlock.json"),
                },
            ]);

            await testSubject.__configureGenesisBlock();

            expect(existsSync(`${configDir}/genesisBlock.json`)).toBeTrue();
        });
    });

    describe("__configurePeers", () => {
        it("should not be OK", async () => {
            const mockExit = mockProcess.mockProcessExit();

            axiosMock.onGet("http://127.0.0.1:4002/config/peers").reply(() => [404, {}]);

            await testSubject.__configurePeers();

            expect(mockExit).toHaveBeenCalledWith(1);
        });

        it("should be OK", async () => {
            axiosMock.onGet("http://127.0.0.1:4002/config/peers").reply(() => [
                200,
                {
                    data: require("../../core/src/config/devnet/peers.json"),
                },
            ]);

            await testSubject.__configurePeers();

            expect(existsSync(`${configDir}/peers.json`)).toBeTrue();
        });
    });

    describe("__configureDelegates", () => {
        it("should not be OK", async () => {
            const mockExit = mockProcess.mockProcessExit();

            axiosMock.onGet("http://127.0.0.1:4002/config/delegates").reply(() => [404, {}]);

            await testSubject.__configureDelegates();

            expect(mockExit).toHaveBeenCalledWith(1);
        });

        it("should be OK", async () => {
            axiosMock.onGet("http://127.0.0.1:4002/config/delegates").reply(() => [
                200,
                {
                    data: require("../../core/src/config/devnet/delegates.json"),
                },
            ]);

            await testSubject.__configureDelegates();

            expect(existsSync(`${configDir}/delegates.json`)).toBeTrue();
        });
    });

    describe("__configurePlugins", () => {
        it("should be OK", async () => {
            await testSubject.__configurePlugins({ name: "devnet" });

            expect(existsSync(`${configDir}/plugins.js`)).toBeTrue();
        });
    });
});
