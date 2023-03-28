import { ClientCredentialsConfigurationParams } from "./configuration";
import * as authenticationApi from "./authentication";
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
    private authenticationApi: authenticationApi.DefaultApi;
    private cachedToken: authenticationApi.GenerateTokenSuccessResponse;

    constructor(
        configuration: ClientCredentialsConfigurationParams,
        baseURL: string
    ) {
        this.configuration = configuration;
        this.baseURL = baseURL;
        this.authenticationApi = new authenticationApi.DefaultApi(
            {
                username: configuration.client_id,
                password: configuration.client_secret,
            },
            baseURL
        );
    }

    _getApi(classConstructor: ApiConstructorsType) {
        let api = this.apis.get(classConstructor);
        if (api) {
            return api;
        }
        api = new classConstructor(
            { accessToken: this._getToken.bind(this) },
            this.baseURL
        );
        this.apis.set(classConstructor, api);
        return api;
    }

    _getToken(): string {
        return this.cachedToken.accessToken!;
    }

    _wrapWithAuthentication<ArgsType extends any[], Return>(
        func: (...args: ArgsType) => Promise<Return>
    ): (...args: ArgsType) => Promise<Return> {
        return async (...params) => {
            await this._checkAndRefreshToken();
            // @ts-ignore
            return func(params);
        };
    }

    async _checkAndRefreshToken() {}

    public rating(): ratingApi.DefaultApi {
        const api = this._getApi(ratingApi.DefaultApi) as ratingApi.DefaultApi;
        api.rate = this._wrapWithAuthentication(api.rate);
        return api;
    }

    public shipping(): shippingApi.DefaultApi {
        const api = this._getApi(
            shippingApi.DefaultApi
        ) as shippingApi.DefaultApi;
        api.shipment = this._wrapWithAuthentication(api.shipment);
        api.voidShipment = this._wrapWithAuthentication(api.voidShipment);
        api.labelRecovery = this._wrapWithAuthentication(api.labelRecovery);
        return api;
    }
}
