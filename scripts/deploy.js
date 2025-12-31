#!/usr/bin/env node

/**
 * Deployment script for Cloudflare MCP Servers
 * 
 * This script automates the deployment of MCP servers to Cloudflare Workers
 * using the Cloudflare API.
 * 
 * Usage: node scripts/deploy.js [options]
 * 
 * Options:
 *   --name      Worker name (default: from wrangler.toml)
 *   --env       Environment (production, staging, etc.)
 *   --api-token Cloudflare API token (or set CLOUDFLARE_API_TOKEN env var)
 *   --account   Cloudflare account ID (or set CLOUDFLARE_ACCOUNT_ID env var)
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  name: getArg('--name'),
  env: getArg('--env') || 'production',
  apiToken: getArg('--api-token') || process.env.CLOUDFLARE_API_TOKEN,
  accountId: getArg('--account') || process.env.CLOUDFLARE_ACCOUNT_ID,
};

function getArg(name) {
  const index = args.indexOf(name);
  return index !== -1 && args[index + 1] ? args[index + 1] : null;
}

async function deploy() {
  console.log('🚀 Starting MCP Server deployment to Cloudflare...\n');

  // Validate required options
  if (!options.apiToken) {
    console.error('❌ Error: CLOUDFLARE_API_TOKEN is required');
    console.error('   Set via --api-token flag or CLOUDFLARE_API_TOKEN environment variable');
    process.exit(1);
  }

  if (!options.accountId) {
    console.error('❌ Error: CLOUDFLARE_ACCOUNT_ID is required');
    console.error('   Set via --account flag or CLOUDFLARE_ACCOUNT_ID environment variable');
    process.exit(1);
  }

  // Read wrangler.toml to get worker name if not provided
  if (!options.name) {
    try {
      const wranglerPath = path.join(__dirname, '..', 'wrangler.toml');
      const wranglerContent = fs.readFileSync(wranglerPath, 'utf8');
      const nameMatch = wranglerContent.match(/name\s*=\s*"([^"]+)"/);
      if (nameMatch) {
        options.name = nameMatch[1];
      }
    } catch (error) {
      console.error('❌ Error reading wrangler.toml:', error.message);
    }
  }

  if (!options.name) {
    console.error('❌ Error: Worker name is required');
    console.error('   Set via --name flag or in wrangler.toml');
    process.exit(1);
  }

  console.log(`📦 Deploying worker: ${options.name}`);
  console.log(`🌍 Environment: ${options.env}`);
  console.log(`🔑 Account ID: ${options.accountId}\n`);

  try {
    // Step 1: Build the worker
    console.log('📦 Building TypeScript...');
    const { execSync } = require('child_process');
    execSync('npm run build', { stdio: 'inherit' });
    console.log('✅ Build complete\n');

    // Step 2: Deploy using wrangler
    console.log('🚀 Deploying to Cloudflare...');
    execSync('npm run deploy:worker', { stdio: 'inherit' });
    console.log('✅ Deployment complete\n');

    // Step 3: Get worker info
    console.log('📊 Fetching worker information...');
    const workerInfo = await getWorkerInfo(options.accountId, options.name, options.apiToken);
    
    if (workerInfo) {
      console.log('\n✅ Deployment successful!');
      console.log(`\n🔗 Worker URL: https://${options.name}.${options.accountId}.workers.dev`);
      console.log(`\n📝 Worker details:`);
      console.log(`   Name: ${workerInfo.id || options.name}`);
      console.log(`   Created: ${workerInfo.created_on || 'N/A'}`);
      console.log(`   Modified: ${workerInfo.modified_on || 'N/A'}`);
    } else {
      console.log('\n✅ Deployment complete!');
      console.log(`\n🔗 Worker URL: https://${options.name}.${options.accountId}.workers.dev`);
    }

    console.log('\n🎉 Your MCP server is now live on Cloudflare!');
    
  } catch (error) {
    console.error('\n❌ Deployment failed:', error.message);
    process.exit(1);
  }
}

/**
 * Get worker information from Cloudflare API
 */
function getWorkerInfo(accountId, workerName, apiToken) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.cloudflare.com',
      path: `/client/v4/accounts/${accountId}/workers/scripts/${workerName}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.success) {
            resolve(parsed.result);
          } else {
            console.warn('⚠️  Could not fetch worker info:', parsed.errors);
            resolve(null);
          }
        } catch (error) {
          resolve(null);
        }
      });
    });

    req.on('error', (error) => {
      console.warn('⚠️  Could not fetch worker info:', error.message);
      resolve(null);
    });

    req.end();
  });
}

// Run deployment
deploy().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
