import Joi from "joi";
import get from "lodash.get";
import { network } from "./network";

export class Processor {
    public async resource(server, payload) {
        const { error } = Joi.validate(payload || {}, {
            jsonrpc: Joi.string()
                .valid("2.0")
                .required(),
            method: Joi.string().required(),
            id: Joi.required(),
            params: Joi.object(),
        });

        if (error) {
            return this.createErrorResponse(payload ? payload.id : null, -32600, error);
        }

        const { method, params, id } = payload;

        try {
            const targetMethod = get(server.methods, method);

            if (!targetMethod) {
                return this.createErrorResponse(id, -32601, "The method does not exist / is not available.");
            }

            const schema = server.app.schemas[method];

            if (schema) {
                // tslint:disable-next-line:no-shadowed-variable
                const { error } = Joi.validate(params, schema);

                if (error) {
                    return this.createErrorResponse(id, -32602, error);
                }
            }

            await network.connect();

            const result = await targetMethod(params);

            return result.isBoom
                ? this.createErrorResponse(id, result.output.statusCode, result.output.payload)
                : this.createSuccessResponse(id, result);
        } catch (error) {
            return this.createErrorResponse(id, -32603, error);
        }
    }

    public async collection(server, payload) {
        const results = [];

        for (const item of payload) {
            const result = await this.resource(server, item);

            results.push(result);
        }

        return results;
    }

    private createSuccessResponse(id, result) {
        return {
            jsonrpc: "2.0",
            id,
            result,
        };
    }

    private createErrorResponse(id, code, error) {
        return {
            jsonrpc: "2.0",
            id,
            error: {
                code,
                message: error.message,
                data: error.stack,
            },
        };
    }
}
