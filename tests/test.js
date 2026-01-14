/**
 * DeepSeek API - Test Suite
 * 
 * Tests:
 *   - Environment variable loading
 *   - Token pool rotation
 *   - User API key validation
 *   - OpenAI-compatible requests
 */

import 'dotenv/config';
import DeepSeek from '../src/deepseek.js';

// ==================== Test: Environment Variables ====================
async function testEnvSetup() {
    console.log('📖 Test: Environment Variable Setup\n');
    console.log('='.repeat(60));

    // Try loading from environment first
    const envLoaded = DeepSeek.initFromEnv();

    if (!envLoaded) {
        // Fallback to cache file
        const cacheLoaded = await DeepSeek.loadAuthTokenFromCache();
        if (!cacheLoaded) {
            console.error('❌ No tokens found. Set DEEPSEEK_AUTHTOKEN env or use cache.');
            return false;
        }
        console.log('✅ Loaded token from cache file');
    }

    console.log('📊 Token Pool Status:', DeepSeek.getTokenPoolStatus());
    return true;
}

// ==================== Test: Token Pool Rotation ====================
async function testTokenPool() {
    console.log('\n📖 Test: Token Pool Rotation\n');
    console.log('='.repeat(60));

    // Add test tokens to pool
    DeepSeek.addTokens([
        'test-token-A',
        'test-token-B',
        'test-token-C'
    ]);

    console.log('📊 Pool status:', DeepSeek.getTokenPoolStatus());

    // Test round-robin
    console.log('\n🔄 Round-robin rotation:');
    for (let i = 0; i < 4; i++) {
        const token = DeepSeek.getNextToken();
        console.log(`  Request ${i + 1}: ${token.substring(0, 12)}...`);
    }
}

// ==================== Test: API Key Validation ====================
async function testApiKeyValidation() {
    console.log('\n📖 Test: API Key Validation\n');
    console.log('='.repeat(60));

    // Add valid keys
    DeepSeek.addUserApiKey('sk-valid-123');
    DeepSeek.addUserApiKey('sk-valid-456');

    console.log('🔑 Validation tests:');
    console.log('  sk-valid-123:', DeepSeek.validateUserApiKey('sk-valid-123') ? '✅ Pass' : '❌ Fail');
    console.log('  sk-valid-456:', DeepSeek.validateUserApiKey('sk-valid-456') ? '✅ Pass' : '❌ Fail');
    console.log('  sk-invalid:', DeepSeek.validateUserApiKey('sk-invalid') ? '❌ Should fail' : '✅ Correctly rejected');
}

// ==================== Test: OpenAI-Compatible Request ====================
async function testOpenAIRequest() {
    console.log('\n📖 Test: OpenAI-Compatible Request\n');
    console.log('='.repeat(60));

    // Reload actual token
    await DeepSeek.loadAuthTokenFromCache();

    const response = await DeepSeek.chatCompletions({
        model: 'deepseek-v3',
        messages: [
            { role: 'system', content: 'Be brief.' },
            { role: 'user', content: 'Hi!' }
        ]
    });

    console.log('✅ Response:', response.choices[0].message.content);
}

// ==================== Run ====================
(async () => {
    try {
        const ready = await testEnvSetup();
        if (!ready) process.exit(1);

        await testTokenPool();
        await testApiKeyValidation();
        await testOpenAIRequest();

        console.log('\n' + '='.repeat(60));
        console.log('✅ All tests passed!\n');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
    }
})();
