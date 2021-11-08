import { Container } from "@packages/core-cli";
import { Console } from "@packages/core-test-framework";
import { Log } from "@packages/core-cli/src/components";

let cli;
let component;

beforeEach(() => {
    cli = new Console();

    // Bind from src instead of dist to collect coverage.
    cli.app.rebind(Container.Identifiers.Log).to(Log).inSingletonScope();
    component = cli.app.get(Container.Identifiers.Log);
});

describe("Log", () => {
    it("should render the component", () => {
        const spyLogger = jest.spyOn(cli.app.get(Container.Identifiers.Logger), "log");

        component.render("Hello World");

        expect(spyLogger).toHaveBeenCalledWith("Hello World");
    });
});
