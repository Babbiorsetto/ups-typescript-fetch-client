import { ClientCredentialsConfigurationParams } from "./";
import type { UPSApi } from "./";

describe("UPSApi", () => {
    let config: ClientCredentialsConfigurationParams;
    let api: UPSApi;

    beforeEach(() => {
        const config: ClientCredentialsConfigurationParams = {
            client_id: "abcd",
            client_secret: "sayItQuiet",
        };
        const UPSApiImported = require("./ups-api").UPSApi;
        api = new UPSApiImported(config, "https://test.domain.com/test");
        // make sure every time a module is required, it is loaded from scratch
        jest.resetModules();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("Can be instantiated", () => {
        expect(api).toBeDefined();
    });

    it("Returns sub-apis from its methods", () => {
        const rating = api.rating();
        const shipping = api.shipping();
        expect(rating).toBeDefined();
        expect(rating.rate).toBeDefined();
        expect(shipping).toBeDefined();
        expect(shipping.shipment).toBeDefined();
    });

    it("Creates sub-apis with the correct URL", () => {
        jest.doMock("./rating", () => ({
            DefaultApi: jest.fn(),
        }));
        const mockedCstr = require("./rating").DefaultApi as jest.Mock;
        mockedCstr.mockImplementation(() => {});
        const apiConstructor = require("./ups-api").UPSApi as typeof UPSApi;

        const url = "https://test.com";
        const api = new apiConstructor(
            {
                client_id: "abcd",
                client_secret: "sayItQuiet",
            },
            url
        );
        api.rating();
        expect(mockedCstr.mock.calls[0][1]).toBe(url);
    });

    it("Caches sub-apis to only create one instance", () => {
        const rating1 = api.rating();
        const rating2 = api.rating();
        expect(rating1).toBe(rating2);
    });
});
