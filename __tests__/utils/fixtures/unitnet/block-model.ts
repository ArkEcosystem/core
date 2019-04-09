import { Blocks, Managers } from "@arkecosystem/crypto";
import genesisBlockJson from "../../config/unitnet/genesisBlock.json";

Managers.configManager.setFromPreset("unitnet");

export const genesisBlock = Blocks.Block.fromData(genesisBlockJson);
