import { Network } from "../interfaces/networks";
import { configManager } from "../managers";

export const getWifFromNetwork = (network?: Network): number => network ? network.wif : configManager.get("network.wif");
export const getPubKeyHashFromNetwork = (network?: Network): number => network ? network.pubKeyHash : configManager.get("network.pubKeyHash");

export const getPubKeyHash = (networkVersion?: number): number => networkVersion || configManager.get("network.pubKeyHash");
