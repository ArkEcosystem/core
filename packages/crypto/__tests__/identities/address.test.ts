import "jest-extended";

import { Address } from "../../src/identities/address";
import { Keys } from "../../src/identities/keys";
import { data, passphrase } from "./fixture.json";

describe("Identities - Address", () => {
  describe("fromPassphrase", () => {
    it("should be a function", () => {
      expect(Address.fromPassphrase).toBeFunction();
    });

    it("should be OK", () => {
      expect(Address.fromPassphrase(passphrase)).toBe(data.address);
    });
  });

  describe("fromPublicKey", () => {
    it("should be a function", () => {
      expect(Address.fromPublicKey).toBeFunction();
    });

    it("should be OK", () => {
      expect(Address.fromPublicKey(data.publicKey)).toBe(data.address);
    });
  });

  describe("fromPrivateKey", () => {
    it("should be a function", () => {
      expect(Address.fromPrivateKey).toBeFunction();
    });

    it("should be OK", () => {
      expect(Address.fromPrivateKey(Keys.fromPassphrase(passphrase))).toBe(
        data.address
      );
    });
  });

  describe("validate", () => {
    it("should be a function", () => {
      expect(Address.validate).toBeFunction();
    });

    it("should be OK", () => {
      expect(Address.validate(data.address)).toBeTrue();
    });
  });
});
