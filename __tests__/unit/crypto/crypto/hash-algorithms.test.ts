import "jest-extended";

import { HashAlgorithms } from "../../../../packages/crypto/src/crypto/hash-algorithms";
import fixtures from "./fixtures/crypto.json";

const buffer = Buffer.from("Hello World");

describe("Crypto - Utils", () => {
    it("should return valid ripemd160", () => {
        expect(HashAlgorithms.ripemd160(buffer).toString("hex")).toEqual(fixtures.ripemd160);
    });

    it("should return valid sha1", () => {
        expect(HashAlgorithms.sha1(buffer).toString("hex")).toEqual(fixtures.sha1);
    });

    it("should return valid sha256", () => {
        expect(HashAlgorithms.sha256(buffer).toString("hex")).toEqual(fixtures.sha256);
    });

    it("should return valid hash160", () => {
        expect(HashAlgorithms.hash160(buffer).toString("hex")).toEqual(fixtures.hash160);
    });

    it("should return valid hash256", () => {
        expect(HashAlgorithms.hash256(buffer).toString("hex")).toEqual(fixtures.hash256);
    });
});
