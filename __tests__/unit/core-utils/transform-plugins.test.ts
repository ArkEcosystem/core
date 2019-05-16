import "jest-extended";

import { Plugins } from "../../../packages/core-utils/src";
import * as plugins from "../../utils/config/unitnet/plugins.js";

describe("transformPlugins", () => {
    it("should be ok", () => {
        const transformed = Plugins.transformPlugins(plugins);

        expect(transformed).toEqual({
            api: { port: 4003 },
        });
    });
});
