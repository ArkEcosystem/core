import { Commands, Container } from "@arkecosystem/core-cli";
import { Identities, Managers, Transactions, Utils } from "@arkecosystem/crypto";
import Joi from "joi";

@Container.injectable()
export class Command extends Commands.Command {
    public signature: string = "genesis:delegate:generate";
    public description: string = "Generate a self voting genesis delegate";

    public configure(): void {
        this.definition
            .setFlag("name", "Name of delegate", Joi.string().required())
            .setFlag("passphrase", "Mnemonic (passphrase) of delegate", Joi.string().required())
            .setFlag("network", "Network to use", Joi.string().default(null));
    }

    public async execute(): Promise<void> {
        if (this.getFlag("network") !== null) {
            Managers.configManager.setFromPreset(this.getFlag("network"));
            this.components.info(`Network '${this.getFlag("network")}' has been set`);
        }

        const passphrase = this.getFlag("passphrase");
        const name = this.getFlag("name");
        const keys = Identities.Keys.fromPassphrase(passphrase);

        this.components.info(`Address: ${Identities.Address.fromPassphrase(passphrase)}`);
        this.components.info(`Mnemonic: ${passphrase}`);
        this.components.info(`Delegate name: ${name}`);

        const transactions = [
            Transactions.BuilderFactory.delegateRegistration().nonce("1").usernameAsset(name).sign(passphrase).data,
            Transactions.BuilderFactory.vote()
                .nonce("2")
                .votesAsset([`+${keys.publicKey}`])
                .sign(passphrase).data,
        ];

        for (const transaction of transactions) {
            Object.assign(transaction, {
                fee: Utils.BigNumber.ZERO,
                timestamp: 0,
            });
            transaction.signature = Transactions.Signer.sign(transaction, keys);
            transaction.id = Transactions.Utils.getId(transaction);
        }

        this.components.info(JSON.stringify(transactions));
    }
}
