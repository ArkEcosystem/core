import { Console } from "@arkecosystem/core-test-framework";
import { ComponentFactory, Container } from "@packages/core-cli/src";

let cli;
beforeEach(() => (cli = new Console()));

describe("ComponentFactory", () => {
    it("should create an instance", () => {
        expect(cli.app.resolve(ComponentFactory)).toBeInstanceOf(ComponentFactory);
    });

    describe.each([
        ["appHeader", Container.Identifiers.AppHeader],
        ["ask", Container.Identifiers.Ask],
        ["askDate", Container.Identifiers.AskDate],
        ["askHidden", Container.Identifiers.AskHidden],
        ["askNumber", Container.Identifiers.AskNumber],
        ["askPassword", Container.Identifiers.AskPassword],
        ["autoComplete", Container.Identifiers.AutoComplete],
        ["box", Container.Identifiers.Box],
        ["clear", Container.Identifiers.Clear],
        ["confirm", Container.Identifiers.Confirm],
        ["error", Container.Identifiers.Error],
        ["fatal", Container.Identifiers.Fatal],
        ["info", Container.Identifiers.Info],
        ["listing", Container.Identifiers.Listing],
        ["log", Container.Identifiers.Log],
        ["multiSelect", Container.Identifiers.MultiSelect],
        ["newLine", Container.Identifiers.NewLine],
        ["prompt", Container.Identifiers.Prompt],
        ["select", Container.Identifiers.Select],
        ["spinner", Container.Identifiers.Spinner],
        ["success", Container.Identifiers.Success],
        ["table", Container.Identifiers.Table],
        ["taskList", Container.Identifiers.TaskList],
        ["title", Container.Identifiers.Title],
        ["toggle", Container.Identifiers.Toggle],
        ["warning", Container.Identifiers.Warning],
    ])("%s", (method, binding) => {
        it("should call be called", async () => {
            const spy = jest.spyOn(cli.app.get(binding), "render").mockImplementation();

            await cli.app.resolve(ComponentFactory)[method]();

            expect(spy).toHaveBeenCalled();
        });
    });
});
