// __tests__/client.test.ts
import { ColiVara } from "../client";
import { Configuration } from "../configuration";

jest.mock("../configuration");

describe("ColiVara Client", () => {
  const API_KEY = "test-api-key";
  const BASE_URL = "https://api.colivara.com";

  it("should initialize with default base URL", () => {
    const client = new ColiVara(API_KEY);
    expect(Configuration).toHaveBeenCalledWith({
      basePath: BASE_URL,
      accessToken: API_KEY,
    });
  });

  it("should initialize with custom base URL", () => {
    const customUrl = "https://custom.api.com";
    const client = new ColiVara(API_KEY, customUrl);
    expect(Configuration).toHaveBeenCalledWith({
      basePath: customUrl,
      accessToken: API_KEY,
    });
  });
});
