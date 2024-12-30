// __tests__/collections.test.ts
import { ColiVara } from "../client";
import axios from "axios";
import { CollectionOut } from "../api";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("Collections API", () => {
  let client: ColiVara;
  const API_KEY = "test-api-key";

  beforeEach(() => {
    client = new ColiVara(API_KEY);
    jest.clearAllMocks();
  });

  describe("createCollection", () => {
    const mockCollection: CollectionOut = {
      id: 1, // Added id
      name: "test-collection",
      metadata: { key: "value" },
      num_documents: 0, // Added num_documents
    };

    it("should create a collection successfully", async () => {
      mockedAxios.request.mockResolvedValueOnce({ data: mockCollection });

      const result = await client.createCollection({
        name: "test-collection",
        metadata: { key: "value" },
      });

      expect(result).toEqual(mockCollection);
    });

    it("should handle API errors properly", async () => {
      const errorResponse = new Error("Request failed with status code 400");
      (errorResponse as any).isAxiosError = true;
      (errorResponse as any).response = {
        status: 400,
        data: { detail: "Invalid collection name" },
      };
      mockedAxios.request.mockRejectedValueOnce(errorResponse);

      await expect(
        client.createCollection({ name: "invalid name" })
      ).rejects.toThrow("Request failed with status code 400");
    });

    it("should create a collection with default empty metadata", async () => {
      mockedAxios.request.mockResolvedValueOnce({
        data: { ...mockCollection, metadata: {} },
      });

      const result = await client.createCollection({ name: "test-collection" });
      expect(result.metadata).toEqual({});
    });
  });

  describe("getCollection", () => {
    const mockCollection: CollectionOut = {
      id: 1,
      name: "test-collection",
      metadata: {},
      num_documents: 0,
    };

    it("should get a collection successfully", async () => {
      mockedAxios.request.mockResolvedValueOnce({ data: mockCollection });

      const result = await client.getCollection({
        collection_name: "test-collection",
      });

      expect(result).toEqual(mockCollection);
    });

    it("should handle collection not found error", async () => {
      const errorResponse = new Error("Request failed with status code 404");
      (errorResponse as any).isAxiosError = true;
      (errorResponse as any).response = {
        status: 404,
        data: { detail: "Collection not found" },
      };
      mockedAxios.request.mockRejectedValueOnce(errorResponse);

      await expect(
        client.getCollection({ collection_name: "non-existent" })
      ).rejects.toThrow("Request failed with status code 404");
    });
  });

  describe("listCollections", () => {
    const mockCollections: CollectionOut[] = [
      {
        id: 1,
        name: "collection-1",
        metadata: {},
        num_documents: 0,
      },
      {
        id: 2,
        name: "collection-2",
        metadata: { key: "value" },
        num_documents: 5,
      },
    ];

    it("should list all collections successfully", async () => {
      mockedAxios.request.mockResolvedValueOnce({ data: mockCollections });

      const result = await client.listCollections();
      expect(result).toEqual(mockCollections);
    });

    it("should return empty array when no collections exist", async () => {
      mockedAxios.request.mockResolvedValueOnce({ data: [] });

      const result = await client.listCollections();
      expect(result).toEqual([]);
    });

    // For listCollections error test
    it("should handle API errors", async () => {
      const errorResponse = new Error("Request failed with status code 500");
      (errorResponse as any).isAxiosError = true;
      (errorResponse as any).response = {
        status: 500,
        data: { detail: "Internal server error" },
      };
      mockedAxios.request.mockRejectedValueOnce(errorResponse);

      await expect(client.listCollections()).rejects.toThrow(
        "Request failed with status code 500"
      );
    });
  });

  describe("deleteCollection", () => {
    it("should delete a collection successfully", async () => {
      mockedAxios.request.mockResolvedValueOnce({ data: null });

      await expect(
        client.deleteCollection({ collection_name: "test-collection" })
      ).resolves.not.toThrow();
    });

    it("should handle deletion of non-existent collection", async () => {
      const errorResponse = new Error("Request failed with status code 404");
      (errorResponse as any).isAxiosError = true;
      (errorResponse as any).response = {
        status: 404,
        data: { detail: "Collection not found" },
      };
      mockedAxios.request.mockRejectedValueOnce(errorResponse);

      await expect(
        client.deleteCollection({ collection_name: "non-existent" })
      ).rejects.toThrow("Request failed with status code 404");
    });

    it("should handle API errors during deletion", async () => {
      const errorResponse = new Error("Request failed with status code 500");
      (errorResponse as any).isAxiosError = true;
      (errorResponse as any).response = {
        status: 500,
        data: { detail: "Internal server error" },
      };
      mockedAxios.request.mockRejectedValueOnce(errorResponse);

      await expect(
        client.deleteCollection({ collection_name: "test-collection" })
      ).rejects.toThrow("Request failed with status code 500");
    });
  });
  describe("partialUpdateCollection", () => {
    const initialCollection: CollectionOut = {
      id: 1,
      name: "test-collection",
      metadata: { key: "value" },
      num_documents: 0,
    };

    it("should update collection name successfully", async () => {
      const updatedCollection = {
        ...initialCollection,
        name: "new-name",
      };
      mockedAxios.request.mockResolvedValueOnce({ data: updatedCollection });

      const result = await client.partialUpdateCollection({
        collection_name: "test-collection",
        name: "new-name",
      });

      expect(result).toEqual(updatedCollection);
    });

    it("should update collection metadata successfully", async () => {
      const updatedCollection = {
        ...initialCollection,
        metadata: { new_key: "new_value" },
      };
      mockedAxios.request.mockResolvedValueOnce({ data: updatedCollection });

      const result = await client.partialUpdateCollection({
        collection_name: "test-collection",
        metadata: { new_key: "new_value" },
      });

      expect(result).toEqual(updatedCollection);
    });

    it("should update both name and metadata successfully", async () => {
      const updatedCollection = {
        ...initialCollection,
        name: "new-name",
        metadata: { new_key: "new_value" },
      };
      mockedAxios.request.mockResolvedValueOnce({ data: updatedCollection });

      const result = await client.partialUpdateCollection({
        collection_name: "test-collection",
        name: "new-name",
        metadata: { new_key: "new_value" },
      });

      expect(result).toEqual(updatedCollection);
    });

    it("should handle update with no changes", async () => {
      mockedAxios.request.mockResolvedValueOnce({ data: initialCollection });

      const result = await client.partialUpdateCollection({
        collection_name: "test-collection",
      });

      expect(result).toEqual(initialCollection);
    });

    it("should handle collection not found error", async () => {
      const errorResponse = new Error("Request failed with status code 404");
      (errorResponse as any).isAxiosError = true;
      (errorResponse as any).response = {
        status: 404,
        data: { detail: "Collection not found" },
      };
      mockedAxios.request.mockRejectedValueOnce(errorResponse);

      await expect(
        client.partialUpdateCollection({
          collection_name: "non-existent",
          name: "new-name",
        })
      ).rejects.toThrow("Request failed with status code 404");
    });

    it("should handle validation error", async () => {
      const errorResponse = new Error("Request failed with status code 400");
      (errorResponse as any).isAxiosError = true;
      (errorResponse as any).response = {
        status: 400,
        data: { detail: "Invalid collection name format" },
      };
      mockedAxios.request.mockRejectedValueOnce(errorResponse);

      await expect(
        client.partialUpdateCollection({
          collection_name: "test-collection",
          name: "invalid@name",
        })
      ).rejects.toThrow("Request failed with status code 400");
    });

    it("should handle server error", async () => {
      const errorResponse = new Error("Request failed with status code 500");
      (errorResponse as any).isAxiosError = true;
      (errorResponse as any).response = {
        status: 500,
        data: { detail: "Internal server error" },
      };
      mockedAxios.request.mockRejectedValueOnce(errorResponse);

      await expect(
        client.partialUpdateCollection({
          collection_name: "test-collection",
          metadata: { new_key: "new_value" },
        })
      ).rejects.toThrow("Request failed with status code 500");
    });
  });
});
