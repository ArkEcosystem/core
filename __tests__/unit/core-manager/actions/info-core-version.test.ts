import "jest-extended";

import { Sandbox } from "@packages/core-test-framework";
import { Container } from "@packages/core-kernel";
import { Action } from "@packages/core-manager/src/actions/info-core-version";

let sandbox: Sandbox;
let action: Action;

beforeEach(() => {
    sandbox = new Sandbox();

    sandbox.app.bind(Container.Identifiers.ApplicationVersion).toConstantValue("@arkecosystem/core");

    action = sandbox.app.resolve(Action);
});

describe("Info:CoreVersion", () => {
    it("should have name", () => {
        expect(action.name).toEqual("info.coreVersion");
    });

    it("should return current and latest version", async () => {
        const promise = action.execute({});

        await expect(promise).toResolve();

        const result = await promise;

        await expect(result.currentVersion).toBe("@arkecosystem/core");
        await expect(result.latestVersion).toBeString();
    });

    it("should return current and latest version using channel", async () => {
        sandbox.app.rebind(Container.Identifiers.ApplicationVersion).toConstantValue("@arkecosystem/core-next");

        const promise = action.execute({});

        await expect(promise).toResolve();

        const result = await promise;

        await expect(result.currentVersion).toBe("@arkecosystem/core-next");
        await expect(result.latestVersion).toBeString();
    });
});
