import { Container } from "@packages/core-cli";
import { Console } from "@packages/core-test-framework";
import { Error } from "@packages/core-cli/src/components";
import { white } from "kleur";

let cli;
let component;

beforeEach(() => {
    cli = new Console();

    // Bind from src instead of dist to collect coverage.
    cli.app.rebind(Container.Identifiers.Error).to(Error).inSingletonScope();
    component = cli.app.get(Container.Identifiers.Error);
});

describe("Error", () => {
    it("should render the component", () => {
        const spyLogger = jest.spyOn(cli.app.get(Container.Identifiers.Logger), "error");

        component.render("Hello World");

        expect(spyLogger).toHaveBeenCalledWith(white().bgRed(`[ERROR] Hello World`));
    });
});
