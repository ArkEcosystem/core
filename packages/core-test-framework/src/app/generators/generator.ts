import { Interfaces as BlockInterfaces } from "@arkecosystem/core-crypto";
import { CryptoManager, Interfaces, Transactions } from "@arkecosystem/crypto";
import { generateMnemonic } from "bip39";

import passphrases from "../../internal/passphrases.json";
import { defaultSchemaValidator } from "../../utils/schema-validator";
import { SandboxOptions, Wallet } from "../contracts";

/**
 * @export
 * @class Generator
 */
export abstract class Generator<T = BlockInterfaces.IBlockData> {
    /**
     * @private
     * @type {ConfigPaths}
     * @memberof Sandbox
     */
    protected options: SandboxOptions = {
        core: {},
        crypto: {
            flags: {
                network: "unitnet",
                premine: "15300000000000000",
                delegates: 51,
                blocktime: 8,
                maxTxPerBlock: 150,
                maxBlockPayload: 2097152,
                rewardHeight: 75600,
                rewardAmount: 200000000,
                pubKeyHash: 23,
                wif: 186,
                token: "UARK",
                symbol: "UѦ",
                explorer: "http://uexplorer.ark.io",
                distribute: true,
            },
        },
    };

    protected cryptoManager: CryptoManager<T>;
    protected transactionManager: Transactions.TransactionsManager<T>;

    /**
     * @param {SandboxOptions} options
     * @memberof Generator
     */
    public constructor(options?: SandboxOptions, schemaValidator = defaultSchemaValidator) {
        if (options) {
            this.options = { ...this.options, ...options };
        }

        const config = { ...CryptoManager.findNetworkByName("devnet"), ...this.options.crypto };

        this.cryptoManager = CryptoManager.createFromConfig(config as Interfaces.NetworkConfig<T>);

        this.transactionManager = new Transactions.TransactionsManager(this.cryptoManager, schemaValidator);
    }

    /**
     * @protected
     * @param {number} activeDelegates
     * @param {number} pubKeyHash
     * @returns {Wallet[]}
     * @memberof Generator
     */
    protected generateCoreDelegates(activeDelegates: number): Wallet[] {
        const wallets: Wallet[] = [];

        for (let i = 0; i < activeDelegates; i++) {
            const delegateWallet: Wallet = this.createWallet(passphrases[i]);
            delegateWallet.username = `genesis_${i + 1}`;

            wallets.push(delegateWallet);
        }

        return wallets;
    }

    /**
     * @protected
     * @param {number} pubKeyHash
     * @param {string} [passphrase]
     * @returns {Wallet}
     * @memberof Generator
     */
    protected createWallet(passphrase?: string): Wallet {
        if (!passphrase) {
            passphrase = generateMnemonic();
        }

        const keys: Interfaces.IKeyPair = this.cryptoManager.Identities.Keys.fromPassphrase(passphrase);

        return {
            address: this.cryptoManager.Identities.Address.fromPublicKey(keys.publicKey),
            passphrase,
            keys,
            username: undefined,
        };
    }
}
