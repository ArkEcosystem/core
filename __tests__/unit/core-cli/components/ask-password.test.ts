import { Container } from "@arkecosystem/core-cli";
import { Console } from "@arkecosystem/core-test-framework";
import prompts from "prompts";

import { AskPassword } from "@packages/core-cli/src/components";

let cli;
let component;

beforeEach(() => {
    cli = new Console();

    // Bind from src instead of dist to collect coverage.
    cli.app
        .rebind(Container.Identifiers.AskPassword)
        .to(AskPassword)
        .inSingletonScope();
    component = cli.app.get(Container.Identifiers.AskPassword);
});

describe("AskPassword", () => {
    it("should render the component", async () => {
        prompts.inject(["password"]);

        await expect(component.render("Hello World")).resolves.toBe("password");
    });
});
