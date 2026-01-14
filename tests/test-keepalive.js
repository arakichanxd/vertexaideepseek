/**
 * Test Keep-Alive Functionality
 * Verifies that automatic token keep-alive works correctly
 */

import DeepSeek from '../src/deepseek.js';
import dotenv from 'dotenv';
dotenv.config();

console.log('🧪 Testing Keep-Alive System\n');
console.log('='.repeat(60));

async function testKeepAlive() {
    // Initialize
    const envLoaded = DeepSeek.initFromEnv();
    if (!envLoaded) {
        await DeepSeek.loadAuthTokenFromCache();
    }

    if (!DeepSeek.hasAuthToken()) {
        console.error('❌ No DeepSeek token found!');
        process.exit(1);
    }

    console.log('\n📖 Test 1: Manual Keep-Alive Ping\n');
    console.log('-'.repeat(60));

    const result = await DeepSeek.keepAlivePing();
    console.log('Result:', result ? '✅ Success' : '❌ Failed');

    console.log('\n📖 Test 2: Keep-Alive Status\n');
    console.log('-'.repeat(60));

    const status = DeepSeek.getKeepAliveStatus();
    console.log('Status:', JSON.stringify(status, null, 2));

    console.log('\n📖 Test 3: Start Automatic Keep-Alive (1 minute interval)\n');
    console.log('-'.repeat(60));

    DeepSeek.startKeepAlive(1); // 1 minute for testing

    console.log('Waiting for 2 pings (2 minutes)...');
    console.log('Press Ctrl+C to stop\n');

    // Wait for 2.5 minutes to see 2 pings
    await new Promise(resolve => setTimeout(resolve, 150000));

    console.log('\n📖 Final Status\n');
    console.log('-'.repeat(60));

    const finalStatus = DeepSeek.getKeepAliveStatus();
    console.log('Status:', JSON.stringify(finalStatus, null, 2));

    DeepSeek.stopKeepAlive();

    console.log('\n' + '='.repeat(60));
    console.log('\n✅ Keep-Alive Test Complete!\n');
}

testKeepAlive().catch(error => {
    console.error('\n❌ Test Failed:', error.message);
    DeepSeek.stopKeepAlive();
    process.exit(1);
});
