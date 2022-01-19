import { BlockStore } from "@packages/core-state/src/stores/blocks";
import { Interfaces } from "@packages/crypto";

describe("BlockStore", () => {
    it("should push and get a block", () => {
        const block: Interfaces.IBlock = {
            data: { height: 1, id: "1", previousBlock: undefined },
        } as Interfaces.IBlock;

        const store = new BlockStore(100);
        store.set(block);

        expect(store.count()).toBe(1);
        expect(store.get(block.data.id)).toEqual(block.data);
        expect(store.get(block.data.height)).toEqual(block.data);
    });

    it("should fail to push a block if its height is not 1 and there is no last block", () => {
        const store = new BlockStore(2);

        expect(() => store.set({ data: { height: 3, id: "3" } } as Interfaces.IBlock)).toThrow();
    });

    it("should fail to push a block if it does not contain an id", () => {
        const store = new BlockStore(2);

        expect(() => store.set({ data: { height: 1 } } as Interfaces.IBlock)).toThrow();
    });

    it("should fail to push a block if it isn't chained", () => {
        const store = new BlockStore(2);
        store.set({ data: { height: 1, id: "1" } } as Interfaces.IBlock);

        expect(() => store.set({ data: { height: 3, id: "3" } } as Interfaces.IBlock)).toThrow();
    });

    it("should return all ids and heights in the order they were inserted", () => {
        const store = new BlockStore(4);

        for (let i = 1; i < 5; i++) {
            store.set({ data: { id: i.toString(), height: i } } as Interfaces.IBlock);
        }

        expect(store.count()).toBe(4);
        expect(store.getIds()).toEqual(["1", "2", "3", "4"]);
        expect(store.getHeights()).toEqual([1, 2, 3, 4]);
    });

    it("should return whether the store contains a specific block", () => {
        const store = new BlockStore(4);

        for (let i = 1; i < 5; i++) {
            store.set({ data: { id: i.toString(), height: i } } as Interfaces.IBlock);
        }

        expect(store.has({ height: 1, id: "1" } as Interfaces.IBlockData)).toBe(true);
        expect(store.has({ height: 5, id: "5" } as Interfaces.IBlockData)).toBe(false);
    });

    it("should delete blocks", () => {
        const store = new BlockStore(4);

        for (let i = 1; i < 5; i++) {
            store.set({ data: { id: i.toString(), height: i } } as Interfaces.IBlock);
        }

        store.delete({ height: 4, id: "4" } as Interfaces.IBlockData);
        expect(store.count()).toBe(3);
        expect(store.has({ height: 4, id: "4" } as Interfaces.IBlockData)).toBe(false);
    });

    // TODO: check this is the desired behaviour
    it("should be resizeable", () => {
        const store = new BlockStore(1);
        store.set({ data: { height: 1, id: "1" } } as Interfaces.IBlock);
        store.set({ data: { height: 2, id: "2" } } as Interfaces.IBlock);
        expect(store.count()).toBe(1);
        expect(store.getIds()).toEqual(["2"]); // seems that the underlying CappedMap overwrites from beginning
        store.resize(2);
        store.set({ data: { height: 3, id: "3" } } as Interfaces.IBlock);
        expect(store.count()).toBe(2);
        expect(store.getIds()).toEqual(["2", "3"]);
    });

    it("should clear all blocks", () => {
        const store = new BlockStore(4);

        for (let i = 1; i < 5; i++) {
            store.set({ data: { id: i.toString(), height: i } } as Interfaces.IBlock);
        }

        expect(store.count()).toBe(4);
        expect(store.values().length).toBe(4);
        store.clear();
        expect(store.count()).toBe(0);
    });
});
