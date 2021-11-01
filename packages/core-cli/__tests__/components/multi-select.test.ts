import { Container } from "@arkecosystem/core-cli";
import { Console } from "@arkecosystem/core-test-framework";
import { MultiSelect } from "@packages/core-cli/src/components";
import prompts from "prompts";

let cli;
let component;

beforeEach(() => {
    cli = new Console();

    // Bind from src instead of dist to collect coverage.
    cli.app.rebind(Container.Identifiers.MultiSelect).to(MultiSelect).inSingletonScope();
    component = cli.app.get(Container.Identifiers.MultiSelect);
});

describe("MultiSelect", () => {
    it("should render the component", async () => {
        prompts.inject([["#ff0000", "#0000ff"]]);

        await expect(
            component.render("Pick Colors", [
                { title: "Red", value: "#ff0000" },
                { title: "Green", value: "#00ff00", disabled: true },
                { title: "Blue", value: "#0000ff", selected: true },
            ]),
        ).resolves.toEqual(["#ff0000", "#0000ff"]);
    });
});
