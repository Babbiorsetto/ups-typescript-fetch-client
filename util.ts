import { GenerateTokenSuccessResponse } from "./authentication";

export function isTokenExpired(
    token: GenerateTokenSuccessResponse,
    deltaMillis = 0
) {
    const tokenExpirationMillis =
        new Date(parseInt(token.issued_at!)).valueOf() +
        parseInt(token.expires_in!) * 1000;
    return tokenExpirationMillis - deltaMillis <= Date.now();
}
