import "jest-extended";
import ark from "../src/client";

describe("Client", () => {
  it("should be instantiated", () => {
    expect(ark).toBeObject();
  });
});
