import { configManager, models } from "@arkecosystem/crypto";
import genesisBlockJson from "../../config/unitnet/genesisBlock.json";

configManager.setFromPreset("unitnet");

export const genesisBlock = models.Block.fromData(genesisBlockJson);
