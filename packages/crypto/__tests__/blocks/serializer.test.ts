import { Networks } from "../../src";
import { Serializer } from "../../src/blocks";

describe("Serializer.getId", () => {
    it.each(Object.entries(Networks))("should calculate %s genesis block id", (_, { genesisBlock }) => {
        expect(Serializer.getId(genesisBlock)).toEqual(genesisBlock.id);
    });
});
