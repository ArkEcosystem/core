import { genesisBlock } from "../../../utils/fixtures/unitnet/block-model";

jest.mock("@arkecosystem/core-container", () => {
    return {
        app: {
            resolvePlugin: name => {
                if (name === "database") {
                    return {
                        saveBlock: () => null,
                        getLastBlock: () => genesisBlock,
                    };
                }

                return {};
            },
        },
    };
});
