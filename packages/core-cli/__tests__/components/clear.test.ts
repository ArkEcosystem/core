import { Container } from "@packages/core-cli";
import { Console } from "@packages/core-test-framework";
import { Clear } from "@packages/core-cli/src/components";

let cli;
let component;

beforeEach(() => {
    cli = new Console();

    // Bind from src instead of dist to collect coverage.
    cli.app.rebind(Container.Identifiers.Clear).to(Clear).inSingletonScope();
    component = cli.app.get(Container.Identifiers.Clear);
});

describe("Clear", () => {
    it("should render the component", () => {
        const spyWrite = jest.spyOn(process.stdout, "write");

        component.render();

        expect(spyWrite).toHaveBeenCalledWith("\x1b[2J");
        expect(spyWrite).toHaveBeenCalledWith("\x1b[0f");
    });
});
