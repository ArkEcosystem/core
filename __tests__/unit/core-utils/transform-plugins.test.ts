import "jest-extended";

import { Plugins } from "../../../packages/core-utils/src";
import * as plugins from "../../utils/config/unitnet/plugins.js";

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
