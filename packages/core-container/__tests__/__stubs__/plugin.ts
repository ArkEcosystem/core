import * as Joi from "joi";
import { AbstractPlugin } from "../../src/plugin";

export class Plugin extends AbstractPlugin {
    /** @inheritdoc */
    public async register(): Promise<void> {
        this.app.bind(this.getName(), true);
    }

    /** @inheritdoc */
    public async dispose(): Promise<void> {
        this.app.bind(this.getName(), false);
    }

    /** @inheritdoc */
    public getName(): string {
        return "api";
    }

    /** @inheritdoc */
    public getVersion(): string {
        return "1.0.0";
    }

    /** @inheritdoc */
    public getDefaults(): Joi.Schema {
        return Joi.object();
    }
}
