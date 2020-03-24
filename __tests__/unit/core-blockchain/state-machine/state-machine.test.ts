import delay from "delay";
import { Container } from "@arkecosystem/core-kernel";
import { StateMachine } from "../../../../packages/core-blockchain/src/state-machine/state-machine";
import { blockchainMachine } from "../../../../packages/core-blockchain/src/state-machine/machine";


describe("State machine", () => {
    const container = new Container.Container();

    const logService = { warning: jest.fn(), info: jest.fn(), error: jest.fn(), debug: jest.fn() };
    const stateStore = { blockchain: { value: undefined } };

    const application = { resolve: jest.fn() };

    beforeAll(() => {
        container.unbindAll();
        container.bind(Container.Identifiers.Application).toConstantValue(application);
        container.bind(Container.Identifiers.LogService).toConstantValue(logService);
        container.bind(Container.Identifiers.StateStore).toConstantValue(stateStore);   
    });

    beforeEach(() => {
        jest.resetAllMocks();
    });

    describe("transition", () => {
        it("should use blockchainMachine.transition to get next state and return it",() => {
            const stateMachine = container.resolve<StateMachine>(StateMachine);

            const mockNextState = { state: "next", actions: [] };
            jest.spyOn(blockchainMachine, "transition").mockReturnValueOnce(mockNextState);
            const nextState = stateMachine.transition("EVENT");

            expect(nextState).toEqual(mockNextState);
        })

        describe("when there are actions associated to the next state", () => {
            it("should log an error if the action cannot be resolved", () => {
                const stateMachine = container.resolve<StateMachine>(StateMachine);
    
                const nextAction = "dothis";
                const mockNextState = { state: "next", actions: [ nextAction ] };
                jest.spyOn(blockchainMachine, "transition").mockReturnValueOnce(mockNextState);
                const nextState = stateMachine.transition("EVENT");
    
                expect(nextState).toEqual(mockNextState);
                expect(logService.error).toHaveBeenCalledTimes(1);
                expect(logService.error).toHaveBeenLastCalledWith(`No action '${nextAction}' found`);  
            });

            it("should execute the action", async () => {
                const stateMachine = container.resolve<StateMachine>(StateMachine);
    
                const nextAction = "dothis";
                const mockNextState = { state: "next", actions: [ nextAction ] };
                jest.spyOn(blockchainMachine, "transition").mockReturnValueOnce(mockNextState);
                const handle = jest.fn();
                application.resolve = jest.fn().mockReturnValue({ handle });
                
                const nextState = stateMachine.transition("EVENT");
                await delay(100); // just to give time for setImmediate to launch

                expect(nextState).toEqual(mockNextState);
                expect(handle).toHaveBeenCalledTimes(1);
            });
        })
        
    })
})