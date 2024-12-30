// __tests__/webhook.test.ts
import { ColiVara } from "../client";
import axios from "axios";
import { WebhookOut } from "../api";
import { Webhook } from "svix";

jest.mock("axios");
jest.mock("svix");

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("Webhook API", () => {
  let client: ColiVara;
  const API_KEY = "test-api-key";

  beforeEach(() => {
    client = new ColiVara(API_KEY);
    jest.clearAllMocks();
    (Webhook as unknown as jest.Mock).mockClear();
  });

  const mockWebhookResponse: WebhookOut = {
    app_id: "app_123",
    endpoint_id: "endpoint_456",
    webhook_secret: "whsec_789",
  };

  describe("addWebhook", () => {
    it("should successfully add a webhook", async () => {
      mockedAxios.request.mockResolvedValueOnce({ data: mockWebhookResponse });

      const result = await client.addWebhook({
        url: "https://example.com/webhook",
      });

      expect(result).toEqual(mockWebhookResponse);
      expect(mockedAxios.request).toHaveBeenCalledWith({
        method: "POST",
        url: "https://api.colivara.com/v1/webhook/",
        headers: {
          Authorization: "Bearer test-api-key",
          "Content-Type": "application/json",
        },
        data: JSON.stringify({
          url: "https://example.com/webhook",
        }),
      });
    });

    it("should handle invalid URL error", async () => {
      const error = new Error("Invalid URL");
      (error as any).isAxiosError = true;
      (error as any).response = {
        status: 400,
        data: { detail: "Invalid webhook URL provided" },
      };
      mockedAxios.request.mockRejectedValueOnce(error);

      await expect(
        client.addWebhook({
          url: "invalid-url",
        })
      ).rejects.toThrow("Invalid URL");
    });

    it("should handle server errors", async () => {
      const error = new Error("Server Error");
      (error as any).isAxiosError = true;
      (error as any).response = {
        status: 500,
        data: { detail: "Internal server error" },
      };
      mockedAxios.request.mockRejectedValueOnce(error);

      await expect(
        client.addWebhook({
          url: "https://example.com/webhook",
        })
      ).rejects.toThrow("Server Error");
    });

    it("should handle network errors", async () => {
      const error = new Error("Network Error");
      (error as any).isAxiosError = true;
      mockedAxios.request.mockRejectedValueOnce(error);

      await expect(
        client.addWebhook({
          url: "https://example.com/webhook",
        })
      ).rejects.toThrow("Network Error");
    });
  });

  describe("validateWebhook", () => {
    const mockHeaders = {
      "svix-id": "msg_123",
      "svix-timestamp": "1234567890",
      "svix-signature": "v1,signature123",
    };
    const mockPayload = JSON.stringify({ event: "document.upserted" });
    const mockSecret = "whsec_test123";

    it("should return true for valid webhook signature", () => {
      const mockVerify = jest.fn();
      (Webhook as unknown as jest.Mock).mockImplementation(() => ({
        verify: mockVerify,
        key: "mock-key",
        sign: jest.fn(),
        verifyTimestamp: jest.fn(),
      }));

      const result = client.validateWebhook({
        webhook_secret: mockSecret,
        payload: mockPayload,
        headers: mockHeaders,
      });

      expect(result).toBe(true);
      expect(Webhook).toHaveBeenCalledWith(mockSecret);
      expect(mockVerify).toHaveBeenCalledWith(mockPayload, mockHeaders);
    });

    it("should return false for invalid webhook signature", () => {
      const mockVerify = jest.fn().mockImplementation(() => {
        throw new Error("Invalid signature");
      });
      (Webhook as unknown as jest.Mock).mockImplementation(() => ({
        verify: mockVerify,
        key: "mock-key",
        sign: jest.fn(),
        verifyTimestamp: jest.fn(),
      }));

      const result = client.validateWebhook({
        webhook_secret: mockSecret,
        payload: mockPayload,
        headers: mockHeaders,
      });

      expect(result).toBe(false);
      expect(Webhook).toHaveBeenCalledWith(mockSecret);
      expect(mockVerify).toHaveBeenCalledWith(mockPayload, mockHeaders);
    });

    it("should return false for missing headers", () => {
      // No need to mock verify function since we want the validation to fail
      // when headers are empty
      (Webhook as unknown as jest.Mock).mockImplementation(() => ({
        verify: () => {
          // Should throw an error when headers are empty
          throw new Error("Missing required headers");
        },
        key: "mock-key",
        sign: jest.fn(),
        verifyTimestamp: jest.fn(),
      }));

      const result = client.validateWebhook({
        webhook_secret: mockSecret,
        payload: mockPayload,
        headers: {}, // Empty headers should cause validation to fail
      });

      expect(result).toBe(false);
      expect(Webhook).toHaveBeenCalledWith(mockSecret);
    });

    it("should return false for invalid webhook secret", () => {
      const mockVerify = jest.fn().mockImplementation(() => {
        throw new Error("Invalid webhook secret");
      });
      (Webhook as unknown as jest.Mock).mockImplementation(() => ({
        verify: mockVerify,
        key: "mock-key",
        sign: jest.fn(),
        verifyTimestamp: jest.fn(),
      }));

      const result = client.validateWebhook({
        webhook_secret: "invalid_secret",
        payload: mockPayload,
        headers: mockHeaders,
      });

      expect(result).toBe(false);
      expect(Webhook).toHaveBeenCalledWith("invalid_secret");
      expect(mockVerify).toHaveBeenCalledWith(mockPayload, mockHeaders);
    });

    it("should handle unexpected errors during validation", () => {
      (Webhook as unknown as jest.Mock).mockImplementation(() => {
        throw new Error("Unexpected error");
      });

      const result = client.validateWebhook({
        webhook_secret: mockSecret,
        payload: mockPayload,
        headers: mockHeaders,
      });

      expect(result).toBe(false);
      expect(Webhook).toHaveBeenCalledWith(mockSecret);
    });
  });
});
