import "jest-extended";

export const request = async (server, method, path, payload = {}) => {
    const response = await server.inject({ method, url: `http://localhost:4004/api/${path}`, payload });

    return { body: response.result, status: response.statusCode };
};

export const expectStatus = (response, code) => expect(response.status).toBe(code);
export const expectResource = response => expect(response.body.data).toBeObject();
export const expectCollection = response => expect(Array.isArray(response.body.data)).toBe(true);

export const expectSuccessful = (response, statusCode = 200) => {
    expectStatus(response, statusCode);
    expect(response.body).toBeObject();
};

export const expectError = (response, statusCode = 404) => {
    expectStatus(response, statusCode);
    expect(response.body).toBeObject();
    expect(response.body.statusCode).toBeNumber();
    expect(response.body.error).toBeString();
    expect(response.body.message).toBeString();
};
