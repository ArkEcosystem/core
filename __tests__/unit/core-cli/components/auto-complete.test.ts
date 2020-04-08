import { Container } from "@arkecosystem/core-cli";
import { Console } from "@arkecosystem/core-test-framework";
import { AutoComplete } from "@packages/core-cli/src/components";
import prompts from "prompts";

let cli;
let component;

beforeEach(() => {
    cli = new Console();

    // Bind from src instead of dist to collect coverage.
    cli.app.rebind(Container.Identifiers.AutoComplete).to(AutoComplete).inSingletonScope();
    component = cli.app.get(Container.Identifiers.AutoComplete);
});

describe("AutoComplete", () => {
    it("should render the component", async () => {
        prompts.inject(["Clooney"]);

        await expect(
            component.render("Pick your favorite actor", [
                { title: "Cage" },
                { title: "Clooney" },
                { title: "Gyllenhaal" },
                { title: "Gibson" },
                { title: "Grant" },
            ]),
        ).resolves.toBe("Clooney");
    });
});
