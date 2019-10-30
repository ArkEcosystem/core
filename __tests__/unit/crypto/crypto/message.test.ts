import "jest-extended";

import { configManager } from "../../../../packages/crypto/src/managers/config";
import { Message } from "../../../../packages/crypto/src/crypto/message";
import { identity } from "@packages/core-test-framework/src/utils/identities";

const signedMessageEntries: any = [
    ["publicKey", identity.publicKey],
    [
        "signature",
        "3045022100b5ad008d8a2935cd2261c56ef1605b2e35810f47940277d1d8a6a202a08c6de0022021fcbf9ec9db67f8c7019ff2ce07376f8a203ea77f26f2f7d564d5b8f4bde1a7",
    ],
    ["message", "test"],
];

beforeAll(() => configManager.setFromPreset("unitnet"));

describe("Message", () => {
    describe("sign", () => {
        it("should sign a message", () => {
            expect(Message.sign("test", identity.bip39)).toContainAllEntries(signedMessageEntries);
        });
    });

    describe("signWithWif", () => {
        it("should sign a message", () => {
            expect(Message.signWithWif("test", identity.wif)).toContainAllEntries(signedMessageEntries);
        });

        it("should sign a message and match passphrase", () => {
            const signedMessage = Message.sign("test", identity.bip39);
            const signedWifMessage = Message.signWithWif("test", identity.wif);
            expect(signedMessage).toEqual(signedWifMessage);
        });
    });

    describe("verify", () => {
        it("should verify a signed message", () => {
            const signedMessage = Message.sign("test", identity.bip39);
            expect(Message.verify(signedMessage)).toBe(true);
        });

        it("should verify a signed wif message", () => {
            const signedMessage = Message.signWithWif("test", identity.wif);
            expect(Message.verify(signedMessage)).toBe(true);
        });
    });
});
