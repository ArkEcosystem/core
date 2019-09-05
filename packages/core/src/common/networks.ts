import { Networks } from "@arkecosystem/crypto";

export const isValidNetwork = (network: string): boolean => Object.keys(Networks).includes(network);
