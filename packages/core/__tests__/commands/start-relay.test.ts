import "jest-extended";
import delay from "delay";
import { startRelay } from "../../src/commands";
import { opts, version } from "../__support__/app";

jest.setTimeout(60000);

describe("Commands - Start Relay", () => {
  it("should be a function", () => {
    expect(startRelay).toBeFunction();
  });

  it("should be OK", async () => {
    const app = await startRelay(opts, version);

    expect(app.isReady).toBeTrue();

    await app.tearDown();

    expect(app.isReady).toBeFalse();

    await delay(3000);
  });
});
