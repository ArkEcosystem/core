import { Container } from "@arkecosystem/core-cli";
import { Console } from "@arkecosystem/core-test-framework";
import { AppHeader } from "@packages/core-cli/src/components";
import { red, white } from "kleur";
import os from "os";

let cli;
let component;

beforeEach(() => {
    cli = new Console();

    // Bind from src instead of dist to collect coverage.
    cli.app.rebind(Container.Identifiers.AppHeader).to(AppHeader).inSingletonScope();
    component = cli.app.get(Container.Identifiers.AppHeader);
});

describe("AppHeader", () => {
    it("should render the component", () => {
        expect(component.render()).toBe(
            `${red().bold(`${cli.pkg.description}`)} ${white().bold(
                `[${cli.pkg.version} | ${process.version} | ${os.platform()}@${os.arch()}]`,
            )}`,
        );
    });
});
