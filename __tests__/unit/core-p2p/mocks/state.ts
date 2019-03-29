import { genesisBlock } from "../../../utils/fixtures/unitnet/block-model";

export const state = {
    getLastBlock: () => genesisBlock,
    forkedBlock: null,
};
