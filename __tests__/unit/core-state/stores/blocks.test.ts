import { BlockStore } from "../../../../packages/core-state/src/stores/blocks";
import { genesisBlock } from "../../../utils/config/testnet/genesisBlock";

describe("BlockStore", () => {
    it("should push and get a block", () => {
        const store = new BlockStore(100);
        store.set(genesisBlock);

        expect(store.count()).toBe(1);
        expect(store.get(genesisBlock.id)).toEqual(genesisBlock);
        expect(store.get(genesisBlock.height)).toEqual(genesisBlock);
    });

    it("should fail to push a block if it isn't chained", () => {
        const store = new BlockStore(2);
        store.set(genesisBlock);

        expect(() => store.set({ ...genesisBlock, ...{ height: 3 } })).toThrow();
    });

    it("should return all ids and heights in the order they were inserted", () => {
        const store = new BlockStore(5);

        for (let i = 0; i < 5; i++) {
            store.set({ id: i.toString(), height: i } as any);
        }

        expect(store.count()).toBe(5);
        expect(store.getIds()).toEqual(["0", "1", "2", "3", "4"]);
        expect(store.getHeights()).toEqual([0, 1, 2, 3, 4]);
    });
});
