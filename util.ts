import { GenerateTokenSuccessResponse } from "./authentication";

export function isTokenExpired(
    token: GenerateTokenSuccessResponse,
    deltaMillis = 0
) {
    const tokenExpirationMillis =
        new Date(token.issuedAt!).valueOf() + parseInt(token.expiresIn!) * 1000;
    return tokenExpirationMillis - deltaMillis <= Date.now();
}
