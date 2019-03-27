import { blocks2to100 } from "../../../utils/fixtures";
import { delegates } from "../../../utils/fixtures/testnet/delegates";
import { genesisBlock } from "../../../utils/fixtures/unitnet/block-model";

export const database = {
    getBlocksByHeight: heights => {
        if (heights[0] === 1) {
            return [genesisBlock.data];
        }

        return [];
    },
    getActiveDelegates: height => {
        return delegates;
    },
    loadActiveDelegateList: (count, height) => {
        if (height === 2) {
            return [blocks2to100[1]];
        }

        return delegates;
    },
    verifyTransaction: jest.fn().mockReturnValue(true),
    getCommonBlocks: jest.fn(),

    walletManager: {
        findByPublicKey: jest.fn().mockReturnValue({
            username: "coolUsername",
        }),
    },
};
