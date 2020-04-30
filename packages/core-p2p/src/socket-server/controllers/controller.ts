import Joi from "@hapi/joi";
import Boom from "@hapi/boom";
import { Container, Contracts } from "@arkecosystem/core-kernel";

@Container.injectable()
export class Controller {
    @Container.inject(Container.Identifiers.Application)
    protected readonly app!: Contracts.Kernel.Application;

    @Container.inject(Container.Identifiers.LogService)
    protected readonly logger!: Contracts.Kernel.Logger;

    protected validatePayload(payload: any, schema: Joi.Schema): void {
        const { error } = schema.validate(payload);
        if (error) {
            throw Boom.badRequest("Validation failed");
        }
    }
}
