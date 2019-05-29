import "jest-extended";

export const request = async (server, method, path, payload = {}) => {
    const response = await server.inject({ method, url: `http://localhost:4004/api/${path}`, payload });

    return { body: response.result, status: response.statusCode };
};

export const expectJson = response => expect(response.body).toBeObject();
export const expectStatus = (response, code) => expect(response.status).toBe(code);
export const expectResource = response => expect(response.body.data).toBeObject();
export const expectCollection = response => expect(Array.isArray(response.body.data)).toBe(true);

export const expectPaginator = response => {
    expect(response.body.meta).toBeObject();
    expect(response.body.meta).toHaveProperty("count");
    expect(response.body.meta).toHaveProperty("pageCount");
    expect(response.body.meta).toHaveProperty("totalCount");
    expect(response.body.meta).toHaveProperty("next");
    expect(response.body.meta).toHaveProperty("previous");
    expect(response.body.meta).toHaveProperty("self");
    expect(response.body.meta).toHaveProperty("first");
    expect(response.body.meta).toHaveProperty("last");
};

export const expectSuccessful = (response, statusCode = 200) => {
    expectStatus(response, statusCode);
    expectJson(response);
};

export const expectError = (response, statusCode = 404) => {
    expectStatus(response, statusCode);
    expectJson(response);
    expect(response.body.statusCode).toBeNumber();
    expect(response.body.error).toBeString();
    expect(response.body.message).toBeString();
};
