import "jest-extended";

import { Plugins } from "@packages/core-kernel/src/utils";
import { plugins } from "@packages/core/bin/config/testnet/app.js"; // @todo: replace with unit/jestnet

describe("transformPlugins", () => {
    it("should be ok", () => {
        const transformed = Plugins.transformPlugins(plugins);

        expect(transformed).toEqual({
            "@arkecosystem/core-api": {
                enabled: true,
                port: 4003,
            },
            "@arkecosystem/core-exchange-json-rpc": {
                enabled: false,
                port: 8080,
            },
            "@arkecosystem/core-webhooks": {
                enabled: false,
                port: 4004,
            },
        });
    });
});
