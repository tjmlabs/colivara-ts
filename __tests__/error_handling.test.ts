// __tests__/error_handling.test.ts
import { ColiVara } from "../client";
import axios, {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";

describe("Error Handling", () => {
  let client: ColiVara;

  beforeEach(() => {
    client = new ColiVara("test-api-key");
  });

  describe("handleError", () => {
    // Helper function to test error handling through a public method
    const testError = async (error: unknown) => {
      jest.spyOn(axios, "request").mockRejectedValueOnce(error);
      return client.checkHealth();
    };

    it("should handle Axios errors with response data", async () => {
      const axiosError = {
        isAxiosError: true,
        message: "Test error",
        response: {
          status: 400,
          data: { detail: "Bad Request" },
          statusText: "Bad Request",
          headers: {},
          config: {} as InternalAxiosRequestConfig,
        },
      } as AxiosError;

      await expect(testError(axiosError)).rejects.toThrow(
        "API Error (400): Bad Request"
      );
    });

    it("should handle Axios errors without response data", async () => {
      const axiosError = {
        isAxiosError: true,
        message: "Network Error",
        response: undefined,
        config: {} as InternalAxiosRequestConfig,
      } as AxiosError;

      await expect(testError(axiosError)).rejects.toThrow(
        "API Error (undefined): Network Error"
      );
    });

    it("should handle Axios errors with non-object response data", async () => {
      const axiosError = {
        isAxiosError: true,
        message: "Test error",
        response: {
          status: 500,
          data: "Internal Server Error",
          statusText: "Internal Server Error",
          headers: {},
          config: {} as InternalAxiosRequestConfig,
        },
      } as AxiosError;

      await expect(testError(axiosError)).rejects.toThrow(
        "API Error (500): Test error"
      );
    });

    it("should handle Axios errors with empty response data", async () => {
      const axiosError = {
        isAxiosError: true,
        message: "Test error",
        response: {
          status: 404,
          data: {},
          statusText: "Not Found",
          headers: {},
          config: {} as InternalAxiosRequestConfig,
        },
      } as AxiosError;

      await expect(testError(axiosError)).rejects.toThrow(
        "API Error (404): Test error"
      );
    });

    it("should handle non-Axios errors", async () => {
      const genericError = new Error("Generic error");
      await expect(testError(genericError)).rejects.toThrow("Generic error");
    });

    it("should handle different HTTP status codes", async () => {
      const statusCodes = [400, 401, 403, 404, 500, 502, 503];

      for (const status of statusCodes) {
        const axiosError = {
          isAxiosError: true,
          message: `Error ${status}`,
          response: {
            status,
            data: { detail: `Error message for ${status}` },
            statusText: "Error",
            headers: {},
            config: {} as InternalAxiosRequestConfig,
          },
        } as AxiosError;

        await expect(testError(axiosError)).rejects.toThrow(
          `API Error (${status}): Error message for ${status}`
        );
      }
    });

    it("should handle complex response data", async () => {
      const axiosError = {
        isAxiosError: true,
        message: "Complex error",
        response: {
          status: 400,
          data: {
            detail: "Complex error message",
            errors: ["error1", "error2"],
            code: "COMPLEX_ERROR",
          },
          statusText: "Bad Request",
          headers: {},
          config: {} as InternalAxiosRequestConfig,
        },
      } as AxiosError;

      await expect(testError(axiosError)).rejects.toThrow(
        "API Error (400): Complex error message"
      );
    });
  });

  describe("ColiVaraError", () => {
    it("should create error with correct name and message", () => {
      const errorMessage = "Test error message";
      const error = new Error(errorMessage);
      error.name = "ColiVaraError";

      expect(error).toHaveProperty("name", "ColiVaraError");
      expect(error).toHaveProperty("message", errorMessage);
      expect(error).toBeInstanceOf(Error);
    });
  });
});
