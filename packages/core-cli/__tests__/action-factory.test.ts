import { Console } from "@packages/core-test-framework";
import { ActionFactory, Container } from "@packages/core-cli/src";

let cli;
beforeEach(() => (cli = new Console()));

describe("ActionFactory", () => {
    it("should create an instance", () => {
        expect(cli.app.resolve(ActionFactory)).toBeInstanceOf(ActionFactory);
    });

    describe.each([
        ["abortErroredProcess", Container.Identifiers.AbortErroredProcess],
        ["abortMissingProcess", Container.Identifiers.AbortMissingProcess],
        ["abortRunningProcess", Container.Identifiers.AbortRunningProcess],
        ["abortStoppedProcess", Container.Identifiers.AbortStoppedProcess],
        ["abortUnknownProcess", Container.Identifiers.AbortUnknownProcess],
        ["daemonizeProcess", Container.Identifiers.DaemonizeProcess],
        ["restartProcess", Container.Identifiers.RestartProcess],
        ["restartRunningProcess", Container.Identifiers.RestartRunningProcess],
        ["restartRunningProcessWithPrompt", Container.Identifiers.RestartRunningProcessWithPrompt],
    ])("%s", (method, binding) => {
        it("should call be called", async () => {
            const spy = jest.spyOn(cli.app.get(binding), "execute").mockImplementation();

            await cli.app.resolve(ActionFactory)[method]();

            expect(spy).toHaveBeenCalled();
        });
    });
});
