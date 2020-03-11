import "jest-extended";

import { Container, Services } from "@packages/core-kernel/src";
import { Sandbox } from "@packages/core-test-framework/src";
import { Managers } from "@packages/crypto/src";

export interface Setup {
    sandbox: Sandbox;
}

export const setUp = async (): Promise<Setup> => {
    const sandbox = new Sandbox();

    await sandbox.boot();

    // TODO: get rid of the need for this, requires an instance based crypto package
    Managers.configManager.setConfig(
        sandbox.app.get<Services.Config.ConfigRepository>(Container.Identifiers.ConfigRepository).get("crypto"),
    );

    return {
        sandbox,
    };
};
