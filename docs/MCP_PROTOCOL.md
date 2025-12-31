# MCP Protocol Specification Summary

This document provides a quick reference for the Model Context Protocol (MCP) specification relevant to Cloudflare Workers implementations.

## JSON-RPC 2.0 Base

MCP is built on JSON-RPC 2.0. All messages follow this format.

### Request Format

```json
{
  "jsonrpc": "2.0",
  "method": "method_name",
  "params": {
    // Method-specific parameters
  },
  "id": 1
}
```

### Response Format (Success)

```json
{
  "jsonrpc": "2.0",
  "result": {
    // Result data
  },
  "id": 1
}
```

### Response Format (Error)

```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32600,
    "message": "Error description",
    "data": {} // Optional
  },
  "id": 1
}
```

## Core Methods

### initialize

**Purpose**: Establish connection and negotiate capabilities

**Request**:
```json
{
  "jsonrpc": "2.0",
  "method": "initialize",
  "params": {
    "protocolVersion": "1.0.0",
    "capabilities": {
      "tools": {},
      "resources": {}
    },
    "clientInfo": {
      "name": "ExampleClient",
      "version": "1.0.0"
    }
  },
  "id": 1
}
```

**Response**:
```json
{
  "jsonrpc": "2.0",
  "result": {
    "protocolVersion": "1.0.0",
    "capabilities": {
      "tools": true,
      "resources": true,
      "prompts": true
    },
    "serverInfo": {
      "name": "ExampleServer",
      "version": "1.0.0"
    }
  },
  "id": 1
}
```

## Tools

### tools/list

**Purpose**: List all available tools

**Request**:
```json
{
  "jsonrpc": "2.0",
  "method": "tools/list",
  "params": {},
  "id": 2
}
```

**Response**:
```json
{
  "jsonrpc": "2.0",
  "result": {
    "tools": [
      {
        "name": "tool_name",
        "description": "What this tool does",
        "inputSchema": {
          "type": "object",
          "properties": {
            "param1": {
              "type": "string",
              "description": "Parameter description"
            }
          },
          "required": ["param1"]
        }
      }
    ]
  },
  "id": 2
}
```

### tools/call

**Purpose**: Execute a tool

**Request**:
```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "tool_name",
    "arguments": {
      "param1": "value1"
    }
  },
  "id": 3
}
```

**Response**:
```json
{
  "jsonrpc": "2.0",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "Result text"
      }
    ]
  },
  "id": 3
}
```

## Resources

### resources/list

**Purpose**: List available resources

**Request**:
```json
{
  "jsonrpc": "2.0",
  "method": "resources/list",
  "params": {},
  "id": 4
}
```

**Response**:
```json
{
  "jsonrpc": "2.0",
  "result": {
    "resources": [
      {
        "uri": "resource://path",
        "name": "Resource Name",
        "description": "What this resource contains",
        "mimeType": "application/json"
      }
    ]
  },
  "id": 4
}
```

### resources/read

**Purpose**: Read a resource

**Request**:
```json
{
  "jsonrpc": "2.0",
  "method": "resources/read",
  "params": {
    "uri": "resource://path"
  },
  "id": 5
}
```

**Response**:
```json
{
  "jsonrpc": "2.0",
  "result": {
    "contents": [
      {
        "uri": "resource://path",
        "mimeType": "application/json",
        "text": "{\"data\": \"value\"}"
      }
    ]
  },
  "id": 5
}
```

## Prompts

### prompts/list

**Purpose**: List available prompt templates

**Request**:
```json
{
  "jsonrpc": "2.0",
  "method": "prompts/list",
  "params": {},
  "id": 6
}
```

**Response**:
```json
{
  "jsonrpc": "2.0",
  "result": {
    "prompts": [
      {
        "name": "prompt_name",
        "description": "What this prompt does",
        "arguments": [
          {
            "name": "arg1",
            "description": "Argument description",
            "required": true
          }
        ]
      }
    ]
  },
  "id": 6
}
```

### prompts/get

**Purpose**: Get a prompt template

**Request**:
```json
{
  "jsonrpc": "2.0",
  "method": "prompts/get",
  "params": {
    "name": "prompt_name",
    "arguments": {
      "arg1": "value1"
    }
  },
  "id": 7
}
```

**Response**:
```json
{
  "jsonrpc": "2.0",
  "result": {
    "messages": [
      {
        "role": "user",
        "content": {
          "type": "text",
          "text": "Prompt text with value1"
        }
      }
    ]
  },
  "id": 7
}
```

## Error Codes

Standard JSON-RPC 2.0 error codes:

| Code | Message | Meaning |
|------|---------|---------|
| -32700 | Parse error | Invalid JSON |
| -32600 | Invalid Request | Request object is invalid |
| -32601 | Method not found | Method doesn't exist |
| -32602 | Invalid params | Invalid method parameters |
| -32603 | Internal error | Internal JSON-RPC error |

## Content Types

MCP supports various content types in responses:

### Text Content
```json
{
  "type": "text",
  "text": "Plain text content"
}
```

### Image Content
```json
{
  "type": "image",
  "data": "base64-encoded-image",
  "mimeType": "image/png"
}
```

### Resource Content
```json
{
  "type": "resource",
  "resource": {
    "uri": "resource://path",
    "mimeType": "application/json",
    "text": "{}"
  }
}
```

## Capabilities

Servers should advertise their capabilities:

```json
{
  "capabilities": {
    "tools": true,           // Server provides tools
    "resources": true,       // Server provides resources
    "prompts": true,         // Server provides prompts
    "logging": false         // Server supports logging
  }
}
```

## Best Practices

1. **Always validate input**: Check parameters before execution
2. **Handle errors gracefully**: Return proper JSON-RPC error responses
3. **Document tools well**: Clear descriptions and schemas
4. **Use appropriate content types**: Match content type to data
5. **Implement CORS**: Enable cross-origin requests
6. **Version your server**: Include version in serverInfo
7. **Test thoroughly**: Verify all methods work correctly

## Additional Resources

- Full MCP Specification: https://modelcontextprotocol.io/specification
- JSON-RPC 2.0 Spec: https://www.jsonrpc.org/specification
- JSON Schema: https://json-schema.org/
