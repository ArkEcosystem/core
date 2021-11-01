import { Container } from "@arkecosystem/core-cli";
import { Console } from "@arkecosystem/core-test-framework";
import { Toggle } from "@packages/core-cli/src/components";
import prompts from "prompts";

let cli;
let component;

beforeEach(() => {
    cli = new Console();

    // Bind from src instead of dist to collect coverage.
    cli.app.rebind(Container.Identifiers.Toggle).to(Toggle).inSingletonScope();
    component = cli.app.get(Container.Identifiers.Toggle);
});

describe("Toggle", () => {
    it("should render the component", async () => {
        prompts.inject(["yes"]);

        await expect(component.render("Hello World")).resolves.toBe("yes");
    });
});
