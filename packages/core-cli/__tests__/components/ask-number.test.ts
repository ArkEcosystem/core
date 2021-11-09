import { Container } from "@packages/core-cli";
import { Console } from "@packages/core-test-framework";
import { AskNumber } from "@packages/core-cli/src/components";
import prompts from "prompts";

let cli;
let component;

beforeEach(() => {
    cli = new Console();

    // Bind from src instead of dist to collect coverage.
    cli.app.rebind(Container.Identifiers.AskNumber).to(AskNumber).inSingletonScope();
    component = cli.app.get(Container.Identifiers.AskNumber);
});

describe("AskNumber", () => {
    it("should render the component", async () => {
        prompts.inject([123]);

        await expect(component.render("Hello World")).resolves.toBe(123);
    });
});
