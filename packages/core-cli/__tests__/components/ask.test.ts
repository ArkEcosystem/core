import { Container } from "@packages/core-cli";
import { Console } from "@packages/core-test-framework";
import { Ask } from "@packages/core-cli/src/components";
import prompts from "prompts";

let cli;
let component;

beforeEach(() => {
    cli = new Console();

    // Bind from src instead of dist to collect coverage.
    cli.app.rebind(Container.Identifiers.Ask).to(Ask).inSingletonScope();
    component = cli.app.get(Container.Identifiers.Ask);
});

describe("Ask", () => {
    it("should render the component", async () => {
        prompts.inject(["john doe"]);

        await expect(component.render("Hello World")).resolves.toBe("john doe");
    });
});
