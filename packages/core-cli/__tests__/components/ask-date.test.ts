import { Container } from "@packages/core-cli";
import { Console } from "@packages/core-test-framework";
import { AskDate } from "@packages/core-cli/src/components";
import prompts from "prompts";

let cli;
let component;

beforeEach(() => {
    cli = new Console();

    // Bind from src instead of dist to collect coverage.
    cli.app.rebind(Container.Identifiers.AskDate).to(AskDate).inSingletonScope();
    component = cli.app.get(Container.Identifiers.AskDate);
});

describe("AskDate", () => {
    it("should render the component", async () => {
        prompts.inject(["2020-01-01"]);

        await expect(component.render("Hello World")).resolves.toBe("2020-01-01");
    });
});
