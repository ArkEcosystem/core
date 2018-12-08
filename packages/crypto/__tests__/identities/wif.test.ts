import "jest-extended";
import testSubject from "../../src/identities/wif";
import { data, passphrase } from "./fixture.json";

describe("Identities - WIF", () => {
  describe("fromPassphrase", () => {
    it("should be a function", () => {
      expect(testSubject.fromPassphrase).toBeFunction();
    });

    it("should be OK", () => {
      expect(testSubject.fromPassphrase(passphrase)).toBe(data.wif);
    });
  });
});
