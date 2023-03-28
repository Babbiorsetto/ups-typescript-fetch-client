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

    describe("sub-api parameters", () => {
        let mockedRatingConstructor: jest.Mock;
        let mockedAuthentication: jest.Mock;

        beforeEach(() => {
            jest.doMock("./rating", () => ({
                DefaultApi: jest.fn(),
            }));
            mockedRatingConstructor = require("./rating").DefaultApi;

            jest.doMock("./authentication", () => ({
                DefaultApi: jest.fn(),
            }));
            mockedAuthentication = require("./authentication").DefaultApi;
        });

        it("Creates sub-apis with the correct parameters", () => {
            mockedRatingConstructor.mockImplementation(() => {});
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
            expect(
                mockedRatingConstructor.mock.calls[0][0].accessToken
            ).toBeInstanceOf(Function);
            expect(mockedRatingConstructor.mock.calls[0][1]).toBe(url);
        });

        it("Creates authentication with the corect parameters", () => {
            mockedAuthentication.mockImplementation(() => {});
            const apiConstructor = require("./ups-api").UPSApi as typeof UPSApi;

            const url = "https://hello.com";
            const credentials = { client_id: "id", client_secret: "secret" };
            new apiConstructor(credentials, url);

            expect(mockedAuthentication).toHaveBeenCalledWith(
                { username: "id", password: "secret" },
                url
            );
        });
    });

    it("Caches sub-apis to only create one instance", () => {
        const rating1 = api.rating();
        const rating2 = api.rating();
        expect(rating1).toBe(rating2);
    });
});
