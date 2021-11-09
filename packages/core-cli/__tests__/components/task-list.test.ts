import { Container } from "@packages/core-cli";
import { Console } from "@packages/core-test-framework";
import { TaskList } from "@packages/core-cli/src/components";

let cli;
let component;

beforeEach(() => {
    cli = new Console();

    // Bind from src instead of dist to collect coverage.
    cli.app.rebind(Container.Identifiers.TaskList).to(TaskList).inSingletonScope();
    component = cli.app.get(Container.Identifiers.TaskList);
});

describe("TaskList", () => {
    it("should render the component", async () => {
        const fakeTask = jest.fn();

        await component.render([
            {
                title: "description",
                task: fakeTask,
            },
        ]);

        expect(fakeTask).toHaveBeenCalled();
    });
});
