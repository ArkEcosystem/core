import { Blocks, Managers } from "@arkecosystem/crypto";
import genesisBlockJson from "../../config/testnet/genesisBlock.json";

Managers.configManager.setFromPreset("testnet");

export const genesisBlock = Blocks.Block.fromData(genesisBlockJson);
