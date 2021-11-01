import { Container, Identifiers } from "../../../../../packages/core-kernel/src/ioc";

import { WatchConfiguration } from "../../../../../packages/core-kernel/src/bootstrap/app/watch-configuration";
import { Watcher } from "../../../../../packages/core-kernel/src/services/config/watcher";

const app = { resolve: jest.fn() };
const watcher = { boot: jest.fn() };

const container = new Container();
container.bind(Identifiers.Application).toConstantValue(app);

beforeEach(() => {
    app.resolve.mockReset();
    watcher.boot.mockReset();
});

describe("WatchConfiguration.bootstrap", () => {
    it("should boot Watcher", async () => {
        app.resolve.mockReturnValueOnce(watcher);

        const watchConfiguration = container.resolve(WatchConfiguration);
        await watchConfiguration.bootstrap();

        expect(app.resolve).toBeCalledWith(Watcher);
        expect(watcher.boot).toBeCalled();
    });
});
