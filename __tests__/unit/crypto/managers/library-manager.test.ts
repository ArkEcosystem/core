import "jest-extended";

import { CryptoManager } from "@packages/crypto/src";

let libraryManager;

beforeAll(() => {
    const crypto = CryptoManager.createFromPreset("devnet");
    libraryManager = crypto.libraryManager;
});

describe("LibraryManager", () => {
    it("should be instantiated", () => {
        expect(libraryManager).toBeObject();
    });

    it("should defined crypto, utils and libraries", () => {
        expect(libraryManager.Crypto).toBeDefined();
        expect(libraryManager.libraries).toBeDefined();
        expect(libraryManager.Utils).toBeDefined();
    });
});
