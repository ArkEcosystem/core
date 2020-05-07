import { Interfaces as BlockInterfaces } from "@arkecosystem/core-crypto";
import { CryptoManager, Interfaces, Types } from "@arkecosystem/crypto";

import { assert } from "./assert";

// todo: review the implementation
export const calculate = (height: number, cryptoManager: CryptoManager<BlockInterfaces.IBlockData>): string => {
    const config:
        | Interfaces.NetworkConfig<BlockInterfaces.IBlockData>
        | undefined = cryptoManager.NetworkConfigManager.all();

    assert.defined<Interfaces.NetworkConfig<BlockInterfaces.IBlockData>>(config);

    const { genesisBlock, milestones } = config;

    const totalAmount: Types.BigNumber = cryptoManager.LibraryManager.Libraries.BigNumber.make(
        genesisBlock.totalAmount,
    );

    if (height === 0 || milestones.length === 0) {
        return totalAmount.toFixed();
    }

    let rewards: Types.BigNumber = cryptoManager.LibraryManager.Libraries.BigNumber.ZERO;
    let currentHeight = 0;
    let constantIndex = 0;

    while (currentHeight < height) {
        const constants = milestones[constantIndex];
        const nextConstants = milestones[constantIndex + 1];

        let heightJump: number = height - currentHeight;

        if (nextConstants && height >= nextConstants.height && currentHeight < nextConstants.height - 1) {
            heightJump = nextConstants.height - 1 - currentHeight;
            constantIndex += 1;
        }

        currentHeight += heightJump;

        if (currentHeight >= constants.height) {
            rewards = rewards.plus(
                cryptoManager.LibraryManager.Libraries.BigNumber.make(constants.reward).times(heightJump),
            );
        }
    }

    return totalAmount.plus(rewards).toFixed();
};
