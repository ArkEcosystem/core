import "jest-extended";

import { CryptoManager } from "@packages/crypto/src";

describe("Base58", () => {
    let Base58;
    let createPayload;
    beforeAll(() => {
        const crypto = CryptoManager.createFromPreset("testnet");
        Base58 = crypto.LibraryManager.Crypto.Base58;

        createPayload = () => {
            const buffer: Buffer = crypto.LibraryManager.Crypto.HashAlgorithms.ripemd160(
                Buffer.from("034151a3ec46b5670a682b0a63394f863587d1bc97483b1b6c70eb58e7f0aed192", "hex"),
            );
            const payload: Buffer = Buffer.alloc(21);

            payload.writeUInt8(30, 0);
            buffer.copy(payload, 1);

            return payload;
        };
    });

    it("encodeCheck", () => {
        expect(Base58.encode(createPayload())).toBe("D61mfSggzbvQgTUe6JhYKH2doHaqJ3Dyib");
    });

    it("decodeCheck", () => {
        expect(Base58.decode("D61mfSggzbvQgTUe6JhYKH2doHaqJ3Dyib")).toEqual(createPayload());
    });
});
