"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const exceptions_json_1 = __importDefault(require("./exceptions.json"));
const genesisBlock_json_1 = __importDefault(require("./genesisBlock.json"));
const milestones_json_1 = __importDefault(require("./milestones.json"));
const network_json_1 = __importDefault(require("./network.json"));
exports.mainnet = { exceptions: exceptions_json_1.default, genesisBlock: genesisBlock_json_1.default, milestones: milestones_json_1.default, network: network_json_1.default };
//# sourceMappingURL=index.js.map