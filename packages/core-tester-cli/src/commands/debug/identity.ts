import { Crypto, Managers, Types } from "@arkecosystem/crypto";
import { flags } from "@oclif/command";
import { handleOutput } from "../../utils";
import { BaseCommand } from "../command";

export class IdentityCommand extends BaseCommand {
    public static description: string = "Get identities from the given input";

    public static flags = {
        ...BaseCommand.flagsDebug,
        data: flags.string({
            description: "the data to get the identities from",
            required: true,
        }),
        type: flags.string({
            description: "the input type is either of passphrase, privateKey or publicKey",
            required: true,
        }),
    };

    public async run(): Promise<void> {
        const { flags } = this.parse(IdentityCommand);

        Managers.configManager.setFromPreset(flags.network as Types.NetworkName);

        let output;

        if (flags.type === "passphrase") {
            const keys = Crypto.crypto.getKeys(flags.data);
            output = {
                passphrase: flags.data,
                publicKey: keys.publicKey,
                privateKey: keys.privateKey,
                address: Crypto.crypto.getAddress(keys.publicKey),
            };
        } else if (flags.type === "privateKey") {
            const keys = Crypto.crypto.getKeysByPrivateKey(flags.data);
            output = {
                publicKey: keys.publicKey,
                privateKey: keys.privateKey,
                address: Crypto.crypto.getAddress(keys.publicKey),
            };
        } else if (flags.type === "publicKey") {
            output = {
                publicKey: flags.data,
                address: Crypto.crypto.getAddress(flags.data),
            };
        }

        return handleOutput(flags, output);
    }
}
