import { httpie } from "@arkecosystem/core-utils";

export async function request(method, path, params = {}) {
    const url = `http://localhost:4004/api/${path}`;

    return ["GET", "DELETE"].includes(method)
        ? httpie[method.toLowerCase()](url, { query: params })
        : httpie[method.toLowerCase()](url, { body: params });
}

export function expectJson(response) {
    expect(response.body).toBeObject();
}

export function expectStatus(response, code) {
    expect(response.status).toBe(code);
}

export function expectResource(response) {
    expect(response.body.data).toBeObject();
}

export function expectCollection(response) {
    expect(Array.isArray(response.body.data)).toBe(true);
}

export function expectPaginator(response) {
    expect(response.body.meta).toBeObject();
    expect(response.body.meta).toHaveProperty("count");
    expect(response.body.meta).toHaveProperty("pageCount");
    expect(response.body.meta).toHaveProperty("totalCount");
    expect(response.body.meta).toHaveProperty("next");
    expect(response.body.meta).toHaveProperty("previous");
    expect(response.body.meta).toHaveProperty("self");
    expect(response.body.meta).toHaveProperty("first");
    expect(response.body.meta).toHaveProperty("last");
}

export function expectSuccessful(response, statusCode = 200) {
    this.expectStatus(response, statusCode);
    this.expectJson(response);
}

export function expectError(response, statusCode = 404) {
    this.expectStatus(response, statusCode);
    this.expectJson(response);
    expect(response.body.statusCode).toBeNumber();
    expect(response.body.error).toBeString();
    expect(response.body.message).toBeString();
}
