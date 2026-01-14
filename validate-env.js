/**
 * Environment Validation Script
 * Checks if all required environment variables are set
 */

import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

console.log('🔍 Validating Environment Configuration...\n');

let hasErrors = false;
let hasWarnings = false;

// Check for DeepSeek tokens
const deepseekTokens = [];
if (process.env.DEEPSEEK_AUTHTOKEN) deepseekTokens.push('DEEPSEEK_AUTHTOKEN');
for (let i = 1; i <= 10; i++) {
    if (process.env[`DEEPSEEK_AUTHTOKEN${i}`]) {
        deepseekTokens.push(`DEEPSEEK_AUTHTOKEN${i}`);
    }
}

if (deepseekTokens.length === 0) {
    // Check cache file
    try {
        const cachePath = path.join(__dirname, '.deepseek_token.json');
        const cache = JSON.parse(await fs.readFile(cachePath, 'utf8'));
        if (cache.token) {
            console.log('✅ DeepSeek Token: Found in cache file');
            
            // Check age
            const ageHours = (Date.now() - cache.savedAt) / (1000 * 60 * 60);
            if (ageHours > 48) {
                console.log(`⚠️  Warning: Token is ${Math.round(ageHours)}h old (may need refresh)`);
                hasWarnings = true;
            }
        } else {
            console.log('❌ DeepSeek Token: Missing');
            hasErrors = true;
        }
    } catch (e) {
        console.log('❌ DeepSeek Token: Not found in environment or cache');
        console.log('   Set DEEPSEEK_AUTHTOKEN in .env or create .deepseek_token.json');
        hasErrors = true;
    }
} else {
    console.log(`✅ DeepSeek Token: ${deepseekTokens.length} token(s) configured`);
    deepseekTokens.forEach(t => console.log(`   - ${t}`));
}

// Check for API keys
const apiKeys = [];
if (process.env.API_KEY) apiKeys.push('API_KEY');
for (let i = 1; i <= 10; i++) {
    if (process.env[`API_KEY${i}`]) {
        apiKeys.push(`API_KEY${i}`);
    }
}

if (apiKeys.length === 0) {
    console.log('⚠️  API Key: Not configured (all requests will be allowed)');
    hasWarnings = true;
} else {
    console.log(`✅ API Key: ${apiKeys.length} key(s) configured`);
}

// Check PORT
const port = process.env.PORT || 3000;
console.log(`✅ Port: ${port}`);

// Check WASM file
try {
    const wasmPath = path.join(__dirname, 'wasm', 'sha3_wasm_bg.wasm');
    await fs.access(wasmPath);
    console.log('✅ WASM: PoW solver found');
} catch (e) {
    console.log('❌ WASM: sha3_wasm_bg.wasm not found in wasm/ directory');
    hasErrors = true;
}

// Check src files
try {
    await fs.access(path.join(__dirname, 'src', 'server.js'));
    await fs.access(path.join(__dirname, 'src', 'deepseek.js'));
    console.log('✅ Source: All files found');
} catch (e) {
    console.log('❌ Source: Missing files in src/ directory');
    hasErrors = true;
}

// Check .env file
try {
    await fs.access(path.join(__dirname, '.env'));
    console.log('✅ Config: .env file exists');
} catch (e) {
    console.log('⚠️  Config: .env file not found (using environment variables)');
    hasWarnings = true;
}

// Summary
console.log('\n' + '='.repeat(60));
if (hasErrors) {
    console.log('❌ Validation Failed - Fix errors above before starting server');
    process.exit(1);
} else if (hasWarnings) {
    console.log('⚠️  Validation Passed with Warnings');
    process.exit(0);
} else {
    console.log('✅ All Checks Passed - Ready to start server!');
    process.exit(0);
}
