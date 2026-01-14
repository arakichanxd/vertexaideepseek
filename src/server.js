/**
 * DeepSeek OpenAI-Compatible Server
 * 
 * Exposes an OpenAI-compatible /v1/chat/completions endpoint
 * that proxies requests to the DeepSeek reverse-engineered client.
 */

import 'dotenv/config';
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import DeepSeek from './deepseek.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// Initialize DeepSeek Client
async function init() {
    console.log('🔄 Initializing DeepSeek Client...');

    // 1. Try environment variables
    const envLoaded = DeepSeek.initFromEnv();

    // 2. Fallback to cache
    if (!envLoaded) {
        await DeepSeek.loadAuthTokenFromCache();
    }

    if (DeepSeek.hasAuthToken()) {
        console.log('✅ DeepSeek Token Loaded');
        console.log('📊 Pool Status:', DeepSeek.getTokenPoolStatus());
        
        // Start keep-alive system (ping every 30 minutes)
        const keepAliveInterval = parseInt(process.env.KEEP_ALIVE_INTERVAL) || 30;
        DeepSeek.startKeepAlive(keepAliveInterval);
    } else {
        console.warn('⚠️  No DeepSeek tokens found! Requests may fail.');
    }
}

// Authentication Middleware
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        // If no auth header, strict mode might reject, but we'll be lenient for testing
        // return res.status(401).json({ error: 'Missing API Key' });
    }

    const apiKey = authHeader ? authHeader.split(' ')[1] : null;

    // Validate API Key if configured
    if (!DeepSeek.validateUserApiKey(apiKey)) {
        return res.status(401).json({ error: 'Invalid API Key' });
    }

    next();
};

// Chat Completions Endpoint (100% OpenAI Compatible)
app.post('/v1/chat/completions', authMiddleware, async (req, res) => {
    try {
        const { 
            messages, 
            model = 'deepseek-v3', 
            stream = false,
            temperature,
            max_tokens,
            top_p,
            frequency_penalty,
            presence_penalty,
            stop,
            n = 1
        } = req.body;

        // Validate required fields
        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({
                error: {
                    message: 'messages is required and must be a non-empty array',
                    type: 'invalid_request_error',
                    code: 'invalid_messages'
                }
            });
        }

        // Validate n parameter (only support n=1)
        if (n !== 1) {
            return res.status(400).json({
                error: {
                    message: 'Only n=1 is supported',
                    type: 'invalid_request_error',
                    code: 'unsupported_parameter'
                }
            });
        }

        // Validate model
        const validModels = DeepSeek.getModels();
        const modelAliases = Object.keys(DeepSeek.modelAliases || {});
        const allValidModels = [...validModels, ...modelAliases];
        
        if (!allValidModels.includes(model)) {
            return res.status(400).json({
                error: {
                    message: `Model '${model}' not found. Available models: ${validModels.join(', ')}`,
                    type: 'invalid_request_error',
                    code: 'model_not_found'
                }
            });
        }

        console.log(`📩 Request: ${model} (Stream: ${stream}, Messages: ${messages.length})`);

        if (stream) {
            // Streaming Response
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

            try {
                const generator = await DeepSeek.chatCompletions({
                    messages,
                    model,
                    stream: true
                });

                for await (const chunk of generator) {
                    res.write(`data: ${JSON.stringify(chunk)}\n\n`);
                }

                res.write('data: [DONE]\n\n');
                res.end();
            } catch (streamError) {
                // Send error in SSE format
                res.write(`data: ${JSON.stringify({
                    error: {
                        message: streamError.message,
                        type: 'server_error',
                        code: 'stream_error'
                    }
                })}\n\n`);
                res.end();
            }

        } else {
            // Normal Response
            const response = await DeepSeek.chatCompletions({
                messages,
                model,
                stream: false
            });

            res.json(response);
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
        
        // OpenAI-compatible error format
        const statusCode = error.response?.status || 500;
        res.status(statusCode).json({
            error: {
                message: error.message,
                type: statusCode === 401 ? 'authentication_error' : 
                      statusCode === 429 ? 'rate_limit_error' : 
                      statusCode === 400 ? 'invalid_request_error' : 
                      'server_error',
                code: error.code || 'internal_error'
            }
        });
    }
});

// Models Endpoint (OpenAI Compatible)
app.get('/v1/models', authMiddleware, (req, res) => {
    const models = DeepSeek.getModels().map(id => ({
        id,
        object: 'model',
        created: 1704067200, // Fixed timestamp for consistency
        owned_by: 'deepseek',
        permission: [],
        root: id,
        parent: null
    }));

    res.json({ 
        object: 'list', 
        data: models 
    });
});

// Get Single Model (OpenAI Compatible)
app.get('/v1/models/:model', authMiddleware, (req, res) => {
    const modelId = req.params.model;
    const models = DeepSeek.getModels();
    
    if (!models.includes(modelId)) {
        return res.status(404).json({
            error: {
                message: `Model '${modelId}' not found`,
                type: 'invalid_request_error',
                code: 'model_not_found'
            }
        });
    }

    res.json({
        id: modelId,
        object: 'model',
        created: 1704067200,
        owned_by: 'deepseek',
        permission: [],
        root: modelId,
        parent: null
    });
});

// Health Check Endpoint
const startTime = Date.now();
app.get('/health', (req, res) => {
    const poolStatus = DeepSeek.getTokenPoolStatus();
    const keepAliveStatus = DeepSeek.getKeepAliveStatus();
    const uptime = Math.floor((Date.now() - startTime) / 1000);
    
    const health = {
        status: DeepSeek.hasAuthToken() ? 'healthy' : 'degraded',
        uptime: uptime,
        tokenPool: poolStatus,
        keepAlive: keepAliveStatus,
        timestamp: new Date().toISOString()
    };

    if (!DeepSeek.hasAuthToken()) {
        health.warning = 'No DeepSeek tokens configured';
    }

    res.json(health);
});

// Graceful Shutdown
process.on('SIGTERM', () => {
    console.log('\n⚠️  SIGTERM received, shutting down gracefully...');
    DeepSeek.stopKeepAlive();
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('\n⚠️  SIGINT received, shutting down gracefully...');
    DeepSeek.stopKeepAlive();
    process.exit(0);
});

// Start Server
app.listen(PORT, async () => {
    await init();
    console.log(`\n🚀 OpenAI-Compatible Server running at http://localhost:${PORT}`);
    console.log(`👉 Chat: http://localhost:${PORT}/v1/chat/completions`);
    console.log(`👉 Health: http://localhost:${PORT}/health`);
    console.log(`👉 Models: http://localhost:${PORT}/v1/models\n`);
});
