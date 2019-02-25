import "@arkecosystem/core-test-utils/";

import { blockchainMachine } from "../../../../../packages/core-blockchain/src/machines/blockchain";

describe("Blockchain machine > Fork", () => {
    it("should start with the `analysing` state", () => {
        expect(blockchainMachine.states.fork).toHaveProperty("initial", "analysing");
    });

    describe("state `analysing`", () => {
        it("should execute the `analyseFork` action when is entered", () => {
            expect(blockchainMachine).toExecuteOnEntry({
                state: "fork.analysing",
                actions: ["analyseFork"],
            });
        });

        it("should transition to `revertBlocks` on `REBUILD`", () => {
            expect(blockchainMachine).toTransition({
                from: "fork.analysing",
                on: "REBUILD",
                to: "fork.revertBlocks",
            });
        });

        it("should transition to `exit` on `NOFORK`", () => {
            expect(blockchainMachine).toTransition({
                from: "fork.analysing",
                on: "NOFORK",
                to: "fork.exit",
            });
        });
    });

    describe("state `network`", () => {
        it("should execute the `checkNetwork` action when is entered", () => {
            expect(blockchainMachine).toExecuteOnEntry({
                state: "fork.network",
                actions: ["checkNetwork"],
            });
        });
    });

    describe("state `exit`", () => {
        it("should execute the `forkRecovered` action when is entered", () => {
            expect(blockchainMachine).toExecuteOnEntry({
                state: "fork.exit",
                actions: ["forkRecovered"],
            });
        });
    });
});
