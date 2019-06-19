import { mountServer } from "../../../packages/core-http-utils/src/server/mount";
import "./mocks/core-container";

describe("mount", () => {
    it("should start server", async () => {
        const start = jest.fn();
        mountServer("Some String", { start });
        expect(start).toBeCalled();
    });
});
