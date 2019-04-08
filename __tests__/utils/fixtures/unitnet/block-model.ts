import { blocks, configManager } from "@arkecosystem/crypto";
import genesisBlockJson from "../../config/unitnet/genesisBlock.json";

configManager.setFromPreset("unitnet");

export const genesisBlock = new blocks.Block(genesisBlockJson);
