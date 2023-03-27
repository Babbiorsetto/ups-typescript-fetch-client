import { ClientCredentialsConfigurationParams } from "./configuration";
import * as ratingApi from "./rating";
import * as shippingApi from "./shipping";

type ApiConstructorsType =
    | typeof ratingApi.DefaultApi
    | typeof shippingApi.DefaultApi;
type ApiType = ratingApi.DefaultApi | shippingApi.DefaultApi;

export class UPSApi {
    private configuration: ClientCredentialsConfigurationParams;
    private baseURL: string;
    private apis = new Map<ApiConstructorsType, ApiType>();

    constructor(
        configuration: ClientCredentialsConfigurationParams,
        baseURL: string
    ) {
        this.configuration = configuration;
        this.baseURL = baseURL;
    }

    _getApi(classConstructor: ApiConstructorsType) {
        let api = this.apis.get(classConstructor);
        if (api) {
            return api;
        }
        api = new classConstructor({ accessToken: "abc" }, this.baseURL);
        this.apis.set(classConstructor, api);
        return api;
    }

    public rating(): ratingApi.DefaultApi {
        return this._getApi(ratingApi.DefaultApi) as ratingApi.DefaultApi;
    }

    public shipping(): shippingApi.DefaultApi {
        return this._getApi(shippingApi.DefaultApi) as shippingApi.DefaultApi;
    }
}
