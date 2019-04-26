import { genesisBlock } from "../../../utils/fixtures/unitnet/block-model";

export const state = {
    getStore: () => ({
        getLastBlock: () => genesisBlock,
        forkedBlock: null,
    }),
};
