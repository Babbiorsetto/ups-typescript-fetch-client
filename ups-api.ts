import { ClientCredentialsConfigurationParams } from "./configuration";
import * as authenticationApi from "./authentication";
import * as ratingApi from "./rating";
import * as shippingApi from "./shipping";
import { isTokenExpired } from "./util";

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
            return { new: false, api: api };
        }
        api = new classConstructor(
            { accessToken: this._getToken.bind(this) },
            this.baseURL
        );
        this.apis.set(classConstructor, api);
        return { new: true, api: api };
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

    async _checkAndRefreshToken() {
        // first time token is undefined
        // otherwise check if it's expired or near expiration
        if (!this.cachedToken || isTokenExpired(this.cachedToken, 10000)) {
            const tokenResponse = await this.authenticationApi.generateToken(
                "client_credentials"
            );
            this.cachedToken = tokenResponse;
        }
    }

    public rating(): ratingApi.DefaultApi {
        const apiInfo = this._getApi(ratingApi.DefaultApi) as {
            new: boolean;
            api: ratingApi.DefaultApi;
        };
        const api = apiInfo.api;
        if (apiInfo.new) {
            api.rate = this._wrapWithAuthentication(api.rate);
        }
        return api;
    }

    public shipping(): shippingApi.DefaultApi {
        const apiInfo = this._getApi(shippingApi.DefaultApi) as {
            new: boolean;
            api: shippingApi.DefaultApi;
        };
        const api = apiInfo.api;
        if (apiInfo.new) {
            api.shipment = this._wrapWithAuthentication(api.shipment);
            api.voidShipment = this._wrapWithAuthentication(api.voidShipment);
            api.labelRecovery = this._wrapWithAuthentication(api.labelRecovery);
        }
        return api;
    }
}
