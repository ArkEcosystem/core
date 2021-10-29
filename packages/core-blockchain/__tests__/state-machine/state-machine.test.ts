import { Container } from "@arkecosystem/core-kernel";
import { blockchainMachine } from "@packages/core-blockchain/src/state-machine/machine";
import { StateMachine } from "@packages/core-blockchain/src/state-machine/state-machine";
import { Sandbox } from "@packages/core-test-framework";
import delay from "delay";

let sandbox: Sandbox;

describe("State machine", () => {
    let logService;
    let stateStore;

    beforeEach(() => {
        logService = { warning: jest.fn(), info: jest.fn(), error: jest.fn(), debug: jest.fn() };
        stateStore = {
            getBlockchain: jest.fn().mockReturnValue({ value: undefined }),
            setBlockchain: jest.fn(),
        };

        sandbox = new Sandbox();
        sandbox.app.bind(Container.Identifiers.LogService).toConstantValue(logService);
        sandbox.app.bind(Container.Identifiers.StateStore).toConstantValue(stateStore);
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    describe("transition", () => {
        it("should use blockchainMachine.transition to get next state and return it", () => {
            const stateMachine = sandbox.app.resolve<StateMachine>(StateMachine);

            const mockNextState = { state: "next", actions: [] };
            jest.spyOn(blockchainMachine, "transition").mockReturnValueOnce(mockNextState);
            const nextState = stateMachine.transition("EVENT");

            expect(nextState).toEqual(mockNextState);
        });

        describe("when there are actions associated to the next state", () => {
            it("should log an error if the action cannot be resolved", () => {
                const stateMachine = sandbox.app.resolve<StateMachine>(StateMachine);

                const nextAction = {
                    type: "dothis",
                };
                const mockNextState = { state: "next", actions: [nextAction] };
                jest.spyOn(blockchainMachine, "transition").mockReturnValueOnce(mockNextState);
                const nextState = stateMachine.transition("EVENT");

                expect(nextState).toEqual(mockNextState);
                expect(logService.error).toHaveBeenCalledTimes(1);
                expect(logService.error).toHaveBeenLastCalledWith(`No action '${nextAction.type}' found`);
            });

            it("should execute the action", async () => {
                const stateMachine = sandbox.app.resolve<StateMachine>(StateMachine);

                const nextAction = {
                    type: "dothis",
                };
                const mockNextState = { state: "next", actions: [nextAction] };
                jest.spyOn(blockchainMachine, "transition").mockReturnValueOnce(mockNextState);
                const handle = jest.fn();
                sandbox.app.resolve = jest.fn().mockReturnValue({ handle });

                const nextState = stateMachine.transition("EVENT");
                await delay(100); // just to give time for setImmediate to launch

                expect(nextState).toEqual(mockNextState);
                expect(handle).toHaveBeenCalledTimes(1);
            });
        });
    });

    describe("getState", () => {
        it("should return state if defined", () => {
            stateStore.getBlockchain = jest.fn().mockReturnValue({
                value: "dummy_state",
            });
            const stateMachine = sandbox.app.resolve<StateMachine>(StateMachine);

            expect(stateMachine.getState()).toEqual("dummy_state");
        });

        it("should return undefined if state is not set", () => {
            stateStore.getBlockchain = jest.fn().mockReturnValue({});
            const stateMachine = sandbox.app.resolve<StateMachine>(StateMachine);

            expect(stateMachine.getState()).toEqual(undefined);
        });
    });
});
