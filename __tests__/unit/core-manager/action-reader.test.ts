import "jest-extended";

import { Container } from "@arkecosystem/core-kernel";
import { ActionReader } from "@packages/core-manager";
import { Identifiers } from "@packages/core-manager/src/ioc";
import { Sandbox } from "@packages/core-test-framework";

let sandbox: Sandbox;
let actionReader: ActionReader;

beforeEach(() => {
    sandbox = new Sandbox();

    sandbox.app.bind(Identifiers.ActionReader).to(ActionReader).inSingletonScope();
    sandbox.app.bind(Container.Identifiers.PluginConfiguration).toConstantValue({});
    sandbox.app.bind(Container.Identifiers.FilesystemService).toConstantValue({});

    actionReader = sandbox.app.get<ActionReader>(Identifiers.ActionReader);
});

describe("ActionReader", () => {
    it("should discover actions", async () => {
        const actions = actionReader.discoverActions();

        expect(actions).toBeArray();
        expect(actions.length).toBeGreaterThanOrEqual(1);
    });
});
