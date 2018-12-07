import "jest-extended";

export class ApiHelpers {
  public async request(server, method, url, headers, params = {}) {
    // Build URL params from _params_ object for GET / DELETE requests
    const getParams = Object.entries(params)
      .map(([key, val]) => `${key}=${val}`)
      .join("&");

    // Injecting the request into Hapi server instead of using axios
    const injectOptions = {
      method,
      url: ["GET", "DELETE"].includes(method) ? `${url}?${getParams}` : url,
      headers,
      payload: ["GET", "DELETE"].includes(method) ? {} : params
    };

    const response = await server.inject(injectOptions);
    const data =
      typeof response.result === "string"
        ? JSON.parse(response.result)
        : response.result;
    Object.assign(response, { data, status: response.statusCode });
    return response;
  }

  public expectJson(response) {
    expect(response.data).toBeObject();
  }

  public expectStatus(response, code) {
    expect(response.status).toBe(code);
  }

  public expectResource(response) {
    expect(response.data.data).toBeObject();
  }

  public expectCollection(response) {
    expect(Array.isArray(response.data.data)).toBe(true);
  }

  public expectSuccessful(response, statusCode = 200) {
    this.expectStatus(response, statusCode);
    this.expectJson(response);
  }

  public expectError(response, statusCode = 404) {
    this.expectStatus(response, statusCode);
    this.expectJson(response);
    expect(response.data.statusCode).toBeNumber();
    expect(response.data.error).toBeString();
    expect(response.data.message).toBeString();
  }
}
