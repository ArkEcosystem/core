import { Container } from "@arkecosystem/core-kernel";
import { fork } from "child_process";

import { FactoryWorker } from "../../../packages/core-transaction-pool/src/factory-worker";

jest.mock("child_process");

const pluginConfiguration = { getRequired: jest.fn() };

const container = new Container.Container();
container.bind(Container.Identifiers.PluginConfiguration).toConstantValue(pluginConfiguration);

beforeEach(() => {
    pluginConfiguration.getRequired.mockReset();
});

describe("FactoryWorker.initialize", () => {
    it("should start subprocess", () => {
        const subprocess = { on: jest.fn() };
        (fork as jest.Mock).mockReturnValue(subprocess);

        container.resolve(FactoryWorker);

        expect(fork).toBeCalled();
        expect(subprocess.on).toBeCalled();
    });
});
