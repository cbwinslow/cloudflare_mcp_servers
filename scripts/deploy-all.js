#!/usr/bin/env node

/**
 * Multi-Server Deployment Script
 * 
 * Deploys multiple MCP servers to Cloudflare Workers
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CONFIG_FILE = 'mcp-config.json';
const SERVERS_DIR = 'src/servers';

// Load configuration
function loadConfig() {
  const configPath = path.join(__dirname, '..', CONFIG_FILE);
  if (!fs.existsSync(configPath)) {
    console.error('❌ Configuration file not found:', CONFIG_FILE);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(configPath, 'utf8'));
}

// Load environment variables
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) {
        process.env[key.trim()] = value.trim();
      }
    });
  }
}

// Create wrangler.toml for a server
function createWranglerConfig(serverName, serverConfig) {
  const envVars = {};
  for (const [key, value] of Object.entries(serverConfig.env || {})) {
    const envValue = value.replace(/\$\{(\w+)\}/g, (_, varName) => process.env[varName] || '');
    if (envValue && !envValue.includes('${')) {
      envVars[key] = envValue;
    }
  }

  const config = {
    name: serverConfig.deployment.workerName,
    main: serverConfig.deployment.scriptPath,
    compatibility_date: "2024-01-01",
    vars: envVars,
  };

  // Add KV namespaces if configured
  if (serverConfig.kvNamespaces) {
    config.kv_namespaces = serverConfig.kvNamespaces.map(ns => ({
      binding: ns.binding,
      id: process.env[ns.id.replace(/\$\{(\w+)\}/g, '$1')] || ns.id,
    }));
  }

  return config;
}

// Deploy a single server
async function deployServer(serverName, serverConfig) {
  console.log(`\n📦 Deploying ${serverName}...`);

  try {
    // Create temporary wrangler.toml
    const wranglerConfig = createWranglerConfig(serverName, serverConfig);
    const tempWranglerPath = path.join(__dirname, '..', `wrangler.${serverName}.toml`);
    
    // Convert to TOML format
    let tomlContent = `name = "${wranglerConfig.name}"\n`;
    tomlContent += `main = "${wranglerConfig.main}"\n`;
    tomlContent += `compatibility_date = "${wranglerConfig.compatibility_date}"\n\n`;
    
    if (wranglerConfig.vars && Object.keys(wranglerConfig.vars).length > 0) {
      tomlContent += '[vars]\n';
      for (const [key, value] of Object.entries(wranglerConfig.vars)) {
        tomlContent += `${key} = "${value}"\n`;
      }
      tomlContent += '\n';
    }

    if (wranglerConfig.kv_namespaces) {
      wranglerConfig.kv_namespaces.forEach(ns => {
        tomlContent += '[[kv_namespaces]]\n';
        tomlContent += `binding = "${ns.binding}"\n`;
        tomlContent += `id = "${ns.id}"\n\n`;
      });
    }

    fs.writeFileSync(tempWranglerPath, tomlContent);

    // Deploy using wrangler
    execSync(`npx wrangler deploy -c ${tempWranglerPath}`, {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..'),
    });

    // Clean up temporary file
    fs.unlinkSync(tempWranglerPath);

    console.log(`✅ ${serverName} deployed successfully!`);
    console.log(`   URL: https://${wranglerConfig.name}.workers.dev`);

    return true;
  } catch (error) {
    console.error(`❌ Failed to deploy ${serverName}:`, error.message);
    return false;
  }
}

// Main deployment function
async function main() {
  console.log('🚀 Multi-Server MCP Deployment\n');

  // Load configuration and environment
  const config = loadConfig();
  loadEnv();

  // Get servers to deploy
  const args = process.argv.slice(2);
  let serversToDeploy = Object.keys(config.mcpServers);

  if (args.length > 0 && args[0] !== '--all') {
    serversToDeploy = args.filter(name => config.mcpServers[name]);
    if (serversToDeploy.length === 0) {
      console.error('❌ No valid servers specified');
      console.log('\nAvailable servers:', Object.keys(config.mcpServers).join(', '));
      process.exit(1);
    }
  }

  console.log(`Deploying ${serversToDeploy.length} server(s):\n  - ${serversToDeploy.join('\n  - ')}\n`);

  // Deploy servers
  const results = [];
  for (const serverName of serversToDeploy) {
    const serverConfig = config.mcpServers[serverName];
    const success = await deployServer(serverName, serverConfig);
    results.push({ server: serverName, success });
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Deployment Summary\n');
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  results.forEach(({ server, success }) => {
    console.log(`  ${success ? '✅' : '❌'} ${server}`);
  });

  console.log(`\n  Total: ${results.length}`);
  console.log(`  Successful: ${successful}`);
  console.log(`  Failed: ${failed}`);
  console.log('='.repeat(50));

  if (failed > 0) {
    process.exit(1);
  }
}

// Run deployment
main().catch(error => {
  console.error('❌ Deployment failed:', error);
  process.exit(1);
});
