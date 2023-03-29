import { ClientCredentialsConfigurationParams } from "./configuration";
import * as authenticationApi from "./authentication";
import * as ratingApi from "./rating";
import * as shippingApi from "./shipping";
import { isTokenExpired } from "./util";
import { URL } from "node:url";

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

    /**
     * The URL for the authentication service is obtained automatically by removing the path from baseURL
     * @param baseURL You probably want https://wwwcie.ups.com/api for testing and https://onlinetools.ups.com/api for production
     */
    constructor(
        configuration: ClientCredentialsConfigurationParams,
        baseURL: string
    ) {
        this.configuration = configuration;
        this.baseURL = baseURL;
        const urlObject = new URL(baseURL);
        this.authenticationApi = new authenticationApi.DefaultApi(
            {
                username: configuration.client_id,
                password: configuration.client_secret,
            },
            urlObject.origin
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
            api.rate = this._wrapWithAuthentication(api.rate.bind(api));
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
            api.shipment = this._wrapWithAuthentication(api.shipment.bind(api));
            api.voidShipment = this._wrapWithAuthentication(
                api.voidShipment.bind(api)
            );
            api.labelRecovery = this._wrapWithAuthentication(
                api.labelRecovery.bind(api)
            );
        }
        return api;
    }
}
