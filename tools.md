# MCP Server Tools Catalog

This document provides a comprehensive catalog of all available tools across all MCP servers.

## Table of Contents
1. [Government Data Tools](#government-data-tools)
2. [AI/LLM Framework Tools](#aillm-framework-tools)
3. [Development Tools](#development-tools)
4. [AI Model Tools](#ai-model-tools)
5. [Infrastructure Tools](#infrastructure-tools)

---

## Government Data Tools

### GovInfo.gov Tools

#### search_bills
Search for congressional bills by query.

**Input Schema**:
```json
{
  "query": "infrastructure",
  "congress": "118",
  "offset": 0,
  "pageSize": 20
}
```

**Output**: JSON array of bill results with metadata

#### get_bill_details
Get detailed information about a specific bill.

**Input Schema**:
```json
{
  "congress": "118",
  "billType": "hr",
  "billNumber": "1234"
}
```

**Output**: Detailed bill information including text, sponsors, actions

#### search_regulations
Search Code of Federal Regulations.

**Input Schema**:
```json
{
  "query": "environmental protection",
  "title": "40"
}
```

**Output**: CFR search results

#### get_congressional_record
Get Congressional Record entries.

**Input Schema**:
```json
{
  "date": "2024-01-15",
  "section": "senate"
}
```

**Output**: Congressional Record entries for specified date and section

#### search_documents
Search all GovInfo documents.

**Input Schema**:
```json
{
  "query": "climate",
  "collection": "CREC",
  "startDate": "2024-01-01",
  "endDate": "2024-12-31"
}
```

**Output**: Document search results

### Congress.gov Tools

#### search_legislation
Search for bills and resolutions.

**Input Schema**:
```json
{
  "query": "healthcare",
  "congress": 118,
  "type": "hr",
  "limit": 20
}
```

**Output**: Legislation search results

#### get_bill
Get details of a specific bill.

**Input Schema**:
```json
{
  "congress": 118,
  "billType": "s",
  "billNumber": 456
}
```

**Output**: Complete bill details

#### get_bill_actions
Get all actions taken on a bill.

**Input Schema**:
```json
{
  "congress": 118,
  "billType": "hr",
  "billNumber": 789
}
```

**Output**: Chronological list of bill actions

#### get_members
Get Congressional members.

**Input Schema**:
```json
{
  "congress": 118,
  "chamber": "senate",
  "state": "CA"
}
```

**Output**: List of Congressional members

#### get_member_details
Get detailed information about a specific member.

**Input Schema**:
```json
{
  "bioguideId": "S000033"
}
```

**Output**: Complete member profile

#### get_committees
Get Congressional committees.

**Input Schema**:
```json
{
  "congress": 118,
  "chamber": "house"
}
```

**Output**: List of committees

#### get_nominations
Get Presidential nominations.

**Input Schema**:
```json
{
  "congress": 118
}
```

**Output**: List of nominations

#### get_roll_call_votes
Get roll call votes.

**Input Schema**:
```json
{
  "congress": 118,
  "chamber": "senate"
}
```

**Output**: Roll call vote results

### OpenStates Tools

#### search_bills
Search for state bills.

**Input Schema**:
```json
{
  "jurisdiction": "CA",
  "query": "education funding",
  "session": "2023",
  "perPage": 20
}
```

**Output**: State bill search results

#### get_bill
Get details of a specific state bill.

**Input Schema**:
```json
{
  "billId": "ocd-bill/..."
}
```

**Output**: Complete bill details

#### get_legislators
Get state legislators.

**Input Schema**:
```json
{
  "jurisdiction": "NY",
  "chamber": "upper",
  "district": "12"
}
```

**Output**: List of legislators

#### get_legislator
Get details of a specific legislator.

**Input Schema**:
```json
{
  "legislatorId": "ocd-person/..."
}
```

**Output**: Complete legislator profile

#### get_jurisdictions
Get list of available jurisdictions.

**Input Schema**: None required

**Output**: List of all state jurisdictions

#### get_sessions
Get legislative sessions for a jurisdiction.

**Input Schema**:
```json
{
  "jurisdiction": "TX"
}
```

**Output**: List of legislative sessions

#### get_bill_votes
Get votes for a specific bill.

**Input Schema**:
```json
{
  "billId": "ocd-bill/..."
}
```

**Output**: Vote results for bill

---

## AI/LLM Framework Tools

### LangChain Tools

#### execute_chain
Execute a LangChain chain.

**Input Schema**:
```json
{
  "chainType": "conversational",
  "input": "What is the weather?",
  "config": {}
}
```

**Output**: Chain execution result

#### create_agent
Create and execute a LangChain agent.

**Input Schema**:
```json
{
  "agentType": "zero-shot",
  "tools": ["search", "calculator"],
  "input": "Find the square root of 144"
}
```

**Output**: Agent execution result

#### split_text
Split text into chunks.

**Input Schema**:
```json
{
  "text": "Long document text...",
  "chunkSize": 1000,
  "chunkOverlap": 200
}
```

**Output**: Array of text chunks

#### embed_text
Generate embeddings for text.

**Input Schema**:
```json
{
  "text": "Text to embed",
  "model": "text-embedding-ada-002"
}
```

**Output**: Embedding vector

#### similarity_search
Search for similar documents.

**Input Schema**:
```json
{
  "query": "machine learning",
  "documents": ["doc1", "doc2", "doc3"],
  "k": 4
}
```

**Output**: Ranked similar documents

### LangFuse Tools

#### create_trace
Create a new trace.

**Input Schema**:
```json
{
  "name": "user_query",
  "userId": "user123",
  "sessionId": "session456",
  "metadata": {}
}
```

**Output**: Trace ID and details

#### get_traces
Get traces with optional filters.

**Input Schema**:
```json
{
  "userId": "user123",
  "sessionId": "session456",
  "limit": 50,
  "page": 1
}
```

**Output**: List of traces

#### get_trace
Get a specific trace by ID.

**Input Schema**:
```json
{
  "traceId": "trace_abc123"
}
```

**Output**: Complete trace details

#### get_metrics
Get metrics and analytics.

**Input Schema**:
```json
{
  "startDate": "2024-01-01T00:00:00Z",
  "endDate": "2024-01-31T23:59:59Z",
  "groupBy": "model"
}
```

**Output**: Aggregated metrics

#### get_observations
Get observations (spans) for a trace.

**Input Schema**:
```json
{
  "traceId": "trace_abc123"
}
```

**Output**: List of observations

#### get_scores
Get evaluation scores.

**Input Schema**:
```json
{
  "traceId": "trace_abc123",
  "name": "accuracy"
}
```

**Output**: Score results

---

## Development Tools

### Cloudflare Tools

#### list_workers
List all Workers in account.

**Input Schema**: None required

**Output**: List of Workers

#### get_worker
Get details of a specific Worker.

**Input Schema**:
```json
{
  "scriptName": "my-worker"
}
```

**Output**: Worker details

#### deploy_worker
Deploy a new Worker.

**Input Schema**:
```json
{
  "scriptName": "my-worker",
  "script": "export default { async fetch(request) { ... } }",
  "bindings": {}
}
```

**Output**: Deployment result

#### kv_list_namespaces
List KV namespaces.

**Input Schema**: None required

**Output**: List of KV namespaces

#### kv_get
Get value from KV.

**Input Schema**:
```json
{
  "namespaceId": "abc123",
  "key": "mykey"
}
```

**Output**: Stored value

#### kv_put
Put value in KV.

**Input Schema**:
```json
{
  "namespaceId": "abc123",
  "key": "mykey",
  "value": "myvalue"
}
```

**Output**: Success confirmation

#### r2_list_buckets
List R2 buckets.

**Input Schema**: None required

**Output**: List of R2 buckets

#### r2_upload
Upload object to R2.

**Input Schema**:
```json
{
  "bucket": "my-bucket",
  "key": "path/to/object",
  "data": "base64_encoded_data"
}
```

**Output**: Upload confirmation

### Postman Tools

#### get_collections
Get all collections.

**Input Schema**: None required

**Output**: List of collections

#### get_collection
Get specific collection.

**Input Schema**:
```json
{
  "collectionId": "12345"
}
```

**Output**: Collection details

#### run_collection
Run collection tests.

**Input Schema**:
```json
{
  "collectionId": "12345",
  "environment": "production"
}
```

**Output**: Test results

#### create_request
Create new API request.

**Input Schema**:
```json
{
  "method": "GET",
  "url": "https://api.example.com/data",
  "headers": {},
  "body": {}
}
```

**Output**: Request result

---

## AI Model Tools

### Gemini Tools

#### generate_text
Generate text using Gemini.

**Input Schema**:
```json
{
  "prompt": "Write a story about...",
  "model": "gemini-pro",
  "temperature": 0.7,
  "maxTokens": 1000
}
```

**Output**: Generated text

#### analyze_image
Analyze image with Gemini Vision.

**Input Schema**:
```json
{
  "imageUrl": "https://example.com/image.jpg",
  "prompt": "Describe this image"
}
```

**Output**: Image analysis

#### function_call
Call function with Gemini.

**Input Schema**:
```json
{
  "prompt": "What's the weather?",
  "functions": [...]
}
```

**Output**: Function call result

### Qwen Tools

#### generate_text
Generate text using Qwen.

**Input Schema**:
```json
{
  "prompt": "Translate to Chinese: Hello",
  "model": "qwen-turbo",
  "temperature": 0.7
}
```

**Output**: Generated text

#### code_generation
Generate code using Qwen.

**Input Schema**:
```json
{
  "description": "Sort array in Python",
  "language": "python"
}
```

**Output**: Generated code

---

## Infrastructure Tools

### Agent-Zero Tools

#### execute_task
Execute autonomous task.

**Input Schema**:
```json
{
  "task": "Research and summarize recent AI developments",
  "tools": ["search", "summarize"],
  "maxSteps": 10
}
```

**Output**: Task execution result

#### add_memory
Add to agent memory.

**Input Schema**:
```json
{
  "type": "fact",
  "content": "User prefers concise responses",
  "tags": ["preference"]
}
```

**Output**: Memory storage confirmation

#### query_memory
Query agent memory.

**Input Schema**:
```json
{
  "query": "user preferences",
  "limit": 10
}
```

**Output**: Memory results

#### get_capabilities
Get agent capabilities.

**Input Schema**: None required

**Output**: List of capabilities

---

## Tool Usage Patterns

### Sequential Tool Usage
```json
{
  "workflow": [
    {
      "tool": "search_bills",
      "args": { "query": "climate" }
    },
    {
      "tool": "execute_chain",
      "args": {
        "chainType": "summarize",
        "input": "${previous.output}"
      }
    }
  ]
}
```

### Parallel Tool Usage
```json
{
  "parallel": [
    { "tool": "get_bill", "args": {...} },
    { "tool": "get_member_details", "args": {...} }
  ]
}
```

### Conditional Tool Usage
```json
{
  "conditional": {
    "if": "${bill.status === 'passed'}",
    "then": { "tool": "create_trace", "args": {...} },
    "else": { "tool": "add_memory", "args": {...} }
  }
}
```

## Best Practices

1. **Input Validation**: Always validate input parameters
2. **Error Handling**: Implement proper error handling
3. **Rate Limiting**: Respect API rate limits
4. **Caching**: Cache frequently used results
5. **Logging**: Log all tool executions for debugging
6. **Security**: Sanitize inputs, protect API keys
7. **Monitoring**: Track tool usage and performance
8. **Documentation**: Keep tool documentation up to date

## Support

For tool-specific issues:
- Check individual server implementations in `src/servers/`
- Review API documentation for external services
- Test tools using `npm run test:tool -- <tool_name>`
- See `agents.md` for agent-level documentation
