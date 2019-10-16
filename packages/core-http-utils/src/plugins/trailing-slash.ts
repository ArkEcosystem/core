import wreck from "@hapi/wreck";

const slashPattern: RegExp = new RegExp(/\/+$/g);

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

            const { pathname, origin, search } = request.url;

            if (!slashPattern.test(pathname)) {
                return h.continue;
            }

            try {
                const path: string = pathname.replace(slashPattern, "");

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
