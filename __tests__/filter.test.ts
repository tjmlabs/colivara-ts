// __tests__/filter.test.ts
import { ColiVara } from "../client";
import axios from "axios";
import { DocumentOut, CollectionOut, PageOut } from "../api";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

type FilterResponse = {
  data: Array<{
    documents?: DocumentOut[];
    collections?: CollectionOut[];
  }>;
};

describe("Filter API", () => {
  let client: ColiVara;
  const API_KEY = "test-api-key";

  beforeEach(() => {
    client = new ColiVara(API_KEY);
    jest.clearAllMocks();
  });

  const mockDocumentResponse: FilterResponse = {
    data: [
      {
        documents: [
          {
            id: 1,
            name: "test-document",
            metadata: { key: "value" },
            url: "https://example.com/doc.pdf",
            num_pages: 2,
            collection_name: "test-collection",
            pages: null,
          },
        ],
        collections: [],
      },
    ],
  };

  const mockCollectionResponse: FilterResponse = {
    data: [
      {
        documents: [],
        collections: [
          {
            id: 1,
            name: "test-collection",
            metadata: { key: "value" },
            num_documents: 1,
          },
        ],
      },
    ],
  };

  describe("filter", () => {
    it("should filter documents with key_lookup", async () => {
      mockedAxios.request.mockResolvedValueOnce({ data: mockDocumentResponse });

      const result = await client.filter({
        query_filter: {
          on: "document",
          key: "metadata.key",
          value: "value",
          lookup: "key_lookup",
        },
      });

      expect(result).toEqual(mockDocumentResponse);
      expect(mockedAxios.request).toHaveBeenCalledWith({
        method: "POST",
        url: "https://api.colivara.com/v1/filter/",
        headers: {
          Authorization: "Bearer test-api-key",
          "Content-Type": "application/json",
        },
        data: JSON.stringify({
          key: "metadata.key",
          value: "value",
          lookup: "key_lookup",
          on: "document",
        }),
      });
    });

    it("should filter collections with contains lookup", async () => {
      mockedAxios.request.mockResolvedValueOnce({
        data: mockCollectionResponse,
      });

      const result = await client.filter({
        query_filter: {
          on: "collection",
          key: ["tag1", "tag2"],
          value: "tag1",
          lookup: "contains",
        },
      });

      expect(result).toEqual(mockCollectionResponse);
      const expectedData = {
        key: ["tag1", "tag2"],
        value: "tag1",
        lookup: "contains",
        on: "collection",
      };
      expect(mockedAxios.request).toHaveBeenCalledWith({
        method: "POST",
        url: "https://api.colivara.com/v1/filter/",
        headers: {
          Authorization: "Bearer test-api-key",
          "Content-Type": "application/json",
        },
        data: JSON.stringify(expectedData),
      });
    });

    it("should handle expanded pages", async () => {
      const responseWithPages: FilterResponse = {
        data: [
          {
            documents: [
              {
                id: 1,
                name: "test-document",
                metadata: { key: "value" },
                url: "https://example.com/doc.pdf",
                num_pages: 2,
                collection_name: "test-collection",
                pages: [
                  {
                    document_name: "test-document",
                    img_base64: "base64_encoded_image_content",
                    page_number: 1,
                  } as PageOut,
                ],
              },
            ],
            collections: [],
          },
        ],
      };

      mockedAxios.request.mockResolvedValueOnce({ data: responseWithPages });

      const result = await client.filter({
        query_filter: {
          key: "metadata.key",
          value: "value",
          lookup: "key_lookup",
        },
        expand: "pages",
      });

      expect(result).toEqual(responseWithPages);
      expect(mockedAxios.request).toHaveBeenCalledWith({
        method: "POST",
        url: "https://api.colivara.com/v1/filter/?expand=pages", // Changed to match actual implementation
        headers: {
          Authorization: "Bearer test-api-key",
          "Content-Type": "application/json",
        },
        data: JSON.stringify({
          key: "metadata.key",
          value: "value",
          lookup: "key_lookup",
        }),
      });
    });

    it("should handle missing value with empty string default", async () => {
      mockedAxios.request.mockResolvedValueOnce({ data: mockDocumentResponse });

      const result = await client.filter({
        query_filter: {
          key: "metadata.key",
          lookup: "has_key",
        },
      });

      expect(result).toEqual(mockDocumentResponse);
      expect(mockedAxios.request).toHaveBeenCalledWith({
        method: "POST",
        url: "https://api.colivara.com/v1/filter/",
        headers: {
          Authorization: "Bearer test-api-key",
          "Content-Type": "application/json",
        },
        data: JSON.stringify({
          key: "metadata.key",
          value: "",
          lookup: "has_key",
        }),
      });
    });

    it("should handle API errors", async () => {
      const error = new Error("API Error (500): Internal server error");
      error.message = "API Error (500): Internal server error";
      (error as any).isAxiosError = true;
      (error as any).response = {
        status: 500,
        data: { detail: "Internal server error" },
      };
      mockedAxios.request.mockRejectedValueOnce(error);

      await expect(
        client.filter({
          query_filter: {
            key: "test",
            lookup: "key_lookup",
          },
        })
      ).rejects.toThrow("API Error (500): Internal server error");
    });

    it("should handle all lookup types", async () => {
      const lookupTypes = [
        "key_lookup",
        "contains",
        "contained_by",
        "has_key",
        "has_keys",
        "has_any_keys",
      ];

      for (const lookup of lookupTypes) {
        mockedAxios.request.mockResolvedValueOnce({
          data: mockDocumentResponse,
        });

        const result = await client.filter({
          query_filter: {
            key: "test",
            lookup: lookup as any,
            value: "test",
          },
        });

        expect(result).toEqual(mockDocumentResponse);
        expect(mockedAxios.request).toHaveBeenCalledWith({
          method: "POST",
          url: "https://api.colivara.com/v1/filter/",
          headers: {
            Authorization: "Bearer test-api-key",
            "Content-Type": "application/json",
          },
          data: JSON.stringify({
            key: "test",
            value: "test",
            lookup: lookup,
          }),
        });
      }
    });
  });
});
