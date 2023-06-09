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
        jest.resetModules();
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
            mockedRatingConstructor.mockImplementation(() => {
                return {
                    rate: jest.fn(),
                };
            });
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

        it("Creates authentication with the correct parameters", () => {
            mockedAuthentication.mockImplementation(() => {});
            const apiConstructor = require("./ups-api").UPSApi as typeof UPSApi;

            const url1 = "https://hello.com/api";
            const url2 = "https://hello.com/api/";
            const url3 = "https://hello.com/api/whatever";
            const credentials = { client_id: "id", client_secret: "secret" };
            new apiConstructor(credentials, url1);
            new apiConstructor(credentials, url2);
            new apiConstructor(credentials, url3);

            const expectedCredentials = { username: "id", password: "secret" };
            const expectedURL = "https://hello.com";
            expect(mockedAuthentication).nthCalledWith(
                1,
                expectedCredentials,
                expectedURL
            );
            expect(mockedAuthentication).nthCalledWith(
                2,
                expectedCredentials,
                expectedURL
            );
            expect(mockedAuthentication).nthCalledWith(
                3,
                expectedCredentials,
                expectedURL
            );
        });
    });

    describe("Automatic authentication", () => {
        let mockGenerateToken: jest.Mock;
        let mockRate: jest.Mock;
        let mockShipment: jest.Mock;

        beforeEach(() => {
            mockGenerateToken = jest.fn();
            mockRate = jest.fn();
            mockShipment = jest.fn();
            jest.doMock("./authentication", () => ({
                DefaultApi: jest.fn(() => ({
                    generateToken: mockGenerateToken,
                })),
            }));
            jest.doMock("./rating", () => ({
                DefaultApi: jest.fn(() => ({
                    rate: mockRate,
                })),
            }));
            jest.doMock("./shipping", () => ({
                DefaultApi: jest.fn(() => ({
                    shipment: mockShipment,
                    voidShipment: jest.fn(),
                    labelRecovery: jest.fn(),
                })),
            }));
        });

        it("Sub-api methods are wrapped in authentication checks", async () => {
            const apiConstructor = require("./ups-api").UPSApi as typeof UPSApi;

            const url = "https://hello.com";
            const credentials = { client_id: "id", client_secret: "secret" };
            const api = new apiConstructor(credentials, url);
            const rating = api.rating();
            await rating.rate({} as any, "v1", "Rate");
            expect(mockGenerateToken).toHaveBeenCalledTimes(1);
            expect(mockRate).toHaveBeenCalledWith({}, "v1", "Rate");
        });

        it("Multiple calls to sub-apis reuse the same token", async () => {
            mockGenerateToken.mockImplementation(async () => ({
                access_token: "abcd",
                issued_at: new Date().valueOf().toString(),
                expires_in: "60",
            }));
            const apiConstructor = require("./ups-api").UPSApi as typeof UPSApi;

            const url = "https://hello.com";
            const credentials = { client_id: "id", client_secret: "secret" };
            const api = new apiConstructor(credentials, url);
            const rating = api.rating();
            const shipping = api.shipping();
            //@ts-ignore
            await rating.rate();
            //@ts-ignore
            await shipping.shipment();
            expect(mockGenerateToken).toHaveBeenCalledTimes(1);
            expect(mockRate).toHaveBeenCalledTimes(1);
            expect(mockShipment).toHaveBeenCalledTimes(1);
        });
    });

    it("Caches sub-apis to only create one instance", () => {
        const rating1 = api.rating();
        const rating2 = api.rating();
        expect(rating1).toBe(rating2);
    });
});
