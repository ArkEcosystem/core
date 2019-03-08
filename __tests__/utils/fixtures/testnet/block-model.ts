import { configManager, models } from "@arkecosystem/crypto";
import genesisBlockJson from "../../config/testnet/genesisBlock.json";

configManager.setFromPreset("testnet");

export const genesisBlock = new models.Block(genesisBlockJson);
