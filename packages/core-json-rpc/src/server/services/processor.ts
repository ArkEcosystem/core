import { Server } from "hapi";
import get from "lodash.get";
import { IResponse, IResponseError } from "../../interfaces";
import { validateJSON } from "../utils";
import { network } from "./network";

export class Processor {
    public async resource(server: Server, payload) {
        const { error } = validateJSON(payload || {}, {
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
        });

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
                const { error } = validateJSON(params, schema);

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
