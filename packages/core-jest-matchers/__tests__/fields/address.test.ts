import "../../src/fields/address";

describe(".toBeAddress", () => {
    test("passes when given a valid address", () => {
        expect("DARiJqhogp2Lu6bxufUFQQMuMyZbxjCydN").toBeAddress();
    });

    test("fails when not given a valid address", () => {
        expect("invalid-address").not.toBeAddress();
    });
});
