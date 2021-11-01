import "@packages/core-test-framework/src/matchers/blockchain/transition";
import { Machine } from "xstate";
import { machineConfig } from "./__fixtures__/assets";

let testMachine: any;

beforeEach(() => {
    testMachine = Machine(machineConfig);
});

describe("Transition", () => {
    describe("toTransition", () => {
        it("should be valid transition", async () => {
            expect(testMachine).toTransition({
                from: "uninitialised",
                on: "STOP",
                to: "stopped",
            });
        });

        it("should be valid transition on nested state", async () => {
            expect(testMachine).toTransition({
                from: "nestedState.firstNestedState",
                on: "LEAVE",
                to: "nestedState.secondNestedState",
            });
        });

        it("should be invalid transition", async () => {
            expect(testMachine).not.toTransition({
                from: "uninitialised",
                on: "STOP",
                to: "invalid_state",
            });
        });
    });
});
