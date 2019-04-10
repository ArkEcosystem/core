import { genesisBlock } from "../../../utils/config/testnet/genesisBlock";

export const config = {
    "network.nethash": genesisBlock.payloadHash,
    genesisBlock,
    "state.maxLastBlocks": 50,
};
