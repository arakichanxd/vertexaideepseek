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

// Status Endpoint (Detailed Diagnostics)
app.get('/status', (req, res) => {
    const poolStatus = DeepSeek.getTokenPoolStatus();
    const keepAliveStatus = DeepSeek.getKeepAliveStatus();
    const uptime = Math.floor((Date.now() - startTime) / 1000);
    
    // Format uptime
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor((uptime % 86400) / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = uptime % 60;
    const uptimeFormatted = `${days}d ${hours}h ${minutes}m ${seconds}s`;
    
    // Check environment variables
    const envStatus = {
        DEEPSEEK_AUTHTOKEN: process.env.DEEPSEEK_AUTHTOKEN ? 
            `✅ Set (${process.env.DEEPSEEK_AUTHTOKEN.substring(0, 20)}...)` : 
            '❌ Not Set',
        API_KEY: process.env.API_KEY ? 
            `✅ Set (${process.env.API_KEY})` : 
            '❌ Not Set',
        KEEP_ALIVE_INTERVAL: process.env.KEEP_ALIVE_INTERVAL || '60 (default)',
        PORT: process.env.PORT || '3000 (default)',
        NODE_ENV: process.env.NODE_ENV || 'development'
    };
    
    // Overall health status
    const hasToken = DeepSeek.hasAuthToken();
    const hasApiKey = !!process.env.API_KEY;
    const overallStatus = hasToken && hasApiKey ? '✅ Healthy' : 
                         hasToken ? '⚠️ Degraded (No API Key)' : 
                         '❌ Unhealthy (No DeepSeek Token)';
    
    // Available models
    const models = DeepSeek.getModels();
    
    // Build status response
    const status = {
        service: 'DeepSeek OpenAI-Compatible API',
        version: '1.0.0',
        status: overallStatus,
        timestamp: new Date().toISOString(),
        uptime: {
            seconds: uptime,
            formatted: uptimeFormatted
        },
        environment: envStatus,
        deepseek: {
            tokenConfigured: hasToken,
            tokenPool: poolStatus,
            keepAlive: keepAliveStatus,
            models: models
        },
        api: {
            apiKeyConfigured: hasApiKey,
            endpoints: [
                'POST /v1/chat/completions',
                'GET /v1/models',
                'GET /v1/models/:model',
                'GET /health',
                'GET /status'
            ]
        },
        platform: {
            node: process.version,
            platform: process.platform,
            arch: process.arch,
            memory: {
                used: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
                total: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`
            }
        }
    };
    
    // Add warnings if needed
    const warnings = [];
    if (!hasToken) {
        warnings.push('DEEPSEEK_AUTHTOKEN environment variable is not set');
    }
    if (!hasApiKey) {
        warnings.push('API_KEY environment variable is not set (authentication disabled)');
    }
    if (keepAliveStatus.enabled && keepAliveStatus.interval === 0) {
        warnings.push('Keep-alive is disabled (KEEP_ALIVE_INTERVAL=0)');
    }
    
    if (warnings.length > 0) {
        status.warnings = warnings;
    }
    
    res.json(status);
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

// Initialize on startup (for serverless)
let initialized = false;
async function ensureInitialized() {
    if (!initialized) {
        await init();
        initialized = true;
    }
}

// For Vercel serverless - export the app
export default async function handler(req, res) {
    await ensureInitialized();
    return app(req, res);
}

// For local/Render - start server if not in serverless environment
if (process.env.VERCEL !== '1' && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
    app.listen(PORT, async () => {
        await init();
        console.log(`\n� OpenAI-Compatible Server running at http://localhost:${PORT}`);
        console.log(`👉 Chat: http://localhost:${PORT}/v1/chat/completions`);
        console.log(`👉 Models: http://localhost:${PORT}/v1/models`);
        console.log(`👉 Health: http://localhost:${PORT}/health`);
        console.log(`👉 Status: http://localhost:${PORT}/status\n`);
    });
}

