// client.ts
import { Configuration } from './configuration';
import {
    CollectionsApi,
    DocumentsApi,
    EmbeddingsApi,
    FilterApi,
    WebhookApi,
    HelpersApi,
    SearchApi,
    CollectionIn,
    DocumentIn,
    EmbeddingsIn,
    QueryIn,
    DocumentInPatch,
    PatchCollectionIn,
    WebhookIn,
    TaskEnum,
    DocumentOut,
    WebhookOut,
    CollectionOut, 
    EmbeddingsOut,
    FileOut,
    QueryFilter,
    GenericMessage,
    Response,
    Key,
    Value,
    OnEnum,
} from './api';
import axios, { AxiosError, AxiosResponse } from 'axios';
import * as fs from 'fs';

class ColiVaraError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ColiVaraError';
    }
}

export class ColiVara {
    private collectionsApi: CollectionsApi;
    private documentsApi: DocumentsApi;
    private embeddingsApi: EmbeddingsApi;
    private searchApi: SearchApi;
    private filterApi: FilterApi;
    private webhookApi: WebhookApi;
    private helperApi: HelpersApi;





    constructor(
        apiKey: string,
        baseUrl: string = 'https://api.colivara.com'
    ) {
        const configuration = new Configuration({
            basePath: baseUrl,
            accessToken: apiKey,
        });

        this.collectionsApi = new CollectionsApi(configuration);
        this.documentsApi = new DocumentsApi(configuration);
        this.embeddingsApi = new EmbeddingsApi(configuration);
        this.searchApi = new SearchApi(configuration);
        this.filterApi = new FilterApi(configuration);
        this.webhookApi = new WebhookApi(configuration);
        this.helperApi = new HelpersApi(configuration);

    }

    private handleError(error: unknown): never {
        if (axios.isAxiosError(error)) {
            const axiosError = error as AxiosError<any>;
            const statusCode = axiosError.response?.status;
            const errorMessage = axiosError.response?.data && typeof axiosError.response.data === 'object' && 'detail' in axiosError.response.data
                ? axiosError.response.data.detail
                : axiosError.message;
            
            throw new ColiVaraError(
                `API Error (${statusCode}): ${errorMessage}`
            );
        }
        
        throw error;
    }
    
        /**
     * Create a new collection.
     * 
     * @param params - The parameters for collection creation
     * @param params.name - Name of the collection
     * @param params.metadata - Optional metadata for the collection
     * @returns Response from the API
     * @throws {ColiVaraError} If the API request fails
     */
    async createCollection({
        name,
        metadata = {}
    }: {
        name: string;
        metadata?: Record<string, any>;
    }): Promise<CollectionOut> {
        try {
            const body: CollectionIn = {
                name,
                metadata
            };
            const response = await this.collectionsApi.apiViewsCreateCollection(body);
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Gets a specific collection.
     * 
     * @param params - The parameters for getting a collection
     * @param params.collection_name - The name of the collection to get
     * @returns The requested CollectionOut object
     * @throws {ColiVaraError} If the collection is not found or an unexpected error occurs
     */
    async getCollection({
        collection_name
    }: {
        collection_name: string;
    }): Promise<CollectionOut> {
        try {
            const response = await this.collectionsApi.apiViewsGetCollection(collection_name);
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }
    /**
     * Lists all collections.
     * 
     * @returns A list of CollectionOut objects
     * @throws {ColiVaraError} If the response format is unexpected or an unexpected error occurs
     */
    async listCollections(): Promise<CollectionOut[]> {
        try {
            const response = await this.collectionsApi.apiViewsListCollections();
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Deletes a specific collection.
     * 
     * @param params - The parameters for deleting a collection
     * @param params.collection_name - The name of the collection to delete
     * @throws {ColiVaraError} If the collection is not found or an unexpected error occurs
     */
    async deleteCollection({
        collection_name
    }: {
        collection_name: string;
    }): Promise<void> {
        try {
            await this.collectionsApi.apiViewsDeleteCollection(collection_name);
        } catch (error) {
            this.handleError(error);
        }
    }



    /**
     * Partially updates a collection.
     * 
     * @param params - The parameters for updating a collection
     * @param params.collection_name - The name of the collection to update
     * @param params.name - The new name for the collection (optional)
     * @param params.metadata - The new metadata for the collection (optional)
     * @returns The updated CollectionOut object
     * @throws {ColiVaraError} If the collection is not found or there's a problem with the update
     */
    async partialUpdateCollection({
        collection_name,
        name,
        metadata
    }: {
        collection_name: string;
        name?: string;
        metadata?: Record<string, any>;
    }): Promise<CollectionOut> {
        try {
            const body: PatchCollectionIn = {
                name,
                metadata
            };
            const response = await this.collectionsApi.apiViewsPartialUpdateCollection(
                collection_name,
                body
            );
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }


    


    /**
     * Retrieve a specific document from the user documents.
     * 
     * @param params - The parameters for retrieving a document
     * @param params.document_name - The name of the document to retrieve
     * @param params.collection_name - The name of the collection containing the document. Defaults to "default_collection"
     * @param params.expand - A comma-separated list of fields to expand in the response.
     *                       Currently, only "pages" is supported, the document's pages will be included if provided
     * @returns The retrieved document with its details
     * @throws {ColiVaraError} If the document or collection is not found, or if the API request fails
     */
    async getDocument({
        document_name,
        collection_name = "default_collection",
        expand
    }: {
        document_name: string;
        collection_name?: string;
        expand?: string;
    }): Promise<DocumentOut> {
        try {
            const response = await this.documentsApi.apiViewsGetDocument(
                document_name,
                collection_name,
                expand
            );
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }


    /**
     * Fetch a list of documents for a given collection.
     * 
     * @param params - The parameters for listing documents
     * @param params.collection_name - The name of the collection to fetch documents from.
     *                                Defaults to "default_collection". Use "all" to fetch documents from all collections.
     * @param params.expand - A comma-separated string specifying additional fields to include in the response.
     *                       If "pages" is included, the pages of each document will be included.
     * 
     * @returns A list of documents with their details
     * @throws {ColiVaraError} If the API request fails
     */
    async listDocuments({
        collection_name = "default_collection",
        expand
    }: {
        collection_name?: string;
        expand?: string;
    } = {}): Promise<DocumentOut[]> {
        try {
            const response = await this.documentsApi.apiViewsListDocuments(
                collection_name,
                expand
            );
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    
    /**
     * Partially update a document.
     * 
     * This method allows for partial updates to a document's details. Only the fields provided will be updated.
     * 
     * @param params - The parameters for updating a document
     * @param params.document_name - The name of the document to be updated
     * @param params.name - The new name for the document, if changing
     * @param params.metadata - Updated metadata for the document
     * @param params.collection_name - The name of the collection to move the document to, if changing
     * @param params.document_url - The new URL of the document, if changing
     * @param params.document_base64 - The new base64-encoded string of the document content, if changing
     * @param params.use_proxy - Whether to use a proxy for the document URL
     * 
     * @returns The updated document with its details
     * @throws {ColiVaraError} If the API request fails or the document is not found
     */
    async partialUpdateDocument({
        document_name,
        name,
        metadata,
        collection_name,
        document_url,
        document_base64,
        use_proxy = false
    }: {
        document_name: string;
        name?: string;
        metadata?: Record<string, any>;
        collection_name?: string;
        document_url?: string;
        document_base64?: string;
        use_proxy?: boolean;
    }): Promise<DocumentOut> {
        try {
            const body: DocumentInPatch = {
                name,
                metadata,
                collection_name,
                url: document_url,
                base64: document_base64,
                use_proxy
            };
            
            const response = await this.documentsApi.apiViewsPartialUpdateDocument(
                document_name,
                body
            );
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }


    /**
     * Create or update a document in a collection.
     * 
     * This method allows you to upsert (insert or update) a document in the specified collection.
     * You can provide either a URL or a base64-encoded string of the document content.
     * 
     * @param params - The parameters for document upsertion
     * @param params.name - The name of the document
     * @param params.metadata - Additional metadata for the document
     * @param params.collectionName - The name of the collection to add the document to. Defaults to "default_collection"
     * @param params.document_url - The URL of the document, if available
     * @param params.document_base64 - The base64-encoded string of the document content, if available
     * @param params.document_path - The path to the document file to be uploaded
     * @param params.wait - If true, wait for the document to be processed before returning
     * @param params.use_proxy - If true, use proxy for URL downloads
     * 
     * @returns The created or updated document with its details
     * 
     * @throws {ColiVaraError} If no valid document source is provided or if there's an error with file handling
     * @throws {ColiVaraError} If the API request fails
     */
    async upsertDocument({
        name,
        metadata = {},
        collection_name = "default_collection",
        document_url,
        document_base64,
        document_path,
        wait = false,
        use_proxy = false
    }: {
        name: string;
        metadata?: Record<string, any>;
        collection_name?: string;
        document_url?: string;
        document_base64?: string;
        document_path?: string;
        wait?: boolean;
        use_proxy?: boolean;
    }): Promise<DocumentOut> {
        try {
            let base64Content = document_base64;

            if (document_path) {
                try {
                    const fileContent = await fs.promises.readFile(document_path);
                    base64Content = fileContent.toString('base64');
                } catch (error: unknown) {
                    if (error instanceof Error) {
                        const nodeError = error as NodeJS.ErrnoException;
                        if (nodeError.code === 'ENOENT') {
                            throw new ColiVaraError(`The specified file does not exist: ${document_path}`);
                        } else if (nodeError.code === 'EACCES') {
                            throw new ColiVaraError(`No read permission for file: ${document_path}`);
                        }
                        throw new ColiVaraError(`Error reading file: ${error.message}`);
                    }
                    throw new ColiVaraError('Unknown error occurred while reading file');
                }
            }

            if (!document_url && !base64Content) {
                throw new ColiVaraError(
                    "Either document_url, document_base64, or document_path must be provided."
                );
            }

            const document: DocumentIn = {
                name,
                metadata,
                collection_name,
                url: document_url,
                base64: base64Content,
                wait,
                use_proxy
            };

            const response = await this.documentsApi.apiViewsUpsertDocument(document);
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Delete a document by its name.
     * 
     * @param params - The parameters for deleting a document
     * @param params.document_name - The name of the document to be deleted
     * @param params.collection_name - The name of the collection containing the document.
     *                                Defaults to "default_collection". Use "all" to access all collections belonging to the user.
     * 
     * @throws {ColiVaraError} If the API request fails or if the document does not exist
     */
    async deleteDocument({
        document_name,
        collection_name = "default_collection"
    }: {
        document_name: string;
        collection_name?: string;
    }): Promise<void> {
        try {
            await this.documentsApi.apiViewsDeleteDocument(
                document_name,
                collection_name
            );
        } catch (error) {
            this.handleError(error);
        }
    }


    /**
     * Filter for documents and collections that meet the criteria of the filter.
     * 
     * @param params - The parameters for filtering
     * @param params.query_filter - A dictionary specifying the filter criteria.
     *                             The filter can be used to narrow down the search based on specific criteria.
     *                             The dictionary should contain the following keys:
     *                             - "on": "document" or "collection"
     *                             - "key": string or string[]
     *                             - "value": string | number | boolean | null
     *                             - "lookup": "key_lookup" | "contains" | "contained_by" | "has_key" | "has_keys" | "has_any_keys"
     * @param params.expand - A comma-separated list of fields to expand in the response.
     *                       Currently, only "pages" is supported, the document's pages will be included if provided.
     * 
     * @returns The API Response containing documents or collections
     * @throws {ColiVaraError} If the query_filter is invalid or if the API request fails
     */
    async filter({
        query_filter,
        expand
    }: {
        query_filter: {
            on?: "document" | "collection";
            key: string | string[];
            value?: string | number | boolean | null;
            lookup: "key_lookup" | "contains" | "contained_by" | "has_key" | "has_keys" | "has_any_keys";
        };
        expand?: string;
    }): Promise<Response> {
        try {
            // Simplify the filter model to match the API expectations
            const filter_model: QueryFilter = {
                key: query_filter.key,           // Pass the key directly
                value: query_filter.value ?? '',  // Use nullish coalescing for empty string default
                lookup: query_filter.lookup,
                on: query_filter.on
            };
    
            const response = await this.filterApi.apiViewsFilter(
                filter_model,
                expand
            );
            return response.data;
        } catch (error) {
            if (error instanceof Error) {
                if (error.message.includes('key')) {
                    throw new ColiVaraError(`Missing required key: ${error.message}`);
                }
            }
            this.handleError(error);
        }
    }

}
