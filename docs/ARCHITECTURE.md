# Architecture Overview

This document explains the architecture of MCP servers on Cloudflare Workers.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Applications                       │
│  (AI Assistants, CLI Tools, Web Apps, Mobile Apps)              │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP/HTTPS
                             │ JSON-RPC 2.0
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Cloudflare Global Network                    │
│                    (300+ Edge Locations)                         │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Cloudflare Worker                           │
│                      (MCP Server)                                │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Request    │  │     MCP      │  │   Response   │          │
│  │   Handler    │→ │   Protocol   │→ │   Builder    │          │
│  └──────────────┘  │   Router     │  └──────────────┘          │
│                    └──────┬───────┘                             │
│                           │                                      │
│            ┌──────────────┼──────────────┐                      │
│            ▼              ▼              ▼                      │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐           │
│  │    Tools     │ │  Resources   │ │   Prompts    │           │
│  │   Handler    │ │   Handler    │ │   Handler    │           │
│  └──────────────┘ └──────────────┘ └──────────────┘           │
└────────┬──────────────┬──────────────┬─────────────────────────┘
         │              │              │
         ▼              ▼              ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│  KV Storage │ │   External  │ │   Durable   │
│  (Optional) │ │     APIs    │ │   Objects   │
│             │ │  (Optional) │ │  (Optional) │
└─────────────┘ └─────────────┘ └─────────────┘
```

## Component Overview

### 1. Client Layer

**Purpose**: Applications that consume the MCP server

**Components**:
- AI assistants (Claude, ChatGPT, etc.)
- Command-line tools
- Web applications
- Mobile applications
- Custom integrations

**Communication**: 
- Protocol: JSON-RPC 2.0 over HTTP/HTTPS
- Methods: GET (info), POST (MCP protocol)
- Authentication: Bearer tokens, API keys (optional)

### 2. Cloudflare Edge Network

**Purpose**: Global content delivery and edge computing

**Benefits**:
- 300+ data centers worldwide
- Automatic DDoS protection
- TLS termination
- Request routing
- Edge caching
- Load balancing

**Features**:
- Smart routing to nearest edge location
- Automatic failover
- Zero cold starts (after first request)
- Sub-50ms response times globally

### 3. Worker (MCP Server)

**Purpose**: Execute MCP server logic

**Components**:

#### Request Handler
- Accepts incoming HTTP requests
- Validates request format
- Routes to appropriate handler
- Handles CORS preflight
- Returns HTTP responses

#### MCP Protocol Router
- Parses JSON-RPC 2.0 requests
- Routes to method handlers
- Validates parameters
- Formats responses
- Handles errors

#### Method Handlers
- **Tools Handler**: Manages tool definitions and execution
- **Resources Handler**: Provides access to data resources
- **Prompts Handler**: Serves prompt templates

**Characteristics**:
- Stateless by default
- V8 isolate execution
- 128 MB memory limit
- 10-50ms CPU time limit
- Automatic scaling
- Pay-per-request pricing

### 4. Storage Layer

#### KV Storage (Optional)

**Purpose**: Global, eventually-consistent key-value storage

**Use Cases**:
- Session data
- User preferences
- Cached API responses
- Application state
- Analytics data

**Characteristics**:
- Eventually consistent (usually < 60s)
- Low-latency reads
- Global replication
- 25 MB value limit
- Unlimited keys

#### Durable Objects (Optional)

**Purpose**: Strongly-consistent, coordinated storage

**Use Cases**:
- Real-time collaboration
- WebSocket connections
- Strongly-consistent state
- Coordination between requests
- Rate limiting

**Characteristics**:
- Strong consistency
- Single-threaded per object
- WebSocket support
- Persistent storage
- Regional deployment

#### External APIs (Optional)

**Purpose**: Integration with external services

**Examples**:
- Database APIs
- Third-party services
- REST APIs
- GraphQL endpoints
- Webhooks

## Request Flow

### 1. Initialization Flow

```
Client                  Worker                   Storage
  │                       │                         │
  │──initialize──────────>│                         │
  │                       │                         │
  │                       │──get config────────────>│
  │                       │<─config data───────────│
  │                       │                         │
  │<─capabilities────────│                         │
  │   serverInfo          │                         │
```

### 2. Tool Execution Flow

```
Client                  Worker                   Storage/API
  │                       │                         │
  │──tools/list──────────>│                         │
  │<─tool definitions────│                         │
  │                       │                         │
  │──tools/call──────────>│                         │
  │   (name, args)        │                         │
  │                       │                         │
  │                       │──validate args          │
  │                       │                         │
  │                       │──execute───────────────>│
  │                       │<─result────────────────│
  │                       │                         │
  │<─tool result─────────│                         │
```

### 3. Resource Access Flow

```
Client                  Worker                   Storage
  │                       │                         │
  │──resources/list──────>│                         │
  │<─resource URIs───────│                         │
  │                       │                         │
  │──resources/read──────>│                         │
  │   (uri)               │                         │
  │                       │                         │
  │                       │──fetch data───────────>│
  │                       │<─resource data─────────│
  │                       │                         │
  │<─resource content────│                         │
```

## Deployment Architecture

### Single Worker Deployment

```
┌──────────────────────────────────────┐
│         Worker Instance              │
│                                      │
│  • Handles all MCP methods           │
│  • Direct access to KV/DO            │
│  • Simple configuration              │
│                                      │
│  Best for: Simple servers            │
└──────────────────────────────────────┘
```

### Multi-Worker Architecture

```
┌──────────────────────────────────────┐
│         Gateway Worker               │
│  • Request routing                   │
│  • Authentication                    │
│  • Rate limiting                     │
└───────────┬──────────────────────────┘
            │
    ┌───────┼───────┐
    ▼       ▼       ▼
┌────────┐ ┌────────┐ ┌────────┐
│ Tools  │ │Resource│ │Prompts │
│Worker  │ │Worker  │ │Worker  │
└────────┘ └────────┘ └────────┘

Best for: Large-scale deployments
```

## Security Architecture

### Request Security

```
┌─────────────────────────────────────────┐
│          Client Request                 │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│     Cloudflare Security Layer           │
│  • DDoS protection                      │
│  • Bot management                       │
│  • WAF rules                            │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│       Worker Security Checks            │
│  • Authentication validation            │
│  • Input sanitization                   │
│  • Rate limiting                        │
│  • CORS enforcement                     │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│         Request Processing              │
└─────────────────────────────────────────┘
```

### Data Security

- **Secrets**: Encrypted at rest, never in code
- **KV Data**: Encrypted in transit and at rest
- **API Keys**: Stored as Cloudflare secrets
- **HTTPS**: Enforced for all connections
- **Access Control**: Token-based authentication

## Scalability

### Horizontal Scaling

```
Load Increase ──────────────> More Instances
     │                              │
     │         Automatic             │
     │      (Cloudflare)             │
     │                              │
     └──────────────────────────────┘
```

**Characteristics**:
- Automatic scaling
- No configuration needed
- Handles millions of requests
- Global distribution
- Zero cold starts (after warmup)

### Vertical Limits

- CPU: 10-50ms per request
- Memory: 128 MB
- Request size: 100 MB
- Response size: 100 MB
- Subrequests: 50-1000

## Performance Optimization

### Caching Strategy

```
Request
  │
  ▼
┌──────────────┐
│ Edge Cache   │ ←──── Hit: Return cached
│ (Cloudflare) │
└──────┬───────┘
       │ Miss
       ▼
┌──────────────┐
│   Worker     │
│   Logic      │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ KV Storage   │ ←──── Cache here
└──────────────┘
```

### Best Practices

1. **Minimize Cold Starts**
   - Keep bundles small (< 1MB)
   - Use static imports
   - Limit dependencies

2. **Optimize Response Times**
   - Cache at edge
   - Use KV for frequent data
   - Parallel requests with Promise.all()

3. **Reduce CPU Usage**
   - Avoid complex computations
   - Use streaming for large data
   - Offload heavy work to external services

## Monitoring and Observability

```
┌──────────────────────────────────────┐
│          Worker Metrics              │
│  • Request count                     │
│  • Error rate                        │
│  • CPU time                          │
│  • Response time                     │
└────────────────┬─────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────┐
│      Cloudflare Dashboard            │
│  • Real-time metrics                 │
│  • Historical data                   │
│  • Logs (via wrangler tail)          │
│  • Analytics                         │
└──────────────────────────────────────┘
```

## Cost Architecture

### Free Tier
- 100,000 requests/day
- Suitable for: Development, small projects

### Paid Tier ($5/month)
- 10M requests/month included
- $0.50 per additional million
- Suitable for: Production, high-traffic

### Optimization
- Cache aggressively
- Minimize external API calls
- Use KV efficiently (reads cheaper than writes)
- Batch operations when possible

## Additional Resources

- [Cloudflare Workers Architecture](https://developers.cloudflare.com/workers/learning/how-workers-works/)
- [KV Architecture](https://developers.cloudflare.com/kv/learning/how-kv-works/)
- [Durable Objects Architecture](https://developers.cloudflare.com/durable-objects/learning/how-durable-objects-work/)
