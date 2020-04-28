import "jest-extended";

import { CryptoManager } from "@packages/crypto/src";

import { fixture, identity, signedMessageEntries } from "../fixtures/identities";

let Message;
let crypto;

beforeAll(() => {
    crypto = CryptoManager.createFromPreset("testnet");
    Message = crypto.identities.message;
});

describe("Message", () => {
    describe("sign", () => {
        it("should sign a message", () => {
            // @ts-ignore
            expect(Message.sign("test", identity.passphrase)).toContainAllEntries(signedMessageEntries);
        });

        it("should be ok", () => {
            const actual = Message.sign(fixture.data.message, fixture.passphrase);

            expect(actual).toHaveProperty("publicKey");
            expect(actual).toHaveProperty("signature");
            expect(actual).toHaveProperty("message");
            expect(Message.verify(actual)).toBeTrue();
        });
    });

    describe("signWithWif", () => {
        it("should sign a message", () => {
            // @ts-ignore
            expect(Message.signWithWif("test", identity.wif)).toContainAllEntries(signedMessageEntries);
        });

        it("should sign a message and match passphrase", () => {
            const signedMessage = Message.sign("test", identity.passphrase);
            const signedWifMessage = Message.signWithWif("test", identity.wif);

            expect(signedMessage).toEqual(signedWifMessage);
        });
    });

    describe("verify", () => {
        it("should be ok", () => {
            expect(Message.verify(fixture.data)).toBeTrue();
        });

        it("should verify a signed message", () => {
            const signedMessage = Message.sign("test", identity.passphrase);
            expect(Message.verify(signedMessage)).toBe(true);
        });

        it("should verify a signed wif message", () => {
            const signedMessage = Message.signWithWif("test", identity.wif);
            expect(Message.verify(signedMessage)).toBe(true);
        });

        it("should throw when the network version is invalid", () => {
            crypto.identities.keys.version = 170;

            expect(() => Message.signWithWif("test", identity.wif)).toThrow(`Invalid network version`);
        });
    });
});
