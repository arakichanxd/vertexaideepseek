/**
 * Test script using official OpenAI SDK
 * Tests compatibility with the DeepSeek Reverse API server
 */

import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config();

// Initialize OpenAI client pointing to our local server
const openai = new OpenAI({
    apiKey: process.env.API_KEY || 'sk-test-key',
    baseURL: 'http://localhost:3000/v1'
});

async function main() {
    console.log('🧪 Testing OpenAI Compatibility...\n');

    try {
        // 1. List Models
        console.log('📋 Fetching models...');
        const models = await openai.models.list();
        console.log('   Models:', models.data.map(m => m.id).join(', '));

        // 2. Chat Completion (Non-Streaming)
        console.log('\n💬 Testing Chat Completion (deepseek-v3)...');
        const completion = await openai.chat.completions.create({
            model: 'deepseek-v3',
            messages: [{ role: 'user', content: 'Say "OpenAI SDK works!"' }],
        });
        console.log('   Response:', completion.choices[0].message.content);

        // 3. Chat Completion (Streaming)
        console.log('\n🌊 Testing Streaming (deepseek-r1)...');
        const stream = await openai.chat.completions.create({
            model: 'deepseek-r1',
            messages: [{ role: 'user', content: 'What is 10 + 10?' }],
            stream: true,
        });

        process.stdout.write('   Stream: ');
        for await (const chunk of stream) {
            process.stdout.write(chunk.choices[0]?.delta?.content || '');
        }
        console.log('\n\n✅ Test Complete!');

    } catch (error) {
        console.error('\n❌ Test Failed:', error);
    }
}

main();
