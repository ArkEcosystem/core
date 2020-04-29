import "jest-extended";

import { CryptoManager } from "@packages/crypto/src";
import * as networks from "@packages/crypto/src/networks";

describe("CryptoManager", () => {
    it("should be instantiated from a preset", () => {
        const cryptoManager = CryptoManager.createFromPreset("devnet");

        expect(cryptoManager).toBeObject();
    });

    it("should define other managers and libraries", () => {
        const cryptoManager = CryptoManager.createFromPreset("devnet");

        expect(cryptoManager.Identities).toBeDefined();
        expect(cryptoManager.LibraryManager).toBeDefined();
        expect(cryptoManager.HeightTracker).toBeDefined();
        expect(cryptoManager.NetworkConfigManager).toBeDefined();
        expect(cryptoManager.MilestoneManager).toBeDefined();
    });

    it("should define a heightTracker which begins at 0", () => {
        const cryptoManager = CryptoManager.createFromPreset("devnet");

        expect(cryptoManager.HeightTracker.getHeight()).toEqual(1);
    });

    it("should get all presets without being instantiated", () => {
        expect(CryptoManager.getPresets()).toEqual(networks);
    });

    it("should be able to create from each preset", () => {
        expect(CryptoManager.createFromPreset("devnet")).toBeObject();
        expect(CryptoManager.createFromPreset("mainnet")).toBeObject();
        expect(CryptoManager.createFromPreset("testnet")).toBeObject();
    });

    it("should find mainnet by name", () => {
        const actual = CryptoManager.findNetworkByName("mainnet");
        expect(actual).toMatchObject(networks.mainnet);
    });

    it("should be able to create an instance from custom config", () => {
        const customConfig = {
            exceptions: { blocks: [], transactions: [] },
            genesisBlock: { transactions: [] },
            milestones: [],
            network: {},
        };

        // @ts-ignore
        expect(CryptoManager.createFromConfig(customConfig)).toBeObject();
    });

    it("should be able to pass in custom implementations for some or all of the libraries", () => {
        const testFunction = () => {};
        const cryptoManager = CryptoManager.createFromPreset("devnet", { xor: testFunction });
        expect(cryptoManager.LibraryManager.Libraries.xor).toEqual(testFunction);
        expect(cryptoManager.LibraryManager.Libraries.aes).toBeDefined();
    });

    it("should be able to pass in custom implementations and config", () => {
        const customConfig = {
            exceptions: { blocks: [], transactions: [] },
            genesisBlock: { transactions: [] },
            milestones: [],
            network: {},
        };
        const testFunction = () => {};
        // @ts-ignore
        const cryptoManager = CryptoManager.createFromConfig(customConfig, { xor: testFunction });
        expect(cryptoManager.LibraryManager.Libraries.xor).toEqual(testFunction);
        expect(cryptoManager.LibraryManager.Libraries.aes).toBeDefined();
    });

    it("should be able to instantiate the class directly", () => {
        const customConfig = {
            exceptions: { blocks: [], transactions: [] },
            genesisBlock: { transactions: [] },
            milestones: [],
            network: {},
        };
        const testFunction = () => {};
        // @ts-ignore
        const cryptoManager = new CryptoManager(customConfig, { xor: testFunction });
        expect(cryptoManager.LibraryManager.Libraries.xor).toEqual(testFunction);
        expect(cryptoManager.LibraryManager.Libraries.aes).toBeDefined();
    });
});
