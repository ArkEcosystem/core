import { Container } from "@arkecosystem/core-cli";
import { Console } from "@arkecosystem/core-test-framework";
import { Box } from "@packages/core-cli/src/components";

let cli;
let component;

beforeEach(() => {
    cli = new Console();

    // Bind from src instead of dist to collect coverage.
    cli.app.rebind(Container.Identifiers.Box).to(Box).inSingletonScope();
    component = cli.app.get(Container.Identifiers.Box);
});

describe("Box", () => {
    it("should render the component", () => {
        const spyLogger = jest.spyOn(cli.app.get(Container.Identifiers.Logger), "log");

        component.render("Hello World");

        expect(spyLogger).toHaveBeenCalled();
    });
});
