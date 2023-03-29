import { GenerateTokenSuccessResponse } from "./authentication";
import { isTokenExpired } from "./util";

describe("util", () => {
    describe("isTokenExpired", () => {
        let token: GenerateTokenSuccessResponse;

        beforeEach(() => {
            token = {
                issued_at: new Date().valueOf().toString(),
                expires_in: "3600",
            };
        });

        it("Returns true if a token is expired", () => {
            const millisecondsAgo = 30 * 1000;
            token = {
                issued_at: new Date(Date.now() - millisecondsAgo)
                    .valueOf()
                    .toString(),
                expires_in: "15",
            };
            expect(isTokenExpired(token)).toBe(true);
        });

        it("Returns false if a token is not expired", () => {
            expect(isTokenExpired(token)).toBe(false);
        });

        it("Returns true if the remaining time on a token is less than deltaMillis", () => {
            token.expires_in = "10";
            expect(isTokenExpired(token, 10000)).toBe(true);
        });

        it("Returns false if the token still has time left, including the delta", () => {
            token.expires_in = "10";
            expect(isTokenExpired(token, 9000)).toBe(false);
        });
    });
});
