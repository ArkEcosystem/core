import { configManager, models } from "@arkecosystem/crypto";
import genesisBlockJson from "../../../utils/config/testnet/genesisBlock.json";

configManager.setFromPreset("testnet");

export const genesisBlock = new models.Block(genesisBlockJson);
