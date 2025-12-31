#!/usr/bin/env node

/**
 * Test script for MCP Server
 * 
 * This script tests the MCP server endpoints locally or remotely.
 * 
 * Usage: node scripts/test.js [url]
 * 
 * Examples:
 *   node scripts/test.js                          # Test local dev server
 *   node scripts/test.js https://your-worker.dev  # Test deployed server
 */

const https = require('https');
const http = require('http');

const testUrl = process.argv[2] || 'http://localhost:8787';

console.log('🧪 Testing MCP Server\n');
console.log(`📍 Target: ${testUrl}\n`);

async function makeRequest(path, method = 'GET', body = null) {
  const url = new URL(path, testUrl);
  const isHttps = url.protocol === 'https:';
  const client = isHttps ? https : http;

  return new Promise((resolve, reject) => {
    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = client.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (error) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

async function runTests() {
  const tests = [
    {
      name: 'Server Info (GET /)',
      test: async () => {
        const result = await makeRequest('/', 'GET');
        return result.status === 200 && result.data.protocol === 'mcp';
      },
    },
    {
      name: 'Initialize',
      test: async () => {
        const result = await makeRequest('/', 'POST', {
          jsonrpc: '2.0',
          method: 'initialize',
          params: {},
          id: 1,
        });
        return result.status === 200 && result.data.result?.serverInfo;
      },
    },
    {
      name: 'List Tools',
      test: async () => {
        const result = await makeRequest('/', 'POST', {
          jsonrpc: '2.0',
          method: 'tools/list',
          params: {},
          id: 2,
        });
        return result.status === 200 && Array.isArray(result.data.result?.tools);
      },
    },
    {
      name: 'Call Echo Tool',
      test: async () => {
        const result = await makeRequest('/', 'POST', {
          jsonrpc: '2.0',
          method: 'tools/call',
          params: {
            name: 'echo',
            arguments: { message: 'Hello, MCP!' },
          },
          id: 3,
        });
        return result.status === 200 && result.data.result?.content;
      },
    },
    {
      name: 'List Resources',
      test: async () => {
        const result = await makeRequest('/', 'POST', {
          jsonrpc: '2.0',
          method: 'resources/list',
          params: {},
          id: 4,
        });
        return result.status === 200 && Array.isArray(result.data.result?.resources);
      },
    },
    {
      name: 'List Prompts',
      test: async () => {
        const result = await makeRequest('/', 'POST', {
          jsonrpc: '2.0',
          method: 'prompts/list',
          params: {},
          id: 5,
        });
        return result.status === 200 && Array.isArray(result.data.result?.prompts);
      },
    },
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      process.stdout.write(`Testing: ${test.name}... `);
      const result = await test.test();
      if (result) {
        console.log('✅ PASS');
        passed++;
      } else {
        console.log('❌ FAIL');
        failed++;
      }
    } catch (error) {
      console.log(`❌ ERROR: ${error.message}`);
      failed++;
    }
  }

  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(error => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});
