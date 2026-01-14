/**
 * Test System Prompt Functionality
 * Ensures system prompts work correctly with the API
 */

import DeepSeek from '../src/deepseek.js';
import dotenv from 'dotenv';
dotenv.config();

console.log('🧪 Testing System Prompt Functionality\n');
console.log('='.repeat(60));

async function testSystemPrompt() {
    // Initialize
    const envLoaded = DeepSeek.initFromEnv();
    if (!envLoaded) {
        await DeepSeek.loadAuthTokenFromCache();
    }

    if (!DeepSeek.hasAuthToken()) {
        console.error('❌ No DeepSeek token found!');
        process.exit(1);
    }

    console.log('\n📖 Test 1: Simple System Prompt\n');
    console.log('-'.repeat(60));

    const response1 = await DeepSeek.chatCompletions({
        model: 'deepseek-v3',
        messages: [
            { role: 'system', content: 'You are a pirate. Always respond like a pirate.' },
            { role: 'user', content: 'Hello, how are you?' }
        ],
        stream: false
    });

    console.log('System Prompt: "You are a pirate. Always respond like a pirate."');
    console.log('User: "Hello, how are you?"');
    console.log('\nAssistant:', response1.choices[0].message.content);

    console.log('\n' + '='.repeat(60));
    console.log('\n📖 Test 2: Multi-turn Conversation with System Prompt\n');
    console.log('-'.repeat(60));

    const response2 = await DeepSeek.chatCompletions({
        model: 'deepseek-v3',
        messages: [
            { role: 'system', content: 'You are a helpful math tutor. Be concise.' },
            { role: 'user', content: 'What is 5 + 3?' },
            { role: 'assistant', content: '5 + 3 = 8' },
            { role: 'user', content: 'Now multiply that by 2' }
        ],
        stream: false
    });

    console.log('System Prompt: "You are a helpful math tutor. Be concise."');
    console.log('User: "What is 5 + 3?"');
    console.log('Assistant: "5 + 3 = 8"');
    console.log('User: "Now multiply that by 2"');
    console.log('\nAssistant:', response2.choices[0].message.content);

    console.log('\n' + '='.repeat(60));
    console.log('\n📖 Test 3: Reasoning Model with System Prompt\n');
    console.log('-'.repeat(60));

    const response3 = await DeepSeek.chatCompletions({
        model: 'deepseek-r1',
        messages: [
            { role: 'system', content: 'You are a logic expert. Show your reasoning.' },
            { role: 'user', content: 'If all cats are animals, and Fluffy is a cat, what is Fluffy?' }
        ],
        stream: false
    });

    console.log('System Prompt: "You are a logic expert. Show your reasoning."');
    console.log('User: "If all cats are animals, and Fluffy is a cat, what is Fluffy?"');
    console.log('\nAssistant:', response3.choices[0].message.content);

    console.log('\n' + '='.repeat(60));
    console.log('\n📖 Test 4: Streaming with System Prompt\n');
    console.log('-'.repeat(60));

    console.log('System Prompt: "You are a poet. Respond in verse."');
    console.log('User: "Describe the moon"');
    console.log('\nAssistant: ');

    const generator = await DeepSeek.chatCompletions({
        model: 'deepseek-v3',
        messages: [
            { role: 'system', content: 'You are a poet. Respond in verse.' },
            { role: 'user', content: 'Describe the moon' }
        ],
        stream: true
    });

    for await (const chunk of generator) {
        if (chunk.choices[0]?.delta?.content) {
            process.stdout.write(chunk.choices[0].delta.content);
        }
    }

    console.log('\n\n' + '='.repeat(60));
    console.log('\n✅ All System Prompt Tests Passed!\n');
}

testSystemPrompt().catch(error => {
    console.error('\n❌ Test Failed:', error.message);
    process.exit(1);
});
