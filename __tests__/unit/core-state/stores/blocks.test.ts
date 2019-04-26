import { BlockStore } from "../../../../packages/core-state/src/stores/blocks";
import { genesisBlock } from "../../../utils/config/testnet/genesisBlock";

describe("BlockStore", () => {
    it("should push and get a block", () => {
        const store = new BlockStore(100);
        store.push(genesisBlock);

        expect(store.count()).toBe(1);
        expect(store.get(genesisBlock.id)).toEqual(genesisBlock);
    });
});
