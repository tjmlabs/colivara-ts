// __tests__/embeddings.test.ts
import { ColiVara } from "../client";
import axios from "axios";
import { EmbeddingsOut, TaskEnum } from "../api";
import * as fs from "fs";

jest.mock("axios");
jest.mock("fs", () => ({
  promises: {
    readFile: jest.fn(),
    stat: jest.fn(),
  },
}));

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedFs = fs.promises as jest.Mocked<typeof fs.promises>;

describe("Embeddings API", () => {
  let client: ColiVara;
  const API_KEY = "test-api-key";

  beforeEach(() => {
    client = new ColiVara(API_KEY);
    jest.clearAllMocks();
  });

  const mockEmbeddingsResponse: EmbeddingsOut = {
    data: [{ embedding: [0.1, 0.2, 0.3] }],
    model: "test-model",
    usage: {
      prompt_tokens: 10,
      total_tokens: 10,
    },
  };

  describe("createEmbedding", () => {
    it("should create embeddings for a single query string", async () => {
      mockedAxios.request.mockResolvedValueOnce({
        data: mockEmbeddingsResponse,
      });

      const result = await client.createEmbedding({
        input_data: "what is 1+1?",
        task: TaskEnum.Query,
      });

      expect(result).toEqual(mockEmbeddingsResponse);
      expect(mockedAxios.request).toHaveBeenCalledWith({
        method: "POST",
        url: "https://api.colivara.com/v1/embeddings/",
        headers: {
          Authorization: "Bearer test-api-key",
          "Content-Type": "application/json",
        },
        data: expect.any(String),
      });

      const parsedData = JSON.parse(
        (mockedAxios.request.mock.calls[0][0] as any).data
      );
      expect(parsedData).toEqual({
        input_data: ["what is 1+1?"],
        task: "query",
      });
    });

    it("should create embeddings for multiple query strings", async () => {
      mockedAxios.request.mockResolvedValueOnce({
        data: mockEmbeddingsResponse,
      });

      const result = await client.createEmbedding({
        input_data: ["query1", "query2"],
        task: TaskEnum.Query,
      });

      expect(result).toEqual(mockEmbeddingsResponse);
      const parsedData = JSON.parse(
        (mockedAxios.request.mock.calls[0][0] as any).data
      );
      expect(parsedData).toEqual({
        input_data: ["query1", "query2"],
        task: "query",
      });
    });

    it("should create embeddings for image files", async () => {
      const mockBase64 = "base64EncodedImage";
      mockedFs.readFile.mockResolvedValue(Buffer.from("test image"));
      mockedFs.stat.mockResolvedValue({ isFile: () => true } as any);
      mockedAxios.request.mockResolvedValueOnce({
        data: mockEmbeddingsResponse,
      });

      const result = await client.createEmbedding({
        input_data: ["image1.jpg", "image2.jpg"],
        task: TaskEnum.Image,
      });

      expect(result).toEqual(mockEmbeddingsResponse);
      expect(mockedFs.readFile).toHaveBeenCalledTimes(2);
    });

    it("should handle string task parameter", async () => {
      mockedAxios.request.mockResolvedValueOnce({
        data: mockEmbeddingsResponse,
      });

      const result = await client.createEmbedding({
        input_data: "test query",
        task: "query",
      });

      expect(result).toEqual(mockEmbeddingsResponse);
    });

    it("should throw error for invalid task", async () => {
      await expect(
        client.createEmbedding({
          input_data: "test",
          task: "invalid_task",
        })
      ).rejects.toThrow(
        "Invalid task: invalid_task. Must be 'query' or 'image'."
      );
    });

    it("should handle API errors", async () => {
      const error = new Error("API Error");
      error.message = "Request failed with status code 500";
      (error as any).isAxiosError = true;
      (error as any).response = {
        status: 500,
        data: { detail: "Internal server error" },
      };
      mockedAxios.request.mockRejectedValueOnce(error);

      await expect(
        client.createEmbedding({
          input_data: "test query",
          task: TaskEnum.Query,
        })
      ).rejects.toThrow("Request failed with status code 500");
    });

    it("should handle non-file paths for image task", async () => {
      const base64Data = "base64EncodedImageData";
      mockedFs.stat.mockRejectedValue(new Error("Not a file"));
      mockedAxios.request.mockResolvedValueOnce({
        data: mockEmbeddingsResponse,
      });

      const result = await client.createEmbedding({
        input_data: base64Data,
        task: TaskEnum.Image,
      });

      expect(result).toEqual(mockEmbeddingsResponse);
      const parsedData = JSON.parse(
        (mockedAxios.request.mock.calls[0][0] as any).data
      );
      expect(parsedData).toEqual({
        input_data: [base64Data],
        task: "image",
      });
    });

    it("should use query task by default when no task is specified", async () => {
      mockedAxios.request.mockResolvedValueOnce({
        data: mockEmbeddingsResponse,
      });

      const result = await client.createEmbedding({
        input_data: "test query",
      });

      expect(result).toEqual(mockEmbeddingsResponse);
      const parsedData = JSON.parse(
        (mockedAxios.request.mock.calls[0][0] as any).data
      );
      expect(parsedData).toEqual({
        input_data: ["test query"],
        task: "query",
      });
    });
  });
});
