import { DelegateFactory } from "@arkecosystem/core-forger";
import { Interfaces, Utils } from "@arkecosystem/crypto";
import { delegates, genesisBlock } from "../utils/fixtures/unitnet";

export class BlockFactory {
    public static createDummy(transactions: Interfaces.ITransactionData[] = []): Interfaces.IBlock {
        const delegate = DelegateFactory.fromBIP39(delegates[0].passphrase);
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
