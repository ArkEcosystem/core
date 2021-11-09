import { Container } from "@packages/core-cli";
import { Console } from "@packages/core-test-framework";
import { Warning } from "@packages/core-cli/src/components";
import { white } from "kleur";

let cli;
let component;

beforeEach(() => {
    cli = new Console();

    // Bind from src instead of dist to collect coverage.
    cli.app.rebind(Container.Identifiers.Warning).to(Warning).inSingletonScope();
    component = cli.app.get(Container.Identifiers.Warning);
});

describe("Warning", () => {
    it("should render the component", () => {
        const spyLogger = jest.spyOn(cli.app.get(Container.Identifiers.Logger), "warning");

        component.render("Hello World");

        expect(spyLogger).toHaveBeenCalledWith(white().bgYellow(`[WARNING] Hello World`));
    });
});
