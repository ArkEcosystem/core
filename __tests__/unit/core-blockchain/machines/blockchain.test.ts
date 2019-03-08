import "../../../utils";

import { blockchainMachine } from "../../../../packages/core-blockchain/src/machines/blockchain";

describe("Blockchain machine", () => {
    it("should use `blockchain` as the key", () => {
        expect(blockchainMachine).toHaveProperty("key", "blockchain");
    });

    it("should start with the `uninitialised` state", () => {
        expect(blockchainMachine.initialState).toHaveProperty("value", "uninitialised");
    });

    describe("state `uninitialised`", () => {
        it("should transition to `init` on `START`", () => {
            expect(blockchainMachine).toTransition({
                from: "uninitialised",
                on: "START",
                to: "init",
            });
        });
    });

    describe("state `init`", () => {
        it("should execute the `init` action when is entered", () => {
            expect(blockchainMachine).toExecuteOnEntry({ state: "init", actions: ["init"] });
        });

        it("should transition to `idle` on `NETWORKSTART`", () => {
            expect(blockchainMachine).toTransition({
                from: "init",
                on: "NETWORKSTART",
                to: "idle",
            });
        });

        it("should transition to `syncWithNetwork` on `STARTED`", () => {
            expect(blockchainMachine).toTransition({
                from: "init",
                on: "STARTED",
                to: "syncWithNetwork",
            });
        });

        it("should transition to `exit` on `FAILURE`", () => {
            expect(blockchainMachine).toTransition({ from: "init", on: "FAILURE", to: "exit" });
        });
    });

    describe("state `syncWithNetwork`", () => {
        it("should transition to `idle` on `TEST`", () => {
            expect(blockchainMachine).toTransition({
                from: "syncWithNetwork",
                on: "TEST",
                to: "idle",
            });
        });

        it("should transition to `idle` on `SYNCFINISHED`", () => {
            expect(blockchainMachine).toTransition({
                from: "syncWithNetwork",
                on: "SYNCFINISHED",
                to: "idle",
            });
        });

        it("should transition to `fork` on `FORK`", () => {
            expect(blockchainMachine).toTransition({
                from: "syncWithNetwork",
                on: "FORK",
                to: "fork",
            });
        });
    });

    describe("state `idle`", () => {
        it("should execute the `checkLater` and `blockchainReady` actions when is entered", () => {
            expect(blockchainMachine).toExecuteOnEntry({
                state: "idle",
                actions: ["checkLater", "blockchainReady"],
            });
        });

        it("should transition to `syncWithNetwork` on `WAKEUP`", () => {
            expect(blockchainMachine).toTransition({
                from: "idle",
                on: "WAKEUP",
                to: "syncWithNetwork",
            });
        });

        it("should transition to `newBlock` on `NEWBLOCK`", () => {
            expect(blockchainMachine).toTransition({
                from: "idle",
                on: "NEWBLOCK",
                to: "newBlock",
            });
        });

        it("should transition to `stopped` on `STOP`", () => {
            expect(blockchainMachine).toTransition({ from: "idle", on: "STOP", to: "stopped" });
        });
    });

    describe("state `newBlock`", () => {
        it("should transition to `idle` on `PROCESSFINISHED`", () => {
            expect(blockchainMachine).toTransition({
                from: "newBlock",
                on: "PROCESSFINISHED",
                to: "idle",
            });
        });

        it("should transition to `fork` on `FORK`", () => {
            expect(blockchainMachine).toTransition({
                from: "newBlock",
                on: "FORK",
                to: "fork",
            });
        });

        it("should transition to `stopped` on `STOP`", () => {
            expect(blockchainMachine).toTransition({
                from: "newBlock",
                on: "STOP",
                to: "stopped",
            });
        });
    });

    describe("state `fork`", () => {
        it("should execute the `processBlock` action when is entered", () => {
            expect(blockchainMachine).toExecuteOnEntry({
                state: "fork",
                actions: ["startForkRecovery"],
            });
        });

        it("should transition to `idle` on `SUCCESS`", () => {
            expect(blockchainMachine).toTransition({
                from: "fork",
                on: "SUCCESS",
                to: "syncWithNetwork",
            });
        });

        it("should transition to `fork` on `FAILURE`", () => {
            expect(blockchainMachine).toTransition({ from: "fork", on: "FAILURE", to: "exit" });
        });
    });

    describe("state `stopped`", () => {
        it("should execute the `stopped` action when is entered", () => {
            expect(blockchainMachine).toExecuteOnEntry({
                state: "stopped",
                actions: ["stopped"],
            });
        });
    });

    describe("state `exit`", () => {
        it("should execute the `exitApp` action when is entered", () => {
            expect(blockchainMachine).toExecuteOnEntry({ state: "exit", actions: ["exitApp"] });
        });
    });
});
