/**
 * Test Live Deployment
 * Tests a deployed DeepSeek API instance
 */

const BASE_URL = process.argv[2] || 'https://vertexaideepseek.vercel.app';
const API_KEY = process.argv[3] || 'sk-adminkey02';

console.log('🧪 Testing Live Deployment\n');
console.log('='.repeat(60));
console.log(`URL: ${BASE_URL}`);
console.log(`API Key: ${API_KEY}`);
console.log('='.repeat(60));

async function test1_HealthCheck() {
    console.log('\n📋 Test 1: Health Check');
    console.log('-'.repeat(60));
    
    try {
        const response = await fetch(`${BASE_URL}/health`);
        const data = await response.json();
        
        console.log('Status:', response.status);
        console.log('Response:', JSON.stringify(data, null, 2));
        
        return response.status === 200;
    } catch (error) {
        console.error('❌ Error:', error.message);
        return false;
    }
}

async function test2_ListModels() {
    console.log('\n📋 Test 2: List Models');
    console.log('-'.repeat(60));
    
    try {
        const response = await fetch(`${BASE_URL}/v1/models`, {
            headers: {
                'Authorization': `Bearer ${API_KEY}`
            }
        });
        const data = await response.json();
        
        console.log('Status:', response.status);
        console.log('Models:', data.data?.map(m => m.id).join(', '));
        
        return response.status === 200 && data.data?.length > 0;
    } catch (error) {
        console.error('❌ Error:', error.message);
        return false;
    }
}

async function test3_BasicChat() {
    console.log('\n💬 Test 3: Basic Chat (DeepSeek-V3)');
    console.log('-'.repeat(60));
    
    try {
        const response = await fetch(`${BASE_URL}/v1/chat/completions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'deepseek-v3',
                messages: [
                    { role: 'user', content: 'Say "Hello from Vercel!"' }
                ]
            })
        });
        
        const data = await response.json();
        
        console.log('Status:', response.status);
        if (data.choices && data.choices[0]) {
            console.log('Response:', data.choices[0].message.content);
            return true;
        } else {
            console.log('Error:', JSON.stringify(data, null, 2));
            return false;
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
        return false;
    }
}

async function test4_SystemPrompt() {
    console.log('\n💬 Test 4: System Prompt');
    console.log('-'.repeat(60));
    
    try {
        const response = await fetch(`${BASE_URL}/v1/chat/completions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'deepseek-v3',
                messages: [
                    { role: 'system', content: 'You are a helpful assistant. Be very brief.' },
                    { role: 'user', content: 'What is 2+2?' }
                ]
            })
        });
        
        const data = await response.json();
        
        console.log('Status:', response.status);
        if (data.choices && data.choices[0]) {
            console.log('Response:', data.choices[0].message.content);
            return true;
        } else {
            console.log('Error:', JSON.stringify(data, null, 2));
            return false;
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
        return false;
    }
}

async function test5_StreamingChat() {
    console.log('\n🌊 Test 5: Streaming Chat');
    console.log('-'.repeat(60));
    
    try {
        const response = await fetch(`${BASE_URL}/v1/chat/completions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'deepseek-v3',
                messages: [
                    { role: 'user', content: 'Count from 1 to 3' }
                ],
                stream: true
            })
        });
        
        console.log('Status:', response.status);
        
        if (!response.ok) {
            const error = await response.text();
            console.log('Error:', error);
            return false;
        }
        
        process.stdout.write('Stream: ');
        
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');
            
            for (const line of lines) {
                if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                    try {
                        const json = JSON.parse(line.slice(6));
                        const content = json.choices?.[0]?.delta?.content || '';
                        process.stdout.write(content);
                    } catch (e) {
                        // Skip invalid JSON
                    }
                }
            }
        }
        
        console.log('\n');
        return true;
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        return false;
    }
}

async function test6_InvalidAuth() {
    console.log('\n❌ Test 6: Invalid API Key');
    console.log('-'.repeat(60));
    
    try {
        const response = await fetch(`${BASE_URL}/v1/chat/completions`, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer invalid-key',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'deepseek-v3',
                messages: [{ role: 'user', content: 'test' }]
            })
        });
        
        console.log('Status:', response.status);
        const data = await response.json();
        console.log('Response:', JSON.stringify(data, null, 2));
        
        return response.status === 401;
    } catch (error) {
        console.error('❌ Error:', error.message);
        return false;
    }
}

// Run all tests
(async () => {
    const results = [];
    
    try {
        results.push({ name: 'Health Check', pass: await test1_HealthCheck() });
        results.push({ name: 'List Models', pass: await test2_ListModels() });
        results.push({ name: 'Basic Chat', pass: await test3_BasicChat() });
        results.push({ name: 'System Prompt', pass: await test4_SystemPrompt() });
        results.push({ name: 'Streaming', pass: await test5_StreamingChat() });
        results.push({ name: 'Invalid Auth', pass: await test6_InvalidAuth() });
        
        console.log('\n' + '='.repeat(60));
        console.log('\n📊 Test Results Summary\n');
        
        results.forEach(r => {
            console.log(`${r.pass ? '✅' : '❌'} ${r.name}`);
        });
        
        const passed = results.filter(r => r.pass).length;
        const total = results.length;
        
        console.log(`\n${passed}/${total} tests passed`);
        
        if (passed === total) {
            console.log('\n🎉 All tests passed! Your deployment is working perfectly!\n');
        } else {
            console.log('\n⚠️  Some tests failed. Check output above.\n');
        }
        
    } catch (error) {
        console.error('\n❌ Test suite failed:', error.message);
        console.error(error.stack);
    }
})();
