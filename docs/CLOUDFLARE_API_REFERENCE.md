# Cloudflare Workers API Reference for MCP Servers

This document provides essential Cloudflare Workers API information for building MCP servers.

## Table of Contents

1. [Workers Runtime API](#workers-runtime-api)
2. [KV Storage API](#kv-storage-api)
3. [Durable Objects API](#durable-objects-api)
4. [Workers Analytics API](#workers-analytics-api)
5. [Cloudflare REST API](#cloudflare-rest-api)

---

## Workers Runtime API

### Request Handler

The main entry point for your worker:

```typescript
export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    // Handle request
    return new Response('Hello World');
  }
}
```

#### Parameters

- **`request: Request`** - The incoming HTTP request
- **`env: Env`** - Environment bindings (KV, secrets, etc.)
- **`ctx: ExecutionContext`** - Execution context for background tasks

### Request Object

```typescript
interface Request {
  // Properties
  url: string;              // Full URL
  method: string;           // HTTP method (GET, POST, etc.)
  headers: Headers;         // Request headers
  body: ReadableStream;     // Request body
  cf: IncomingRequestCfProperties; // Cloudflare-specific properties
  
  // Methods
  json(): Promise<any>;     // Parse JSON body
  text(): Promise<string>;  // Read body as text
  formData(): Promise<FormData>; // Parse form data
  arrayBuffer(): Promise<ArrayBuffer>; // Read as array buffer
  clone(): Request;         // Clone the request
}
```

#### Cloudflare Properties

```typescript
interface IncomingRequestCfProperties {
  // Geographic data
  colo: string;            // Cloudflare data center
  country: string;         // Two-letter country code
  city: string;            // City name
  continent: string;       // Continent code
  latitude: string;        // Latitude
  longitude: string;       // Longitude
  postalCode: string;      // Postal code
  region: string;          // Region/state
  timezone: string;        // IANA timezone
  
  // Request metadata
  asn: number;             // AS number
  asOrganization: string;  // AS organization
  tlsVersion: string;      // TLS version
  tlsCipher: string;       // TLS cipher
  httpProtocol: string;    // HTTP protocol version
}
```

### Response Object

```typescript
interface Response {
  // Constructor
  new Response(
    body?: BodyInit | null,
    init?: ResponseInit
  ): Response;
  
  // Properties
  status: number;          // HTTP status code
  statusText: string;      // Status text
  headers: Headers;        // Response headers
  ok: boolean;             // Status 200-299
  redirected: boolean;     // Was redirected
  type: ResponseType;      // Response type
  url: string;             // Response URL
  body: ReadableStream;    // Response body
  
  // Methods
  json(): Promise<any>;    // Parse JSON
  text(): Promise<string>; // Read as text
  clone(): Response;       // Clone response
}

interface ResponseInit {
  status?: number;         // Status code
  statusText?: string;     // Status text
  headers?: HeadersInit;   // Headers
}
```

#### Response Examples

```typescript
// JSON response
return new Response(JSON.stringify({ message: 'Hello' }), {
  status: 200,
  headers: {
    'Content-Type': 'application/json',
  },
});

// HTML response
return new Response('<h1>Hello World</h1>', {
  headers: {
    'Content-Type': 'text/html',
  },
});

// Redirect
return Response.redirect('https://example.com', 302);

// Error response
return new Response('Not Found', { status: 404 });
```

### Headers

```typescript
interface Headers {
  // Methods
  get(name: string): string | null;
  set(name: string, value: string): void;
  append(name: string, value: string): void;
  delete(name: string): void;
  has(name: string): boolean;
  entries(): Iterator<[string, string]>;
  keys(): Iterator<string>;
  values(): Iterator<string>;
}

// Usage
const headers = new Headers();
headers.set('Content-Type', 'application/json');
headers.append('X-Custom', 'value');
```

### Environment Bindings

```typescript
interface Env {
  // KV Namespaces
  MY_KV: KVNamespace;
  
  // Secrets
  API_KEY: string;
  DATABASE_URL: string;
  
  // Variables
  ENVIRONMENT: string;
  
  // Durable Objects
  MY_DURABLE_OBJECT: DurableObjectNamespace;
  
  // R2 Buckets
  MY_BUCKET: R2Bucket;
}
```

### Execution Context

```typescript
interface ExecutionContext {
  // Wait for promise to complete before terminating
  waitUntil(promise: Promise<any>): void;
  
  // Pass through to origin (for fetch events)
  passThroughOnException(): void;
}

// Usage
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    // Background task
    ctx.waitUntil(logRequest(request));
    
    return new Response('OK');
  }
}

async function logRequest(request: Request) {
  // This will complete even after response is sent
  await fetch('https://logging-service.com/log', {
    method: 'POST',
    body: JSON.stringify({ url: request.url }),
  });
}
```

---

## KV Storage API

Cloudflare Workers KV is a global, low-latency key-value store.

### Basic Operations

```typescript
interface KVNamespace {
  // Read
  get(key: string, options?: KVGetOptions): Promise<string | null>;
  get(key: string, type: 'text'): Promise<string | null>;
  get(key: string, type: 'json'): Promise<any | null>;
  get(key: string, type: 'arrayBuffer'): Promise<ArrayBuffer | null>;
  get(key: string, type: 'stream'): Promise<ReadableStream | null>;
  
  // Write
  put(key: string, value: string | ArrayBuffer | ReadableStream, options?: KVPutOptions): Promise<void>;
  
  // Delete
  delete(key: string): Promise<void>;
  
  // List
  list(options?: KVListOptions): Promise<KVListResult>;
  
  // Metadata
  getWithMetadata(key: string, options?: KVGetOptions): Promise<{
    value: string | null;
    metadata: any | null;
  }>;
}
```

### KV Examples

```typescript
// Simple get/put
await env.MY_KV.put('user:123', JSON.stringify({ name: 'Alice' }));
const user = await env.MY_KV.get('user:123', 'json');

// With expiration (TTL)
await env.MY_KV.put('session:abc', 'data', {
  expirationTtl: 3600, // Expire in 1 hour
});

// With metadata
await env.MY_KV.put('file:xyz', fileData, {
  metadata: { 
    uploadedBy: 'user123',
    uploadDate: Date.now() 
  },
});

const { value, metadata } = await env.MY_KV.getWithMetadata('file:xyz');

// List keys
const result = await env.MY_KV.list({ prefix: 'user:' });
for (const key of result.keys) {
  console.log(key.name);
}

// Delete
await env.MY_KV.delete('user:123');
```

### KV Options

```typescript
interface KVPutOptions {
  expiration?: number;      // Unix timestamp
  expirationTtl?: number;   // Seconds from now
  metadata?: any;           // Arbitrary metadata (max 1KB)
}

interface KVGetOptions {
  type?: 'text' | 'json' | 'arrayBuffer' | 'stream';
  cacheTtl?: number;        // Edge cache TTL
}

interface KVListOptions {
  prefix?: string;          // Filter by prefix
  limit?: number;           // Max keys (default 1000)
  cursor?: string;          // Pagination cursor
}

interface KVListResult {
  keys: Array<{
    name: string;
    expiration?: number;
    metadata?: any;
  }>;
  list_complete: boolean;
  cursor?: string;          // For next page
}
```

### KV Best Practices

1. **Key Naming**: Use prefixes for organization (`user:123`, `cache:abc`)
2. **Size Limits**: 
   - Key: max 512 bytes
   - Value: max 25 MB
   - Metadata: max 1 KB
3. **Consistency**: Eventually consistent (usually < 60s)
4. **Performance**: Optimized for reads, writes are slower
5. **Caching**: Use `cacheTtl` for frequently accessed data

---

## Durable Objects API

Durable Objects provide strongly consistent storage and coordination.

### Defining a Durable Object

```typescript
export class MyDurableObject {
  state: DurableObjectState;
  env: Env;
  
  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
  }
  
  async fetch(request: Request): Promise<Response> {
    // Handle requests to this Durable Object
    return new Response('Hello from DO');
  }
}
```

### Durable Object State

```typescript
interface DurableObjectState {
  // Storage
  storage: DurableObjectStorage;
  
  // ID
  id: DurableObjectId;
  
  // Wait until
  waitUntil(promise: Promise<any>): void;
  
  // Block concurrency during execution
  blockConcurrencyWhile<T>(callback: () => Promise<T>): Promise<T>;
}
```

### Storage API

```typescript
interface DurableObjectStorage {
  // Get
  get<T = any>(key: string): Promise<T | undefined>;
  get<T = any>(keys: string[]): Promise<Map<string, T>>;
  
  // Put
  put<T = any>(key: string, value: T): Promise<void>;
  put<T = any>(entries: Record<string, T>): Promise<void>;
  
  // Delete
  delete(key: string): Promise<boolean>;
  delete(keys: string[]): Promise<number>;
  
  // List
  list<T = any>(options?: DurableObjectListOptions): Promise<Map<string, T>>;
  
  // Transactions
  transaction<T>(closure: (txn: DurableObjectTransaction) => Promise<T>): Promise<T>;
  
  // Alarms
  getAlarm(): Promise<number | null>;
  setAlarm(scheduledTime: number | Date): Promise<void>;
  deleteAlarm(): Promise<void>;
}
```

### Using Durable Objects

```typescript
// In worker
export default {
  async fetch(request: Request, env: Env) {
    // Get Durable Object ID
    const id = env.MY_DURABLE_OBJECT.idFromName('my-object');
    
    // Get stub (reference to DO)
    const stub = env.MY_DURABLE_OBJECT.get(id);
    
    // Send request to DO
    return stub.fetch(request);
  }
}

// Durable Object class
export class Counter {
  state: DurableObjectState;
  count: number = 0;
  
  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.state.blockConcurrencyWhile(async () => {
      this.count = (await this.state.storage.get('count')) || 0;
    });
  }
  
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    
    if (url.pathname === '/increment') {
      this.count++;
      await this.state.storage.put('count', this.count);
    }
    
    return new Response(this.count.toString());
  }
}
```

---

## Workers Analytics API

Track custom metrics from your worker.

### Writing Analytics

```typescript
export default {
  async fetch(request: Request, env: Env) {
    // Your worker logic
    const startTime = Date.now();
    const response = await handleRequest(request);
    const duration = Date.now() - startTime;
    
    // Write analytics (if Analytics Engine is bound)
    if (env.ANALYTICS) {
      env.ANALYTICS.writeDataPoint({
        blobs: ['mcp-server', request.method],
        doubles: [duration],
        indexes: [request.url],
      });
    }
    
    return response;
  }
}
```

---

## Cloudflare REST API

Interact with Cloudflare services via REST API.

### Authentication

```typescript
const headers = {
  'Authorization': `Bearer ${API_TOKEN}`,
  'Content-Type': 'application/json',
};
```

### Workers API Endpoints

#### List Workers

```
GET https://api.cloudflare.com/client/v4/accounts/{account_id}/workers/scripts
```

#### Get Worker

```
GET https://api.cloudflare.com/client/v4/accounts/{account_id}/workers/scripts/{script_name}
```

#### Upload Worker

```
PUT https://api.cloudflare.com/client/v4/accounts/{account_id}/workers/scripts/{script_name}

Content-Type: application/javascript

// Worker code here
```

#### Delete Worker

```
DELETE https://api.cloudflare.com/client/v4/accounts/{account_id}/workers/scripts/{script_name}
```

### KV API Endpoints

#### Create Namespace

```
POST https://api.cloudflare.com/client/v4/accounts/{account_id}/storage/kv/namespaces

{
  "title": "My KV Namespace"
}
```

#### List Namespaces

```
GET https://api.cloudflare.com/client/v4/accounts/{account_id}/storage/kv/namespaces
```

#### Write Key

```
PUT https://api.cloudflare.com/client/v4/accounts/{account_id}/storage/kv/namespaces/{namespace_id}/values/{key}

Content-Type: text/plain

value data here
```

#### Read Key

```
GET https://api.cloudflare.com/client/v4/accounts/{account_id}/storage/kv/namespaces/{namespace_id}/values/{key}
```

### Example: Deploy via API

```typescript
async function deployWorker(
  accountId: string,
  apiToken: string,
  workerName: string,
  code: string
) {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/workers/scripts/${workerName}`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/javascript',
      },
      body: code,
    }
  );
  
  return response.json();
}
```

---

## Limits and Quotas

### Workers Limits

| Resource | Free Tier | Paid Tier |
|----------|-----------|-----------|
| Requests/day | 100,000 | 10M included |
| CPU time | 10ms | 50ms |
| Memory | 128 MB | 128 MB |
| Script size | 1 MB | 1 MB (5 MB with modules) |
| Environment variables | 64 | 128 |
| Subrequests | 50 | 1000 |

### KV Limits

| Operation | Limit |
|-----------|-------|
| Key size | 512 bytes |
| Value size | 25 MB |
| Metadata size | 1 KB |
| Keys per namespace | Unlimited |
| Read ops/sec | No limit |
| Write ops/sec | ~1 per key |
| List operations | 1000 keys |

### Durable Objects Limits

| Resource | Limit |
|----------|-------|
| Storage per DO | 50 GB |
| Requests per DO | No hard limit |
| CPU time | 30 seconds |
| WebSocket connections | No limit |
| Concurrent requests | 1 (queued) |

---

## Additional Resources

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Workers Runtime API](https://developers.cloudflare.com/workers/runtime-apis/)
- [KV Documentation](https://developers.cloudflare.com/kv/)
- [Durable Objects Documentation](https://developers.cloudflare.com/durable-objects/)
- [REST API Documentation](https://developers.cloudflare.com/api/)
