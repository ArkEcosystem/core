import "jest-extended";

import { Sandbox } from "@packages/core-test-framework";
import { Container } from "@packages/core-kernel";
import { Action } from "@packages/core-manager/src/actions/info-core-version";

let sandbox: Sandbox;
let action: Action;

beforeEach(() => {
    sandbox = new Sandbox();

    sandbox.app.bind(Container.Identifiers.ApplicationVersion).toConstantValue("dummyVersion");

    action = sandbox.app.resolve(Action);
});

describe("Info:CoreVersion", () => {
    it("should have name", () => {
        expect(action.name).toEqual("info.coreVersion");
    })

    it("should return current and latest version", async () => {
        let promise = action.execute({});

        await expect(promise).toResolve();

        let result = await promise;

        await expect(result.currentVersion).toBe("dummyVersion");
        await expect(result.latestVersion).toBeString();
    });
});
