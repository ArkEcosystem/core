import "jest-extended";

// import { resolve } from "path";

import { Application } from "@packages/core-kernel/src/application";
import { Container, interfaces, Identifiers } from "@packages/core-kernel/src/ioc";
import { ConfigRepository } from "@packages/core-kernel/src/services/config";
import { LoadCryptography } from "@packages/core-kernel/src/bootstrap/app";

let app: Application;
let container: interfaces.Container;
let configRepository: ConfigRepository;

beforeEach(() => {
    container = new Container();

    app = new Application(container);

    app.bind(Identifiers.ConfigRepository)
        .to(ConfigRepository)
        .inSingletonScope();

    configRepository = app.get<ConfigRepository>(Identifiers.ConfigRepository);

    container.snapshot();
});

afterEach(() => container.restore());

describe("LoadCryptography", () => {
    it("should bootstrap from the network name", async () => {
        app.bind(Identifiers.ApplicationNetwork).toConstantValue("unitnet");

        await app.resolve<LoadCryptography>(LoadCryptography).bootstrap();

        expect(app.get(Identifiers.Crypto)).toContainAllKeys(["network", "exceptions", "milestones", "genesisBlock"]);
    });

    it("should bootstrap from the configuration repository", async () => {
        configRepository.merge({
            crypto: {
                genesisBlock: {},
                exceptions: {},
                milestones: [],
                network: {},
            },
        });

        await app.resolve<LoadCryptography>(LoadCryptography).bootstrap();

        expect(app.get(Identifiers.Crypto)).toContainAllKeys(["network", "exceptions", "milestones", "genesisBlock"]);
    });
});
