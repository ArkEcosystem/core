import wreck from "@hapi/wreck";

export const trailingSlash = {
    name: "trailing-slash",
    version: "0.1.0",
    register(server) {
        server.ext("onPreResponse", async (request, h) => {
            const statusCode = request.response.output
                ? request.response.output.statusCode
                : request.response.statusCode;

            if (statusCode !== 404 || request.path === "/") {
                return h.continue;
            }

            try {
                const { pathname, origin, search } = request.url;

                const path: string = pathname.replace(/\/+$/g, "");

                const { statusCode } = await wreck.request("head", path, { baseUrl: origin });

                if (statusCode < 400) {
                    return h.redirect(`${origin}${search ? path + search : path}`).permanent();
                }
            } catch {
                //
            }

            return h.continue;
        });
    },
};
