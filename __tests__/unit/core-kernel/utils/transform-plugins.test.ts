import "jest-extended";

import { Plugins } from "@packages/core-kernel/src/utils";
import * as packages from "@packages/core/bin/config/testnet/plugins.js"; // @todo: replace with unit/jestnet

describe("transformPlugins", () => {
    it("should be ok", () => {
        const transformed = Plugins.transformPlugins(packages);

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
