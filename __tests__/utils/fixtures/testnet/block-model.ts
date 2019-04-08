import { blocks, configManager } from "@arkecosystem/crypto";
import genesisBlockJson from "../../config/testnet/genesisBlock.json";

configManager.setFromPreset("testnet");

export const genesisBlock = new blocks.Block(genesisBlockJson);
