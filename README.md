Here's a comprehensive README.md for your SDK, along with the necessary changes to make the package importable as requested:

```markdown
# ColiVara TypeScript SDK

Official TypeScript SDK for ColiVara API - A powerful document processing and search platform.

## Installation

```bash
npm install @tjmlabs/colivara-ts
# or
yarn add @tjmlabs/colivara-ts
```

## Quick Start

```typescript
import { ColiVara } from '@tjmlabs/colivara-ts';

// Initialize the client
const client = new ColiVara('your-api-key');

// Example: Create a collection
async function createCollection() {
    try {
        const collection = await client.createCollection({
            name: 'my-collection',
            metadata: { description: 'My first collection' }
        });
        console.log('Collection created:', collection);
    } catch (error) {
        console.error('Error:', error);
    }
}
```

## Basic Usage Examples

### Working with Collections

```typescript
// Create a collection
const collection = await client.createCollection({
    name: 'research',
    metadata: { topic: 'AI' }
});

// List all collections
const collections = await client.listCollections();

// Get a specific collection
const collection = await client.getCollection({
    collection_name: 'research'
});
```

### Document Management

```typescript
// Upload a document
const document = await client.upsertDocument({
    name: 'important-doc',
    collection_name: 'research',
    document_path: './path/to/document.pdf'
});

// Search documents
const searchResults = await client.search({
    query: 'What is machine learning?',
    collection_name: 'research',
    top_k: 5
});
```

### Creating Embeddings

```typescript
// Create embeddings for text
const embeddings = await client.createEmbedding({
    input_data: 'What is artificial intelligence?',
    task: 'query'
});

// Create embeddings for images
const imageEmbeddings = await client.createEmbedding({
    input_data: ['./path/to/image1.jpg', './path/to/image2.jpg'],
    task: 'image'
});
```

## API Documentation

### Collections API
- `createCollection({ name, metadata? })`
- `getCollection({ collection_name })`
- `listCollections()`
- `deleteCollection({ collection_name })`
- `partialUpdateCollection({ collection_name, name?, metadata? })`

### Documents API
- `upsertDocument({ name, metadata?, collection_name?, document_url?, document_base64?, document_path?, wait?, use_proxy? })`
- `getDocument({ document_name, collection_name?, expand? })`
- `listDocuments({ collection_name?, expand? })`
- `deleteDocument({ document_name, collection_name? })`
- `partialUpdateDocument({ document_name, ...options })`

### Search API
- `search({ query, collection_name?, top_k?, query_filter? })`

### Embeddings API
- `createEmbedding({ input_data, task? })`

### Webhooks API
- `addWebhook({ url })`
- `validateWebhook({ webhook_secret, payload, headers })`

### Health API
- `checkHealth()`

## Error Handling

The SDK uses a custom `ColiVaraError` class for error handling:

```typescript
try {
    await client.createCollection({ name: 'test' });
} catch (error) {
    if (error instanceof ColiVaraError) {
        console.error('API Error:', error.message);
    }
}
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Setup

```bash
# Clone the repository
git clone https://github.com/HalemoGPA/colivara-ts.git

# Install dependencies
npm install

# Run tests
npm test

# Build the package
npm run build
```

### Testing
- Write tests for new features in the `__tests__` directory
- Ensure all tests pass before submitting PR
- Maintain test coverage above 80%

## License

This project is licensed under the Apache-2.0 License - see the [LICENSE](LICENSE) file for details.
