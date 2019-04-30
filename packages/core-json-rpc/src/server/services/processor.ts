import { Validation } from "@arkecosystem/crypto";
import { Server } from "hapi";
import get from "lodash.get";
import { IRequestParameters, IResponse, IResponseError } from "../../interfaces";

export class Processor {
    public async resource<T = any>(
        server: Server,
        payload: IRequestParameters,
    ): Promise<IResponse<T> | IResponseError> {
        const { error } = Validation.validator.validate(
            {
                type: "object",
                properties: {
                    jsonrpc: {
                        type: "string",
                        pattern: "2.0",
                    },
                    method: {
                        type: "string",
                    },
                    id: {
                        type: ["number", "string"],
                    },
                    params: {
                        type: "object",
                    },
                },
                required: ["jsonrpc", "method", "id"],
            },
            payload || {},
        );

        if (error) {
            return this.createErrorResponse(payload ? payload.id : null, -32600, new Error(error));
        }

        const { method, params, id } = payload;

        try {
            const targetMethod = get(server.methods, method);

            if (!targetMethod) {
                return this.createErrorResponse(id, -32601, new Error("The method does not exist / is not available."));
            }

            // @ts-ignore
            const schema = server.app.schemas[method];

            if (schema) {
                // tslint:disable-next-line:no-shadowed-variable
                const { error } = Validation.validator.validate(schema, params);

                if (error) {
                    return this.createErrorResponse(id, -32602, error);
                }
            }

            const result = await targetMethod(params);

            return result.isBoom
                ? this.createErrorResponse(id, result.output.statusCode, result.output.payload)
                : this.createSuccessResponse(id, result);
        } catch (error) {
            return this.createErrorResponse(id, -32603, error);
        }
    }

    public async collection<T = any>(
        server: Server,
        payloads: IRequestParameters[],
    ): Promise<Array<IResponse<T>> | IResponseError[]> {
        const results = [];

        for (const payload of payloads) {
            results.push(await this.resource<T>(server, payload));
        }

        return results;
    }

    private createSuccessResponse<T = any>(id: string | number, result: T): IResponse<T> {
        return {
            jsonrpc: "2.0",
            id,
            result,
        };
    }

    private createErrorResponse(id: string | number, code: number, error: Error): IResponseError {
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
