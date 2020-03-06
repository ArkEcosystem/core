import "jest-extended";

import { Application } from "@packages/core-kernel/src/application";
import { LoadCryptography } from "@packages/core-kernel/src/bootstrap/app";
import { Container, Identifiers } from "@packages/core-kernel/src/ioc";
import { ConfigRepository } from "@packages/core-kernel/src/services/config";

let app: Application;
let configRepository: ConfigRepository;

beforeEach(() => {
    app = new Application(new Container());
    configRepository = app.get<ConfigRepository>(Identifiers.ConfigRepository);
});

describe("LoadCryptography", () => {
    it("should bootstrap from the network name", async () => {
        // Doesn't really matter network we use here as we don't rely on any specific values
        app.bind(Identifiers.ApplicationNetwork).toConstantValue("testnet");

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
