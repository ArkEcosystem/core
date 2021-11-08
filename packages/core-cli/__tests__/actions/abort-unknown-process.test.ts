import { Container } from "@packages/core-cli";
import { Console } from "@packages/core-test-framework";
import { AbortUnknownProcess } from "@packages/core-cli/src/actions";

const processName: string = "ark-core";

let cli;
let processManager;
let action;

beforeEach(() => {
    cli = new Console();
    processManager = cli.app.get(Container.Identifiers.ProcessManager);

    // Bind from src instead of dist to collect coverage.
    cli.app.rebind(Container.Identifiers.AbortUnknownProcess).to(AbortUnknownProcess).inSingletonScope();
    action = cli.app.get(Container.Identifiers.AbortUnknownProcess);
});

describe("AbortUnknownProcess", () => {
    it("should not throw if the process does exist", () => {
        const spy = jest.spyOn(processManager, "isUnknown").mockReturnValue(false);

        expect(action.execute(processName)).toBeUndefined();
        expect(spy).toHaveBeenCalled();

        spy.mockClear();
    });

    it("should throw if the process does not exist", () => {
        const spy = jest.spyOn(processManager, "isUnknown").mockReturnValue(true);

        expect(() => action.execute(processName)).toThrow(`The "${processName}" process has entered an unknown state.`);
        expect(spy).toHaveBeenCalled();

        spy.mockClear();
    });
});
