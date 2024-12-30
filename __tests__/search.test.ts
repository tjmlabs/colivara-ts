// __tests__/search.test.ts
import { ColiVara } from "../client";
import axios from "axios";
import { QueryOut, PageOutQuery } from "../api";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("Search API", () => {
  let client: ColiVara;
  const API_KEY = "test-api-key";

  beforeEach(() => {
    client = new ColiVara(API_KEY);
    jest.clearAllMocks();
  });

  const mockPageOutQuery: PageOutQuery = {
    collection_name: "test-collection",
    collection_id: 1,
    collection_metadata: { category: "test" },
    document_name: "test-document",
    document_id: 1,
    document_metadata: { type: "pdf" },
    page_number: 1,
    raw_score: 0.95,
    normalized_score: 0.85,
    img_base64: "base64_encoded_image_data",
  };

  const mockSearchResponse: QueryOut = {
    query: "test query",
    results: [mockPageOutQuery],
  };

  describe("search", () => {
    it("should perform a basic search with default parameters", async () => {
      mockedAxios.request.mockResolvedValueOnce({ data: mockSearchResponse });

      const result = await client.search({
        query: "test query",
      });

      expect(result).toEqual(mockSearchResponse);
      expect(result.results[0]).toHaveProperty("collection_id");
      expect(result.results[0]).toHaveProperty("document_id");
      expect(result.results[0]).toHaveProperty("normalized_score");
      expect(result.results[0]).toHaveProperty("raw_score");
      expect(mockedAxios.request).toHaveBeenCalledWith({
        method: "POST",
        url: "https://api.colivara.com/v1/search/",
        headers: {
          Authorization: "Bearer test-api-key",
          "Content-Type": "application/json",
        },
        data: JSON.stringify({
          query: "test query",
          collection_name: "all",
          top_k: 3,
          query_filter: undefined,
        }),
      });
    });

    it("should search with specific collection and custom top_k", async () => {
      const customResponse: QueryOut = {
        query: "test query",
        results: Array(5).fill({
          ...mockPageOutQuery,
          document_id: 1,
          collection_id: 1,
        }),
      };

      mockedAxios.request.mockResolvedValueOnce({ data: customResponse });

      const result = await client.search({
        query: "test query",
        collection_name: "custom-collection",
        top_k: 5,
      });

      expect(result).toEqual(customResponse);
      expect(result.results).toHaveLength(5);
      expect(result.results[0]).toHaveProperty("img_base64");
      expect(result.results[0]).toHaveProperty("collection_metadata");
      expect(result.results[0]).toHaveProperty("document_metadata");
      expect(mockedAxios.request).toHaveBeenCalledWith({
        method: "POST",
        url: "https://api.colivara.com/v1/search/",
        headers: {
          Authorization: "Bearer test-api-key",
          "Content-Type": "application/json",
        },
        data: JSON.stringify({
          query: "test query",
          collection_name: "custom-collection",
          top_k: 5,
          query_filter: undefined,
        }),
      });
    });

    it("should search with document metadata filter", async () => {
      const filteredResponse: QueryOut = {
        query: "test query",
        results: [
          {
            ...mockPageOutQuery,
            document_metadata: { type: "pdf" },
          },
        ],
      };

      mockedAxios.request.mockResolvedValueOnce({ data: filteredResponse });

      const result = await client.search({
        query: "test query",
        query_filter: {
          on: "document",
          key: "type",
          value: "pdf",
          lookup: "key_lookup",
        },
      });

      expect(result).toEqual(filteredResponse);
      expect(result.results[0].document_metadata).toEqual({ type: "pdf" });

      const mockCall = (mockedAxios.request as jest.Mock).mock.calls[0][0];
      const calledData = JSON.parse(mockCall.data);

      expect(calledData).toEqual({
        query: "test query",
        collection_name: "all",
        top_k: 3,
        query_filter: {
          on: "document",
          key: "type",
          value: "pdf",
          lookup: "key_lookup",
        },
      });
    });
    it("should search with collection metadata filter", async () => {
      const filteredResponse: QueryOut = {
        query: "test query",
        results: [
          {
            ...mockPageOutQuery,
            collection_metadata: { tags: ["tag1", "tag2"] },
          },
        ],
      };

      mockedAxios.request.mockResolvedValueOnce({ data: filteredResponse });

      const result = await client.search({
        query: "test query",
        query_filter: {
          on: "collection",
          key: ["tag1", "tag2"],
          lookup: "has_any_keys",
        },
      });

      expect(result).toEqual(filteredResponse);
      expect(result.results[0].collection_metadata).toEqual({
        tags: ["tag1", "tag2"],
      });

      const mockCall = (mockedAxios.request as jest.Mock).mock.calls[0][0];
      const calledData = JSON.parse(mockCall.data);

      expect(calledData).toEqual({
        query: "test query",
        collection_name: "all",
        top_k: 3,
        query_filter: {
          on: "collection",
          key: ["tag1", "tag2"],
          value: "",
          lookup: "has_any_keys",
        },
      });
    });

    it("should handle empty search results", async () => {
      const emptyResponse: QueryOut = {
        query: "test query",
        results: [],
      };

      mockedAxios.request.mockResolvedValueOnce({ data: emptyResponse });

      const result = await client.search({
        query: "test query",
      });

      expect(result.results).toHaveLength(0);
      expect(result).toEqual(emptyResponse);
    });

    it("should verify score properties in results", async () => {
      mockedAxios.request.mockResolvedValueOnce({ data: mockSearchResponse });

      const result = await client.search({
        query: "test query",
      });

      expect(result.results[0]).toHaveProperty("raw_score");
      expect(result.results[0]).toHaveProperty("normalized_score");
      expect(typeof result.results[0].raw_score).toBe("number");
      expect(typeof result.results[0].normalized_score).toBe("number");
    });

    it("should handle bad request errors", async () => {
      const error = new Error("API Error");
      (error as any).isAxiosError = true;
      (error as any).response = {
        status: 400,
        data: { detail: "Invalid query parameter" },
      };
      mockedAxios.request.mockRejectedValueOnce(error);

      await expect(
        client.search({
          query: "test query",
        })
      ).rejects.toThrow("API Error");
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
        client.search({
          query: "test query",
        })
      ).rejects.toThrow("Server Error");
    });

    it("should handle network errors", async () => {
      const error = new Error("Network Error");
      (error as any).isAxiosError = true;
      mockedAxios.request.mockRejectedValueOnce(error);

      await expect(
        client.search({
          query: "test query",
        })
      ).rejects.toThrow("Network Error");
    });
  });
});
