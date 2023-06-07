# Usage

```typescript
import {
    UPSApi,
    ClientCredentialsConfigurationParams,
} from "@babbiorsetto/ups-typescript-fetch-client";

const config: ClientCredentialsConfigurationParams = {
    client_id: "abc",
    client_secret: "secret",
};
const api = new UPSApi(config, "https://wwwcie.ups.com/api");

const rating = api.rating();

try {
    const resp = await rating.rate(/*All required info*/);
    console.log(JSON.stringify(resp.RateResponse.RatedShipment));
} catch (err) {
    console.log(err);
    // The body of the error message
    const errBody = await err.json();
    console.log(errBody.response.errors);
}
```

Full description of the API in the [official documentation](https://developer.ups.com/en-us)


## Changelog

### v0.0.3
* Add Paperless document api

### v0.0.2
* Add Time in transit api
