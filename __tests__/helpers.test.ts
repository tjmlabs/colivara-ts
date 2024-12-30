// __tests__/helpers.test.ts
import { ColiVara } from "../client";
import fs from "fs";
import { FileOut } from "../api";
import axios from "axios";
import mime from "mime-types";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

jest.mock("fs", () => ({
  promises: {
    readFile: jest.fn(),
  },
}));

jest.mock("mime-types", () => ({
  lookup: jest.fn((path) => {
    if (path.endsWith(".pdf")) return "application/pdf";
    return "application/octet-stream";
  }),
}));

global.File = class {
  type: string;
  constructor(
    public bits: BlobPart[],
    public name: string,
    options?: FilePropertyBag
  ) {
    this.type = options?.type || "";
  }
} as any;

global.FormData = class {
  private data: Map<string, any> = new Map();
  append(key: string, value: any) {
    this.data.set(key, value);
  }
  get(key: string) {
    return this.data.get(key);
  }
  getAll() {
    return Array.from(this.data.entries());
  }
} as any;

describe("File Conversion Helpers", () => {
  let client: ColiVara;
  const API_KEY = "test-api-key";

  beforeEach(() => {
    client = new ColiVara(API_KEY);
    jest.clearAllMocks();
  });

  const mockFileOut: FileOut[] = [
    {
      img_base64: "base64_encoded_image_content",
      page_number: 1,
    },
  ];

  describe("fileToBase64", () => {
    it("should convert file to base64 successfully", async () => {
      const testContent = "test content";
      const testBuffer = Buffer.from(testContent);
      const expectedBase64 = testBuffer.toString("base64");

      (fs.promises.readFile as jest.Mock).mockResolvedValueOnce(testBuffer);

      const result = await client.fileToBase64("test.txt");

      expect(result).toBe(expectedBase64);
      expect(fs.promises.readFile).toHaveBeenCalledWith("test.txt");
    });

    it("should handle file not found error", async () => {
      const fileError = new Error(
        "ENOENT: no such file or directory"
      ) as NodeJS.ErrnoException;
      fileError.code = "ENOENT";

      (fs.promises.readFile as jest.Mock).mockRejectedValueOnce(fileError);

      await expect(client.fileToBase64("/non-existent.txt")).rejects.toThrow(
        "The specified file does not exist: /non-existent.txt"
      );
    });

    it("should handle permission denied error", async () => {
      const fileError = new Error(
        "EACCES: permission denied"
      ) as NodeJS.ErrnoException;
      fileError.code = "EACCES";

      (fs.promises.readFile as jest.Mock).mockRejectedValueOnce(fileError);

      await expect(client.fileToBase64("/protected.txt")).rejects.toThrow(
        "No read permission for file: /protected.txt"
      );
    });
  });

  describe("fileToImgbase64", () => {
    it("should convert file to image base64 successfully", async () => {
      const testBuffer = Buffer.from("test content");
      (fs.promises.readFile as jest.Mock).mockResolvedValueOnce(testBuffer);

      mockedAxios.request.mockResolvedValueOnce({
        data: mockFileOut,
      });

      const result = await client.fileToImgbase64("test.pdf");

      expect(result).toEqual(mockFileOut);
      expect(fs.promises.readFile).toHaveBeenCalledWith("test.pdf");
      expect(mockedAxios.request).toHaveBeenCalledWith({
        method: "POST",
        url: "https://api.colivara.com/v1/helpers/file-to-imgbase64/",
        headers: {
          Authorization: "Bearer test-api-key",
          "Content-Type": "multipart/form-data",
        },
        data: expect.any(FormData),
      });
    });

    it("should handle API error responses", async () => {
      const testBuffer = Buffer.from("test content");
      (fs.promises.readFile as jest.Mock).mockResolvedValueOnce(testBuffer);

      const apiError = new Error("API Error");
      (apiError as any).isAxiosError = true;
      (apiError as any).response = {
        status: 500,
        data: { detail: "Internal server error" },
      };

      mockedAxios.request.mockRejectedValueOnce(apiError);

      await expect(client.fileToImgbase64("test.pdf")).rejects.toThrow(
        "API Error"
      );
    });

    it("should create correct form data with file", async () => {
      const testBuffer = Buffer.from("test content");
      (fs.promises.readFile as jest.Mock).mockResolvedValueOnce(testBuffer);

      mockedAxios.request.mockResolvedValueOnce({ data: mockFileOut });

      await client.fileToImgbase64("test.pdf");

      const requestCall = mockedAxios.request.mock.calls[0][0];
      const formData = requestCall.data as FormData;
      const file = formData.get("file") as File;

      expect(file).toBeInstanceOf(File);
      expect(file.name).toBe("test.pdf");
      expect(mime.lookup(file.name)).toBe("application/pdf");
    });
  });
});
