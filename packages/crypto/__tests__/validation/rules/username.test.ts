import "jest-extended";
import rule from "../../../src/validation/rules/username";

describe("Username Rule", () => {
  it("should be a function", () => {
    expect(rule).toBeFunction();
  });

  it("should be true", () => {
    expect(rule("boldninja").passes).toBeTrue();
  });

  it("should be false", () => {
    expect(rule("bold ninja").passes).toBeFalse();
  });
});
