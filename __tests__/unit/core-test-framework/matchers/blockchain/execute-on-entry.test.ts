import "@packages/core-test-framework/src/matchers/blockchain/execute-on-entry";
import { Machine } from "xstate";
import { machineConfig } from "./__fixtures__/assets";

let machine: any;

beforeEach(() => {
    machine = Machine(machineConfig);
});

describe("Execute on entry", () => {
    describe("toExecuteOnEntry", () => {
        it("should have valid actions on state", async () => {
            expect(machine).toExecuteOnEntry({
                state: "stopped",
                actions: ["stopped"],
            });
        });

        it("should not have invalid actions on state", async () => {
            expect(machine).not.toExecuteOnEntry({
                state: "stopped",
                actions: ["invalid_action", "stopped"],
            });
        });

        it("should have valid actions on nested state", async () => {
            expect(machine).toExecuteOnEntry({
                state: "nestedState.firstNestedState",
                actions: ["runFirstNestedState"],
            });
        });

        it("should not have invalid actions on nested state", async () => {
            expect(machine).not.toExecuteOnEntry({
                state: "nestedState.firstNestedState",
                actions: ["runSecondNestedState"],
            });
        });
    });
});
