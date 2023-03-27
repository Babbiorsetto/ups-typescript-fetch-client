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

    it("Caches sub-apis to only create one instance", () => {
        const rating1 = api.rating();
        const rating2 = api.rating();
        expect(rating1).toBe(rating2);
    });
});
