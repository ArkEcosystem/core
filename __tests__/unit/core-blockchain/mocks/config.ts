import genesisBlock from "../../../utils/config/testnet/genesisBlock.json";

export const config = {
    "network.nethash": genesisBlock.payloadHash,
    genesisBlock: genesisBlock,
    "state.maxLastBlocks": 50,
};
