import matcher from "../../../src/matchers/fields/address";
expect.extend(matcher);

describe(".toBeArkAddress", () => {
  test("passes when given a valid address", () => {
    expect("DARiJqhogp2Lu6bxufUFQQMuMyZbxjCydN").toBeArkAddress();
  });

  test("fails when not given a valid address", () => {
    expect("invalid-address").not.toBeArkAddress();
  });
});
