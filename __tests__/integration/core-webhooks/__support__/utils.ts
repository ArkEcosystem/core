import { httpie } from "@arkecosystem/core-utils";
import "jest-extended";

export function request(method, path, params = {}) {
    const url = `http://localhost:4004/api/${path}`;
    const callable = httpie[method.toLowerCase()];

    return ["GET", "DELETE"].includes(method) ? callable(url, { params }) : callable(url, params);
}

export function expectJson(response) {
    expect(response.data).toBeObject();
}

export function expectStatus(response, code) {
    expect(response.status).toBe(code);
}

export function expectResource(response) {
    expect(response.data.data).toBeObject();
}

export function expectCollection(response) {
    expect(Array.isArray(response.data.data)).toBe(true);
}

export function expectPaginator(response, firstPage = true) {
    expect(response.data.meta).toBeObject();
    expect(response.data.meta).toHaveProperty("count");
    expect(response.data.meta).toHaveProperty("pageCount");
    expect(response.data.meta).toHaveProperty("totalCount");
    expect(response.data.meta).toHaveProperty("next");
    expect(response.data.meta).toHaveProperty("previous");
    expect(response.data.meta).toHaveProperty("self");
    expect(response.data.meta).toHaveProperty("first");
    expect(response.data.meta).toHaveProperty("last");
}

export function expectSuccessful(response, statusCode = 200) {
    this.expectStatus(response, statusCode);
    this.expectJson(response);
}

export function expectError(response, statusCode = 404) {
    this.expectStatus(response, statusCode);
    this.expectJson(response);
    expect(response.data.statusCode).toBeNumber();
    expect(response.data.error).toBeString();
    expect(response.data.message).toBeString();
}
