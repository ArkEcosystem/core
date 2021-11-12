import { Networks } from "../../src";
import { Serializer } from "../../src/blocks";
import { IBlockData } from "../../src/interfaces";

describe("Serializer.getId", () => {
    it.each(Object.entries(Networks))("should calculate %s genesis block id", (_, { genesisBlock }) => {
        expect(Serializer.getId(genesisBlock as unknown as IBlockData)).toEqual(genesisBlock.id);
    });
});
