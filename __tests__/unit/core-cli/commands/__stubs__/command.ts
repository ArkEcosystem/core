import { Commands, Container } from "@arkecosystem/core-cli";
import Joi from "@hapi/joi";

@Container.injectable()
export class Command extends Commands.Command {
    public signature: string = "config:cli";
    public description: string = "Update the CLI configuration.";

    public configure(): void {
        this.definition.setArgument("someArgument1", "...", Joi.string());
        this.definition.setArgument("someArgument11", "...", Joi.string());
        this.definition.setArgument("someArgument111", "...", Joi.string());

        this.definition.setFlag("someFlag1", "...", Joi.string());
        this.definition.setFlag("someFlag11", "...", Joi.string());
        this.definition.setFlag("someFlag111", "...", Joi.string());
    }

    public async execute(): Promise<void> {
        // Do nothing...
    }
}
