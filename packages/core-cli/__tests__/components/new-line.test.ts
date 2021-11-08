import { Container } from "@packages/core-cli";
import { Console } from "@packages/core-test-framework";
import { NewLine } from "@packages/core-cli/src/components";

let cli;
let component;

beforeEach(() => {
    cli = new Console();

    // Bind from src instead of dist to collect coverage.
    cli.app.rebind(Container.Identifiers.NewLine).to(NewLine).inSingletonScope();
    component = cli.app.get(Container.Identifiers.NewLine);
});

describe("NewLine", () => {
    it("should render the component", () => {
        const spyLogger = jest.spyOn(cli.app.get(Container.Identifiers.Logger), "log");

        component.render();

        expect(spyLogger).toHaveBeenCalledWith("\n");
    });
});
