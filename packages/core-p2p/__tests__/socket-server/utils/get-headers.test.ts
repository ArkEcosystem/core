import { Container } from "@arkecosystem/core-kernel";
import { getHeaders } from "@arkecosystem/core-p2p/src/socket-server/utils/get-headers";

describe("getHeaders", () => {
    const version = "3.0.9";
    const port = 4007;
    const height = 387;
    const stateStore = { isStarted: jest.fn().mockReturnValue(true) };
    const blockchain = { getLastHeight: () => height };
    const appGet = {
        [Container.Identifiers.StateStore]: stateStore,
        [Container.Identifiers.BlockchainService]: blockchain,
    };
    const app = {
        version: () => version,
        getTagged: () => ({ get: () => port }),
        get: (key) => appGet[key],
    };

    it("should return accurate { version, port, height }", () => {
        const headers = getHeaders(app as any);

        expect(headers).toEqual({ version, port, height });
    });

    it("should return { version, port, height: undefined } when state is not 'started'", () => {
        stateStore.isStarted = jest.fn().mockReturnValue(false);
        const headers = getHeaders(app as any);

        expect(headers).toEqual({ version, port, height: undefined });
    });

    it("should return port as an integer (when it is set in config as a string)", () => {
        const version = "3.0.9";
        const port = "4005";
        const height = 387;
        const blockchain = { getLastHeight: () => height };
        const appGet = {
            [Container.Identifiers.StateStore]: stateStore,
            [Container.Identifiers.BlockchainService]: blockchain,
        };
        const app = {
            version: () => version,
            getTagged: () => ({ get: () => port }),
            get: (key) => appGet[key],
        };

        stateStore.isStarted = jest.fn().mockReturnValue(false);
        const headers = getHeaders(app as any);

        const portNumberAsString = app.getTagged().get();
        expect(typeof portNumberAsString).toBe("string");
        expect(portNumberAsString).toEqual("4005");
        expect(typeof headers.port).toBe("number");
        expect(headers.port).toEqual(4005);
    });
});
