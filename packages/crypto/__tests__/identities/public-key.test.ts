import "jest-extended";
import testSubject from "../../src/identities/public-key";
import { data, passphrase } from "./fixture.json";

describe("Identities - Public Key", () => {
  describe("fromPassphrase", () => {
    it("should be a function", () => {
      expect(testSubject.fromPassphrase).toBeFunction();
    });

    it("should be OK", () => {
      expect(testSubject.fromPassphrase(passphrase)).toBe(data.publicKey);
    });
  });

  describe("fromWIF", () => {
    it("should be a function", () => {
      expect(testSubject.fromWIF).toBeFunction();
    });

    it("should be OK", () => {
      expect(testSubject.fromWIF(data.wif)).toBe(data.publicKey);
    });
  });

  describe("validate", () => {
    it("should be a function", () => {
      expect(testSubject.validate).toBeFunction();
    });

    it("should be OK", () => {
      expect(testSubject.validate(data.publicKey)).toBeTrue();
    });
  });
});
