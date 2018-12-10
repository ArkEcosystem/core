import axios from "axios";
import uuid from "uuid/v4";

export async function sendRequest(method, params: any = {}) {
    const id = uuid();
    const response = await axios.post("http://localhost:8080/", {
        jsonrpc: "2.0",
        id,
        method,
        params,
    });

    await expect(response.status).toBe(200);
    await expect(response.data.jsonrpc).toBe("2.0");
    await expect(response.data.id).toBe(id);

    return response;
}
