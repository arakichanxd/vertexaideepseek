/**
 * Test OpenAI Streaming Format Compliance
 * Verifies exact match with OpenAI API streaming specification
 */

import 'dotenv/config';

const BASE_URL = 'http://localhost:3000';
const API_KEY = process.env.API_KEY || 'sk-key';

console.log('🧪 Testing OpenAI Streaming Format Compliance\n');
console.log('='.repeat(60));

async function testStreamingFormat() {
    console.log('\n📋 Test: Streaming Response Format');
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
                messages: [{ role: 'user', content: 'Count from 1 to 5' }],
                stream: true
            })
        });
        
        if (!response.ok) {
            console.log('❌ Request failed:', response.status);
            return false;
        }
        
        console.log('✅ Status:', response.status);
        console.log('✅ Content-Type:', response.headers.get('content-type'));
        
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        
        let chunkCount = 0;
        let hasRole = false;
        let hasContent = false;
        let hasDone = false;
        let hasFinishReason = false;
        
        console.log('\n📦 Streaming Chunks:\n');
        
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');
            
            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6);
                    
                    if (data === '[DONE]') {
                        console.log('✅ Received [DONE] marker');
                        hasDone = true;
                        continue;
                    }
                    
                    try {
                        const json = JSON.parse(data);
                        chunkCount++;
                        
                        // Verify OpenAI format
                        if (!json.id || !json.object || !json.created || !json.model || !json.choices) {
                            console.log('❌ Invalid chunk format:', json);
                            return false;
                        }
                        
                        // Check object type
                        if (json.object !== 'chat.completion.chunk') {
                            console.log('❌ Wrong object type:', json.object);
                            return false;
                        }
                        
                        // Check choices structure
                        const choice = json.choices[0];
                        if (!choice || choice.index !== 0) {
                            console.log('❌ Invalid choices structure');
                            return false;
                        }
                        
                        // Check delta
                        if (!choice.delta) {
                            console.log('❌ Missing delta field');
                            return false;
                        }
                        
                        // First chunk should have role
                        if (choice.delta.role === 'assistant') {
                            hasRole = true;
                            console.log(`Chunk ${chunkCount}: role="${choice.delta.role}"`);
                        }
                        
                        // Content chunks
                        if (choice.delta.content) {
                            hasContent = true;
                            console.log(`Chunk ${chunkCount}: content="${choice.delta.content}"`);
                        }
                        
                        // Final chunk
                        if (choice.finish_reason === 'stop') {
                            hasFinishReason = true;
                            console.log(`Chunk ${chunkCount}: finish_reason="stop"`);
                        }
                        
                    } catch (e) {
                        console.log('❌ JSON parse error:', e.message);
                        return false;
                    }
                }
            }
        }
        
        console.log('\n📊 Validation Results:');
        console.log(`   Total chunks: ${chunkCount}`);
        console.log(`   Has role: ${hasRole ? '✅' : '❌'}`);
        console.log(`   Has content: ${hasContent ? '✅' : '❌'}`);
        console.log(`   Has finish_reason: ${hasFinishReason ? '✅' : '❌'}`);
        console.log(`   Has [DONE]: ${hasDone ? '✅' : '❌'}`);
        
        return hasRole && hasContent && hasFinishReason && hasDone;
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        return false;
    }
}

async function testReasoningStreaming() {
    console.log('\n📋 Test: Reasoning Model Streaming (with <think> tags)');
    console.log('-'.repeat(60));
    
    try {
        const response = await fetch(`${BASE_URL}/v1/chat/completions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'deepseek-r1',
                messages: [{ role: 'user', content: 'What is 5+3?' }],
                stream: true
            })
        });
        
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        
        let fullContent = '';
        let hasThinkTag = false;
        
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');
            
            for (const line of lines) {
                if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                    try {
                        const json = JSON.parse(line.slice(6));
                        const content = json.choices[0]?.delta?.content || '';
                        fullContent += content;
                        
                        if (content.includes('<think>')) {
                            hasThinkTag = true;
                        }
                    } catch (e) {
                        // Skip
                    }
                }
            }
        }
        
        console.log('✅ Reasoning response received');
        console.log(`   Has <think> tags: ${hasThinkTag ? '✅' : '❌'}`);
        console.log(`   Content length: ${fullContent.length} chars`);
        
        return hasThinkTag;
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        return false;
    }
}

async function testNonStreaming() {
    console.log('\n📋 Test: Non-Streaming Response Format');
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
                messages: [{ role: 'user', content: 'Say hello' }],
                stream: false
            })
        });
        
        const data = await response.json();
        
        // Verify OpenAI format
        const valid = (
            data.id &&
            data.object === 'chat.completion' &&
            data.created &&
            data.model &&
            data.choices &&
            data.choices[0].message &&
            data.choices[0].message.role === 'assistant' &&
            data.choices[0].message.content &&
            data.choices[0].finish_reason === 'stop' &&
            data.usage
        );
        
        console.log('✅ Response format:', valid ? 'Valid' : 'Invalid');
        console.log('   Object:', data.object);
        console.log('   Model:', data.model);
        console.log('   Role:', data.choices[0].message.role);
        console.log('   Finish reason:', data.choices[0].finish_reason);
        
        return valid;
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        return false;
    }
}

// Run all tests
(async () => {
    const results = [];
    
    try {
        results.push({ name: 'Streaming Format', pass: await testStreamingFormat() });
        results.push({ name: 'Reasoning Streaming', pass: await testReasoningStreaming() });
        results.push({ name: 'Non-Streaming Format', pass: await testNonStreaming() });
        
        console.log('\n' + '='.repeat(60));
        console.log('\n📊 Test Results Summary\n');
        
        results.forEach(r => {
            console.log(`${r.pass ? '✅' : '❌'} ${r.name}`);
        });
        
        const passed = results.filter(r => r.pass).length;
        const total = results.length;
        
        console.log(`\n${passed}/${total} tests passed`);
        
        if (passed === total) {
            console.log('\n🎉 100% OpenAI Streaming Format Compliant!\n');
        } else {
            console.log('\n⚠️  Some tests failed.\n');
        }
        
    } catch (error) {
        console.error('\n❌ Test suite failed:', error.message);
    }
})();
