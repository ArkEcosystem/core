import { getHeaders } from "@arkecosystem/core-p2p/src/socket-server/utils/get-headers";
import { Container } from "@arkecosystem/core-kernel";

describe("getHeaders", () => {
    const version = "3.0.9";
    const port = 4007;
    const height = 387;
    const stateStore = { started: true };
    const blockchain = { getLastHeight: () => height };
    const appGet = {
        [Container.Identifiers.StateStore]: stateStore,
        [Container.Identifiers.BlockchainService]: blockchain,

    }
    const app = {
        version: () => version,
        getTagged: () => ({ get: () => port }),
        get: (key) => appGet[key],
    };

    it("should return accurate { version, port, height }", () => {
        const headers = getHeaders(app as any);

        expect(headers).toEqual({ version, port, height });
    })

    it("should return { version, port, height: undefined } when state is not 'started'", () => {
        stateStore.started = false;
        const headers = getHeaders(app as any);

        expect(headers).toEqual({ version, port, height: undefined });
    })
});
