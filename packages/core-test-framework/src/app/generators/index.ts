import { CoreConfigPaths, CryptoConfigPaths, SandboxOptions } from "../contracts";
import { CoreGenerator } from "./core";
import { CryptoGenerator } from "./crypto";

export const generateCoreConfig = (opts?: SandboxOptions): CoreConfigPaths => new CoreGenerator(opts).generate();

export const generateCryptoConfig = (opts?: SandboxOptions): CryptoConfigPaths => new CryptoGenerator(opts).generate();

export const generateCryptoConfigRaw = (opts?: SandboxOptions) => {
    const config: CryptoConfigPaths = generateCryptoConfig(opts);

    return {
        exceptions: require(config.exceptions),
        genesisBlock: require(config.genesisBlock),
        milestones: require(config.milestones),
        network: require(config.network),
    };
};
