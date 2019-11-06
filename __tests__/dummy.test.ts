import "jest-extended";

import { Sandbox } from "@arkecosystem/core-test-framework";

let sandbox: Sandbox = new Sandbox();

beforeAll(async () => await sandbox.setUp());
afterAll(async () => await sandbox.tearDown());

describe("Application", () => {
    it("should bootstrap the application", async () => {
        console.log(sandbox.app);
    });
});
