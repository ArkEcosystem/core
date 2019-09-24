import "jest-extended";

import { Application } from "@packages/core-kernel/src/application";
import { Container, interfaces, Identifiers } from "@packages/core-kernel/src/ioc";
import { ServiceProvider } from "@packages/core-kernel/src/services/log";
import { PinoLogger } from "@packages/core-kernel/src/services/log/drivers/pino";
import { ConfigRepository } from "@packages/core-kernel/src/services/config";
import { dirSync, setGracefulCleanup } from "tmp";

let app: Application;
let container: interfaces.Container;

beforeEach(() => {
    container = new Container();

    app = new Application(container);
    app.bind(Identifiers.ApplicationNamespace).toConstantValue("ark-jestnet");
    app.bind(Identifiers.ConfigRepository)
        .to(ConfigRepository)
        .inSingletonScope();
    app.get<ConfigRepository>(Identifiers.ConfigRepository).merge({
        app: {
            services: {
                log: {
                    levels: {
                        console: process.env.CORE_LOG_LEVEL || "emergency",
                        file: process.env.CORE_LOG_LEVEL_FILE || "emergency",
                    },
                    fileRotator: {
                        interval: "1s",
                    },
                },
            },
        },
    });

    app.useLogPath(dirSync().name);

    container.snapshot();
});

afterEach(() => container.restore());

afterAll(() => setGracefulCleanup());

describe("LogServiceProvider", () => {
    it(".register", async () => {
        expect(app.isBound(Identifiers.LogManager)).toBeFalse();
        expect(app.isBound(Identifiers.LogService)).toBeFalse();

        await app.resolve<ServiceProvider>(ServiceProvider).register();

        expect(app.isBound(Identifiers.LogManager)).toBeTrue();
        expect(app.isBound(Identifiers.LogService)).toBeTrue();
        expect(app.get(Identifiers.LogService)).toBeInstanceOf(PinoLogger);
    });
});
