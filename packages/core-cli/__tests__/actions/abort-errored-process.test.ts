import { Container } from "@arkecosystem/core-cli";
import { Console } from "@arkecosystem/core-test-framework";
import { AbortErroredProcess } from "@packages/core-cli/src/actions";

const processName: string = "ark-core";

let cli;
let processManager;
let action;

beforeEach(() => {
    cli = new Console();
    processManager = cli.app.get(Container.Identifiers.ProcessManager);

    // Bind from src instead of dist to collect coverage.
    cli.app.rebind(Container.Identifiers.AbortErroredProcess).to(AbortErroredProcess).inSingletonScope();
    action = cli.app.get(Container.Identifiers.AbortErroredProcess);
});

describe("AbortErroredProcess", () => {
    it("should not throw if the process does exist", () => {
        const spy = jest.spyOn(processManager, "isErrored").mockReturnValue(false);

        expect(action.execute(processName)).toBeUndefined();
        expect(spy).toHaveBeenCalled();

        spy.mockClear();
    });

    it("should throw if the process does not exist", () => {
        const spy = jest.spyOn(processManager, "isErrored").mockReturnValue(true);

        expect(() => action.execute(processName)).toThrow(`The "${processName}" process has errored.`);
        expect(spy).toHaveBeenCalled();

        spy.mockClear();
    });
});
