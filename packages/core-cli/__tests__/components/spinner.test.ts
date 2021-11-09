import { Container } from "@packages/core-cli";
import { Console } from "@packages/core-test-framework";
import { Spinner } from "@packages/core-cli/src/components";

let cli;
let component;

beforeEach(() => {
    cli = new Console();

    // Bind from src instead of dist to collect coverage.
    cli.app.rebind(Container.Identifiers.Spinner).to(Spinner).inSingletonScope();
    component = cli.app.get(Container.Identifiers.Spinner);
});

describe("Spinner", () => {
    it("should render the component", () => {
        expect(component.render("Hello World")).toBeObject();
    });
});
