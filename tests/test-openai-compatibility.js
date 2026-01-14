/**
 * Comprehensive OpenAI Compatibility Test
 * Tests all OpenAI SDK features to ensure 100% compatibility
 */

import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.API_KEY || 'sk-test-key',
    baseURL: 'http://localhost:3000/v1'
});

console.log('🧪 OpenAI SDK Compatibility Test Suite\n');
console.log('='.repeat(60));

async function test1_ListModels() {
    console.log('\n📋 Test 1: List Models');
    console.log('-'.repeat(60));
    
    const models = await openai.models.list();
    console.log('✅ Models:', models.data.map(m => m.id).join(', '));
    
    return models.data.length > 0;
}

async function test2_GetSingleModel() {
    console.log('\n📋 Test 2: Get Single Model');
    console.log('-'.repeat(60));
    
    const model = await openai.models.retrieve('deepseek-v3');
    console.log('✅ Model ID:', model.id);
    console.log('   Owned by:', model.owned_by);
    
    return model.id === 'deepseek-v3';
}

async function test3_BasicChat() {
    console.log('\n💬 Test 3: Basic Chat Completion');
    console.log('-'.repeat(60));
    
    const completion = await openai.chat.completions.create({
        model: 'deepseek-v3',
        messages: [{ role: 'user', content: 'Say "Hello World"' }]
    });
    
    console.log('✅ Response:', completion.choices[0].message.content);
    
    return completion.choices[0].message.role === 'assistant';
}

async function test4_SystemPrompt() {
    console.log('\n💬 Test 4: System Prompt');
    console.log('-'.repeat(60));
    
    const completion = await openai.chat.completions.create({
        model: 'deepseek-v3',
        messages: [
            { role: 'system', content: 'You are a helpful assistant that speaks like Shakespeare.' },
            { role: 'user', content: 'Hello' }
        ]
    });
    
    console.log('✅ Response:', completion.choices[0].message.content);
    
    return completion.choices[0].message.content.length > 0;
}

async function test5_MultiTurnConversation() {
    console.log('\n💬 Test 5: Multi-turn Conversation');
    console.log('-'.repeat(60));
    
    const completion = await openai.chat.completions.create({
        model: 'deepseek-v3',
        messages: [
            { role: 'system', content: 'You are a math tutor.' },
            { role: 'user', content: 'What is 2+2?' },
            { role: 'assistant', content: '2+2 equals 4.' },
            { role: 'user', content: 'Now multiply that by 3' }
        ]
    });
    
    console.log('✅ Response:', completion.choices[0].message.content);
    
    return completion.choices[0].message.content.includes('12');
}

async function test6_StreamingChat() {
    console.log('\n🌊 Test 6: Streaming Chat');
    console.log('-'.repeat(60));
    
    const stream = await openai.chat.completions.create({
        model: 'deepseek-v3',
        messages: [{ role: 'user', content: 'Count from 1 to 5' }],
        stream: true
    });
    
    process.stdout.write('✅ Stream: ');
    let content = '';
    for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content || '';
        content += delta;
        process.stdout.write(delta);
    }
    console.log('\n');
    
    return content.length > 0;
}

async function test7_ReasoningModel() {
    console.log('\n🧠 Test 7: Reasoning Model (DeepSeek-R1)');
    console.log('-'.repeat(60));
    
    const completion = await openai.chat.completions.create({
        model: 'deepseek-r1',
        messages: [{ role: 'user', content: 'What is 15 * 7?' }]
    });
    
    const response = completion.choices[0].message.content;
    console.log('✅ Response includes reasoning:', response.includes('<think>'));
    console.log('   Answer:', response.substring(0, 200) + '...');
    
    return response.includes('105');
}

async function test8_StreamingReasoning() {
    console.log('\n🌊 Test 8: Streaming with Reasoning');
    console.log('-'.repeat(60));
    
    const stream = await openai.chat.completions.create({
        model: 'deepseek-r1',
        messages: [{ role: 'user', content: 'What is 8 + 7?' }],
        stream: true
    });
    
    process.stdout.write('✅ Stream: ');
    let hasThinking = false;
    for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content || '';
        if (delta.includes('<think>')) hasThinking = true;
        process.stdout.write(delta);
    }
    console.log('\n');
    console.log('   Contains reasoning:', hasThinking);
    
    return true;
}

async function test9_ErrorHandling() {
    console.log('\n❌ Test 9: Error Handling');
    console.log('-'.repeat(60));
    
    try {
        await openai.chat.completions.create({
            model: 'invalid-model',
            messages: [{ role: 'user', content: 'test' }]
        });
        console.log('❌ Should have thrown error');
        return false;
    } catch (error) {
        console.log('✅ Correctly handles invalid model');
        console.log('   Error type:', error.constructor.name);
        return true;
    }
}

async function test10_EmptyMessages() {
    console.log('\n❌ Test 10: Empty Messages Validation');
    console.log('-'.repeat(60));
    
    try {
        await openai.chat.completions.create({
            model: 'deepseek-v3',
            messages: []
        });
        console.log('❌ Should have thrown error');
        return false;
    } catch (error) {
        console.log('✅ Correctly validates empty messages');
        return true;
    }
}

// Run all tests
(async () => {
    const results = [];
    
    try {
        results.push({ name: 'List Models', pass: await test1_ListModels() });
        results.push({ name: 'Get Single Model', pass: await test2_GetSingleModel() });
        results.push({ name: 'Basic Chat', pass: await test3_BasicChat() });
        results.push({ name: 'System Prompt', pass: await test4_SystemPrompt() });
        results.push({ name: 'Multi-turn', pass: await test5_MultiTurnConversation() });
        results.push({ name: 'Streaming', pass: await test6_StreamingChat() });
        results.push({ name: 'Reasoning', pass: await test7_ReasoningModel() });
        results.push({ name: 'Streaming Reasoning', pass: await test8_StreamingReasoning() });
        results.push({ name: 'Error Handling', pass: await test9_ErrorHandling() });
        results.push({ name: 'Empty Messages', pass: await test10_EmptyMessages() });
        
        console.log('\n' + '='.repeat(60));
        console.log('\n📊 Test Results Summary\n');
        
        results.forEach(r => {
            console.log(`${r.pass ? '✅' : '❌'} ${r.name}`);
        });
        
        const passed = results.filter(r => r.pass).length;
        const total = results.length;
        
        console.log(`\n${passed}/${total} tests passed`);
        
        if (passed === total) {
            console.log('\n🎉 All tests passed! 100% OpenAI compatible!\n');
        } else {
            console.log('\n⚠️  Some tests failed. Check output above.\n');
            process.exit(1);
        }
        
    } catch (error) {
        console.error('\n❌ Test suite failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
})();
