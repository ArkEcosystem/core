import { httpie } from "@arkecosystem/core-utils";
import uuid from "uuid/v4";

export async function sendRequest(method, params: any = {}) {
    const id: string = uuid();
    const response = await httpie.post("http://localhost:8080/", {
        body: {
            jsonrpc: "2.0",
            id,
            method,
            params,
        },
    });

    await expect(response.status).toBe(200);
    await expect(response.body.jsonrpc).toBe("2.0");
    await expect(response.body.id).toBe(id);

    return response;
}
