import { Container } from "@arkecosystem/core-cli";
import { Console } from "@arkecosystem/core-test-framework";
import { Title } from "@packages/core-cli/src/components";
import { yellow } from "kleur";

let cli;
let component;

beforeEach(() => {
    cli = new Console();

    // Bind from src instead of dist to collect coverage.
    cli.app.rebind(Container.Identifiers.Title).to(Title).inSingletonScope();
    component = cli.app.get(Container.Identifiers.Title);
});

describe("Title", () => {
    it("should render the component", () => {
        const spyLogger = jest.spyOn(cli.app.get(Container.Identifiers.Logger), "log");

        component.render("Hello World");

        expect(spyLogger).toHaveBeenCalledWith(yellow("Hello World"));
        expect(spyLogger).toHaveBeenCalledWith(yellow("==========="));
    });
});
