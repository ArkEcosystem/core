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
                const path: string = request.path.replace(/\/+$/g, "");
                const { res } = await wreck.request("head", path);

                if (res.statusCode < 400) {
                    return h.redirect(request.url.search ? path + request.url.search : path).permanent();
                }
            } catch {
                //
            }

            return h.continue;
        });
    },
};
