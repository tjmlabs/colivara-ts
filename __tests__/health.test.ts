// __tests__/health.test.ts
import { ColiVara } from "../client";
import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("Health API", () => {
  let client: ColiVara;
  const API_KEY = "test-api-key";

  beforeEach(() => {
    client = new ColiVara(API_KEY);
    jest.clearAllMocks();
  });

  describe("checkHealth", () => {
    it("should successfully check API health", async () => {
      mockedAxios.request.mockResolvedValueOnce({
        data: { status: "healthy" },
        status: 200,
        statusText: "OK",
        headers: {},
        config: {} as InternalAxiosRequestConfig,
      });

      const result = await client.checkHealth();

      expect(result).toEqual({ status: "healthy" });
      expect(mockedAxios.request).toHaveBeenCalledWith({
        method: "GET",
        url: "https://api.colivara.com/v1/health/",
        headers: {},
      });
    });

    it("should handle server errors", async () => {
      const error = new Error() as AxiosError;
      error.isAxiosError = true;
      error.message = "Server Error";
      error.response = {
        status: 500,
        data: { detail: "Internal server error" },
        statusText: "Internal Server Error",
        headers: {},
        config: {} as InternalAxiosRequestConfig,
      };

      mockedAxios.request.mockRejectedValue(error);

      try {
        await client.checkHealth();
        fail("Should have thrown an error");
      } catch (err: any) {
        expect(err.message).toBe("Server Error");
      }
    });

    it("should handle network errors", async () => {
      const error = new Error() as AxiosError;
      error.isAxiosError = true;
      error.message = "Network Error";
      error.response = undefined;
      error.config = {} as InternalAxiosRequestConfig;

      mockedAxios.request.mockRejectedValue(error);

      try {
        await client.checkHealth();
        fail("Should have thrown an error");
      } catch (err: any) {
        expect(err.message).toBe("Network Error");
      }
    });

    it("should handle unexpected errors", async () => {
      const unexpectedError = new Error("Unexpected error");
      mockedAxios.request.mockRejectedValue(unexpectedError);

      try {
        await client.checkHealth();
        fail("Should have thrown an error");
      } catch (err: any) {
        expect(err.message).toBe("Unexpected error");
      }
    });

    it("should handle authentication errors", async () => {
      const error = new Error() as AxiosError;
      error.isAxiosError = true;
      error.message = "Unauthorized";
      error.response = {
        status: 401,
        data: { detail: "Invalid API key" },
        statusText: "Unauthorized",
        headers: {},
        config: {} as InternalAxiosRequestConfig,
      };

      mockedAxios.request.mockRejectedValue(error);

      try {
        await client.checkHealth();
        fail("Should have thrown an error");
      } catch (err: any) {
        expect(err.message).toBe("Unauthorized");
      }
    });
  });
});
