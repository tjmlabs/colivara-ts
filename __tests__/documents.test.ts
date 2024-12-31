// __tests__/documents.test.ts
import { ColiVara } from "../client";
import axios from "axios";
import { DocumentOut } from "../api";

jest.mock("axios");
jest.mock("fs/promises");
const mockedAxios = axios as jest.Mocked<typeof axios>;
import fs from "fs"; // Changed from fs/promises
jest.mock("fs", () => ({
  promises: {
    readFile: jest.fn(),
  },
}));
const mockedFs = fs as jest.Mocked<typeof fs>;

describe("Documents API", () => {
  let client: ColiVara;
  const API_KEY = "test-api-key";

  beforeEach(() => {
    client = new ColiVara(API_KEY);
    jest.clearAllMocks();
  });

  const mockDocument: DocumentOut = {
    id: 1,
    name: "test-document",
    metadata: {},
    url: "https://example.com/doc.pdf",
    num_pages: 2,
    collection_name: "default_collection",
    pages: null,
  };

  describe("getDocument", () => {
    it("should get a document successfully", async () => {
      mockedAxios.request.mockResolvedValueOnce({ data: mockDocument });

      const result = await client.getDocument({
        document_name: "test-document",
      });

      expect(result).toEqual(mockDocument);
    });

    it("should get a document with expanded pages", async () => {
      const documentWithPages: DocumentOut = {
        ...mockDocument,
        pages: [
          {
            document_name: "test-document",
            img_base64: "base64_encoded_image_content_1",
            page_number: 1,
          },
          {
            document_name: "test-document",
            img_base64: "base64_encoded_image_content_2",
            page_number: 2,
          },
        ],
      };
      mockedAxios.request.mockResolvedValueOnce({ data: documentWithPages });

      const result = await client.getDocument({
        document_name: "test-document",
        expand: "pages",
      });

      expect(result).toEqual(documentWithPages);
    });

    it("should handle document not found error", async () => {
      const errorResponse = new Error("Request failed with status code 404");
      (errorResponse as any).isAxiosError = true;
      (errorResponse as any).response = {
        status: 404,
        data: { detail: "Document not found" },
      };
      mockedAxios.request.mockRejectedValueOnce(errorResponse);

      await expect(
        client.getDocument({ document_name: "non-existent" })
      ).rejects.toThrow("Request failed with status code 404");
    });
  });

  describe("listDocuments", () => {
    const mockDocuments: DocumentOut[] = [
      {
        id: 1,
        name: "document-1",
        metadata: {},
        url: "https://example.com/doc1.pdf",
        num_pages: 2,
        collection_name: "default_collection",
        pages: null,
      },
      {
        id: 2,
        name: "document-2",
        metadata: { key: "value" },
        url: "https://example.com/doc2.pdf",
        num_pages: 3,
        collection_name: "default_collection",
        pages: null,
      },
    ];

    it("should list all documents successfully", async () => {
      mockedAxios.request.mockResolvedValueOnce({ data: mockDocuments });

      const result = await client.listDocuments();
      expect(result).toEqual(mockDocuments);
    });

    it("should list documents with expanded pages", async () => {
      const documentsWithPages = mockDocuments.map((doc) => ({
        ...doc,
        pages: [
          {
            document_name: doc.name,
            img_base64: "base64_encoded_image_content",
            page_number: 1,
          },
        ],
      }));
      mockedAxios.request.mockResolvedValueOnce({ data: documentsWithPages });

      const result = await client.listDocuments({ expand: "pages" });
      expect(result).toEqual(documentsWithPages);
    });

    it("should return empty array when no documents exist", async () => {
      mockedAxios.request.mockResolvedValueOnce({ data: [] });

      const result = await client.listDocuments();
      expect(result).toEqual([]);
    });

    it("should handle API errors", async () => {
      const errorResponse = new Error("Request failed with status code 500");
      (errorResponse as any).isAxiosError = true;
      (errorResponse as any).response = {
        status: 500,
        data: { detail: "Internal server error" },
      };
      mockedAxios.request.mockRejectedValueOnce(errorResponse);

      await expect(client.listDocuments()).rejects.toThrow(
        "Request failed with status code 500"
      );
    });
  });

  describe("upsertDocument", () => {
    const mockUpsertResponse: DocumentOut = {
      id: 1,
      name: "test-document",
      metadata: {},
      url: "https://example.com/doc.pdf",
      num_pages: 0,
      collection_name: "default_collection",
      pages: null,
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should upsert document from file path successfully", async () => {
      const mockFileContent = Buffer.from("test content");
      // Update the mock to use promises.readFile
      (mockedFs.promises.readFile as jest.Mock).mockResolvedValueOnce(
        mockFileContent
      );
      mockedAxios.request.mockResolvedValueOnce({ data: mockUpsertResponse });

      const result = await client.upsertDocument({
        name: "test-document",
        document_path: "/path/to/document.pdf",
      });

      expect(result).toEqual(mockUpsertResponse);
      expect(mockedFs.promises.readFile).toHaveBeenCalledWith(
        "/path/to/document.pdf"
      );
    });

    it("should handle file not found error", async () => {
      const fileError = new Error(
        "ENOENT: no such file or directory, open '/non-existent.pdf'"
      ) as NodeJS.ErrnoException;
      fileError.code = "ENOENT";
      (mockedFs.promises.readFile as jest.Mock).mockRejectedValueOnce(
        fileError
      );

      await expect(
        client.upsertDocument({
          name: "test-document",
          document_path: "/non-existent.pdf",
        })
      ).rejects.toThrow("The specified file does not exist: /non-existent.pdf");
    });

    it("should handle permission error", async () => {
      const fileError = new Error(
        "EACCES: permission denied, open '/protected.pdf'"
      ) as NodeJS.ErrnoException;
      fileError.code = "EACCES";
      (mockedFs.promises.readFile as jest.Mock).mockRejectedValueOnce(
        fileError
      );

      await expect(
        client.upsertDocument({
          name: "test-document",
          document_path: "/protected.pdf",
        })
      ).rejects.toThrow("No read permission for file: /protected.pdf");
    });

    it("should throw error when no document source is provided", async () => {
      await expect(
        client.upsertDocument({
          name: "test-document",
        })
      ).rejects.toThrow(
        "Either document_url, document_base64, or document_path must be provided."
      );
    });

    it("should upsert document with base64 content successfully", async () => {
      mockedAxios.request.mockResolvedValueOnce({ data: mockUpsertResponse });

      const result = await client.upsertDocument({
        name: "test-document",
        document_base64: "base64content",
      });

      expect(result).toEqual(mockUpsertResponse);
    });

    it("should upsert document with URL successfully", async () => {
      mockedAxios.request.mockResolvedValueOnce({ data: mockUpsertResponse });

      const result = await client.upsertDocument({
        name: "test-document",
        document_url: "https://example.com/document.pdf",
      });

      expect(result).toEqual(mockUpsertResponse);
    });
    it("should handle generic file reading error", async () => {
      // Create a generic error that's not ENOENT or EACCES
      const fileError = new Error(
        "Generic file reading error"
      ) as NodeJS.ErrnoException;
      fileError.code = "UNKNOWN"; // Using a code that's not ENOENT or EACCES

      (mockedFs.promises.readFile as jest.Mock).mockRejectedValueOnce(
        fileError
      );

      await expect(
        client.upsertDocument({
          name: "test-document",
          document_path: "/path/to/file.pdf",
        })
      ).rejects.toThrow("Error reading file: Generic file reading error");
    });

    it("should re-throw non-standard errors during file reading", async () => {
      // Create a non-standard error object
      const nonStandardError = {
        foo: "bar",
        toString: () => "Non-standard error object",
      };

      (mockedFs.promises.readFile as jest.Mock).mockRejectedValueOnce(
        nonStandardError
      );

      await expect(
        client.upsertDocument({
          name: "test-document",
          document_path: "/path/to/file.pdf",
        })
      ).rejects.toBe(nonStandardError); // Use toBe instead of toThrow since we're expecting the exact object
    });
  });

  describe("deleteDocument", () => {
    it("should delete a document successfully", async () => {
      mockedAxios.request.mockResolvedValue({ data: null });

      await client.deleteDocument({ document_name: "test-document" });
      expect(mockedAxios.request).toHaveBeenCalled();
    });

    it("should handle deletion of non-existent document", async () => {
      const error = new Error("Request failed with status code 404");
      (error as any).isAxiosError = true;
      (error as any).response = {
        status: 404,
        data: { detail: "Document not found" },
      };
      mockedAxios.request.mockRejectedValue(error);

      await expect(
        client.deleteDocument({ document_name: "non-existent" })
      ).rejects.toThrow("Request failed with status code 404");
    });
  });

  describe("partialUpdateDocument", () => {
    const updatedDocument: DocumentOut = {
      id: 1,
      name: "new-name",
      metadata: { new_key: "new_value" },
      url: "https://example.com/doc.pdf",
      num_pages: 2,
      collection_name: "default_collection",
      pages: null,
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should update document name successfully", async () => {
      mockedAxios.request.mockResolvedValue({ data: updatedDocument });

      const result = await client.partialUpdateDocument({
        document_name: "test-document",
        name: "new-name",
      });

      expect(result).toEqual(updatedDocument);
    });

    it("should handle document not found error", async () => {
      const error = new Error("Request failed with status code 404");
      (error as any).isAxiosError = true;
      (error as any).response = {
        status: 404,
        data: { detail: "Document not found" },
      };
      mockedAxios.request.mockRejectedValue(error);

      await expect(
        client.partialUpdateDocument({
          document_name: "non-existent",
          name: "new-name",
        })
      ).rejects.toThrow("Request failed with status code 404");
    });
  });
});
