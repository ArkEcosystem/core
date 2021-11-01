import { Container } from "@arkecosystem/core-cli";
import { Console } from "@arkecosystem/core-test-framework";
import { Select } from "@packages/core-cli/src/components";
import prompts from "prompts";

let cli;
let component;

beforeEach(() => {
    cli = new Console();

    // Bind from src instead of dist to collect coverage.
    cli.app.rebind(Container.Identifiers.Select).to(Select).inSingletonScope();
    component = cli.app.get(Container.Identifiers.Select);
});

describe("Select", () => {
    it("should render the component", async () => {
        prompts.inject(["#0000ff"]);

        await expect(
            component.render("Pick a color", [
                { title: "Red", description: "This option has a description", value: "#ff0000" },
                { title: "Green", value: "#00ff00", disabled: true },
                { title: "Blue", value: "#0000ff" },
            ]),
        ).resolves.toBe("#0000ff");
    });
});
