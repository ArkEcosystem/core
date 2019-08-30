import { Delegate } from "@arkecosystem/core-forger";
import { Interfaces, Networks, Utils } from "@arkecosystem/crypto";
import { delegates, genesisBlock } from "../utils/fixtures/unitnet";

export class BlockFactory {
    public static createDummy(transactions: Interfaces.ITransactionData[] = []): Interfaces.IBlock {
        const delegate = new Delegate(delegates[0].passphrase, Networks.unitnet.network);
        return delegate.forge(transactions, {
            timestamp: 12345689,
            previousBlock: {
                id: genesisBlock.id,
                height: 1,
            },
            reward: Utils.BigNumber.ZERO,
        });
    }
}
