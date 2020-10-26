import { Container } from "@arkecosystem/core-cli";
import { Console } from "@arkecosystem/core-test-framework";
import { Fatal } from "@packages/core-cli/src/components";

import { white } from "kleur";

let cli;
let component;

beforeEach(() => {
    cli = new Console();

    // Bind from src instead of dist to collect coverage.
    cli.app.rebind(Container.Identifiers.Fatal).to(Fatal).inSingletonScope();
    component = cli.app.get(Container.Identifiers.Fatal);
});

describe("Fatal", () => {
    it("should render the component", () => {
        const spyLogger = jest.spyOn(cli.app.get(Container.Identifiers.Logger), "error");
        // @ts-ignore
        const spyExit = jest.spyOn(process, "exit").mockImplementation(() => {});

        component.render("Error message");

        expect(spyLogger).toHaveBeenCalledWith(white().bgRed(`[ERROR] Error message`));
        expect(spyExit).toHaveBeenCalledWith(1);
    });
});
