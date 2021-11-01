import { Container } from "@arkecosystem/core-cli";
import { Console } from "@arkecosystem/core-test-framework";
import { AskHidden } from "@packages/core-cli/src/components";
import prompts from "prompts";

let cli;
let component;

beforeEach(() => {
    cli = new Console();

    // Bind from src instead of dist to collect coverage.
    cli.app.rebind(Container.Identifiers.AskHidden).to(AskHidden).inSingletonScope();
    component = cli.app.get(Container.Identifiers.AskHidden);
});

describe("AskHidden", () => {
    it("should render the component", async () => {
        prompts.inject(["hidden"]);

        await expect(component.render("Hello World")).resolves.toBe("hidden");
    });
});
