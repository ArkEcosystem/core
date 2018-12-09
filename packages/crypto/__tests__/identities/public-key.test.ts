import "jest-extended";

import { PublicKey } from "../../src/identities/public-key";
import { data, passphrase } from "./fixture.json";

describe("Identities - Public Key", () => {
  describe("fromPassphrase", () => {
    it("should be a function", () => {
      expect(PublicKey.fromPassphrase).toBeFunction();
    });

    it("should be OK", () => {
      expect(PublicKey.fromPassphrase(passphrase)).toBe(data.publicKey);
    });
  });

  describe("fromWIF", () => {
    it("should be a function", () => {
      expect(PublicKey.fromWIF).toBeFunction();
    });

    it("should be OK", () => {
      expect(PublicKey.fromWIF(data.wif)).toBe(data.publicKey);
    });
  });

  describe("validate", () => {
    it("should be a function", () => {
      expect(PublicKey.validate).toBeFunction();
    });

    it("should be OK", () => {
      expect(PublicKey.validate(data.publicKey)).toBeTrue();
    });
  });
});
