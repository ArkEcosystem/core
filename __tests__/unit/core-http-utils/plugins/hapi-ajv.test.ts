// import "../mocks/validation";
// import "../mocks/boom";
import { Validation } from "@arkecosystem/crypto";
import Hapi from "@hapi/hapi";
import { hapiAjv } from "../../../../packages/core-http-utils/src/plugins/hapi-ajv";

const FakeServer = { ext: jest.fn() };
const server: jest.Mocked<Hapi.Server> = FakeServer as any;

describe("register", () => {
    it("calls 'ext'", async () => {
        await hapiAjv.register(server, {});
        expect(hapiAjv.name).toEqual("hapi-ajv");
        expect(server.ext).toHaveBeenCalled();
        expect(server.ext.mock.calls[0][0].type).toEqual("onPreHandler");
    });
    describe("ext callback", () => {
        let h;
        let request;
        beforeEach(() => {
            hapiAjv.register(server, {});
        });
        it("should continue if no config given", async () => {
            h = { continue: "continue" } as any;
            request = { route: { settings: { plugins: {} } } } as any;
            const validate = jest.spyOn(Validation.validator, "validate");
            const actual = server.ext.mock.calls[0][0].method(request, h);

            expect(validate).not.toBeCalled();
            expect(actual).toEqual("continue");
        });
        it("should payloadSchema", async () => {
            h = { continue: "continue" } as any;
            request = {
                payload: "bar",
                route: { settings: { plugins: { "hapi-ajv": { payloadSchema: "foo" } } } },
            } as any;
            const rtn = [true, [{ dataPath: "dataPath", message: "message" }]] as any;
            const validate = jest.spyOn(Validation.validator, "validate").mockReturnValue(rtn);
            const actual = server.ext.mock.calls[0][0].method(request, h);
            expect(validate).toHaveBeenCalledWith("foo", "bar");
            expect(actual).toEqual("continue");
        });
        /*        
        it("should querySchema", async () => {
            
        });
*/
    });
});
