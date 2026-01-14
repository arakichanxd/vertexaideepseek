/**
 * DeepSeek Chat API Client (Reverse Engineered)
 * Base: https://chat.deepseek.com
 * 
 * Credits: PoW algorithm reverse engineered by @xtekky (deepseek4free)
 * JavaScript port for Node.js
 * 
 * Models: DeepSeek-V3 (Chat), DeepSeek-R1 (Reasoner with DeepThink)
 **/

import crypto from 'crypto';
import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default class DeepSeek {
    static url = "https://chat.deepseek.com";
    static apiEndpoint = "https://chat.deepseek.com/api/v0";

    static authToken = null;

    // Multiple tokens pool for load balancing
    static tokenPool = [];
    static currentTokenIndex = 0;

    // User API key validation (for your own API)
    static userApiKeys = new Set();

    static wasmInstance = null;
    static wasmMemory = null;

    static models = [
        'deepseek-v3',   // Fast chat, no reasoning
        'deepseek-r1'    // Deep reasoning (DeepThink)
    ];

    // Token cache path
    static tokenCachePath = null;

    // Keep-alive system
    static keepAliveInterval = null;
    static keepAliveEnabled = false;
    static lastKeepAlive = null;

    // Model aliases for convenience
    static modelAliases = {
        'deepseek-v3': { thinking: false, description: 'DeepSeek-V3 - Fast chat' },
        'deepseek-chat': { thinking: false, description: 'DeepSeek-V3 - Fast chat' },
        'deepseek-r1': { thinking: true, description: 'DeepSeek-R1 - Deep reasoning' },
        'deepseek-reasoner': { thinking: true, description: 'DeepSeek-R1 - Deep reasoning' }
    };

    static getModels() {
        return this.models;
    }

    static getModelConfig(modelName) {
        const name = modelName?.toLowerCase() || 'deepseek-v3';
        return this.modelAliases[name] || this.modelAliases['deepseek-v3'];
    }

    // ==================== Initialization from Environment ====================

    /**
     * Initialize from environment variables (Cloudflare Workers / Render compatible)
     * 
     * DeepSeek tokens (numbered):
     *   DEEPSEEK_AUTHTOKEN, DEEPSEEK_AUTHTOKEN1, DEEPSEEK_AUTHTOKEN2, ...
     * 
     * User API keys (numbered):
     *   API_KEY, API_KEY1, API_KEY2, ...
     * 
     * @param {Object} env - Optional env object (for Cloudflare Workers)
     */
    static initFromEnv(env = null) {
        const getEnv = (key) => {
            if (env && env[key]) return env[key];
            if (typeof process !== 'undefined' && process.env && process.env[key]) return process.env[key];
            return null;
        };

        // Load DeepSeek tokens (DEEPSEEK_AUTHTOKEN, DEEPSEEK_AUTHTOKEN1, DEEPSEEK_AUTHTOKEN2, ...)
        const tokens = [];

        // First token (no number suffix)
        const firstToken = getEnv('DEEPSEEK_AUTHTOKEN');
        if (firstToken) tokens.push(firstToken);

        // Numbered tokens (1, 2, 3, ...)
        for (let i = 1; i <= 100; i++) {
            const token = getEnv(`DEEPSEEK_AUTHTOKEN${i}`);
            if (token) {
                tokens.push(token);
            } else if (i > 10 && !token) {
                break;
            }
        }

        if (tokens.length > 0) {
            this.tokenPool = tokens;
            this.authToken = tokens[0];
            console.log(`✅ Loaded ${tokens.length} DeepSeek token(s) from environment`);
        }

        // Load user API keys (API_KEY, API_KEY1, API_KEY2, ...)
        const keys = [];

        // First key (no number suffix)
        const firstKey = getEnv('API_KEY');
        if (firstKey) keys.push(firstKey);

        // Numbered keys (1, 2, 3, ...)
        for (let i = 1; i <= 100; i++) {
            const key = getEnv(`API_KEY${i}`);
            if (key) {
                keys.push(key);
            } else if (i > 10 && !key) {
                break;
            }
        }

        if (keys.length > 0) {
            keys.forEach(k => this.userApiKeys.add(k));
            console.log(`✅ Loaded ${keys.length} user API key(s) from environment`);
        }

        return this.tokenPool.length > 0;
    }

    /**
     * Add a DeepSeek token to the pool
     */
    static addToken(token) {
        if (token && !this.tokenPool.includes(token)) {
            this.tokenPool.push(token);
            if (!this.authToken) this.authToken = token;
        }
    }

    /**
     * Add multiple tokens at once
     */
    static addTokens(tokens) {
        tokens.forEach(t => this.addToken(t));
    }

    /**
     * Get next token from pool (round-robin)
     */
    static getNextToken() {
        if (this.tokenPool.length === 0) {
            return this.authToken;
        }
        const token = this.tokenPool[this.currentTokenIndex];
        this.currentTokenIndex = (this.currentTokenIndex + 1) % this.tokenPool.length;
        return token;
    }

    /**
     * Add a user API key (for your server's authentication)
     */
    static addUserApiKey(key) {
        if (key) this.userApiKeys.add(key);
    }

    /**
     * Validate a user API key
     */
    static validateUserApiKey(key) {
        // If no keys configured, allow all
        if (this.userApiKeys.size === 0) return true;
        return this.userApiKeys.has(key);
    }

    /**
     * Get token pool status
     */
    static getTokenPoolStatus() {
        return {
            totalTokens: this.tokenPool.length,
            currentIndex: this.currentTokenIndex,
            userApiKeysConfigured: this.userApiKeys.size
        };
    }

    // ==================== WASM PoW Solver ====================

    static async initWasm() {
        if (this.wasmInstance) return;

        try {
            // Try different paths for different environments
            const possiblePaths = [
                path.join(__dirname, 'wasm', 'sha3_wasm_bg.wasm'),
                path.join(process.cwd(), 'wasm', 'sha3_wasm_bg.wasm'),
                './wasm/sha3_wasm_bg.wasm',
                '/var/task/wasm/sha3_wasm_bg.wasm' // Vercel serverless path
            ];

            let wasmBuffer = null;
            let loadedFrom = null;

            for (const wasmPath of possiblePaths) {
                try {
                    wasmBuffer = await fs.readFile(wasmPath);
                    loadedFrom = wasmPath;
                    break;
                } catch (e) {
                    // Try next path
                }
            }

            if (!wasmBuffer) {
                throw new Error('WASM file not found in any expected location');
            }

            const wasmModule = await WebAssembly.instantiate(wasmBuffer, {
                wasi_snapshot_preview1: {
                    fd_write: () => 0,
                    fd_close: () => 0,
                    fd_seek: () => 0,
                    proc_exit: () => { },
                    environ_get: () => 0,
                    environ_sizes_get: () => 0,
                }
            });

            this.wasmInstance = wasmModule.instance;
            this.wasmMemory = this.wasmInstance.exports.memory;
        } catch (error) {
            console.error('❌ Failed to initialize WASM:', error.message);
            throw error;
        }
    }

    static writeToMemory(text) {
        const encoded = new TextEncoder().encode(text);
        const length = encoded.length;
        const ptr = this.wasmInstance.exports.__wbindgen_export_0(length, 1);

        const memoryView = new Uint8Array(this.wasmMemory.buffer);
        memoryView.set(encoded, ptr);

        return { ptr, length };
    }

    static calculateHash(algorithm, challenge, salt, difficulty, expireAt) {
        const prefix = `${salt}_${expireAt}_`;
        const retptr = this.wasmInstance.exports.__wbindgen_add_to_stack_pointer(-16);

        try {
            const challengeData = this.writeToMemory(challenge);
            const prefixData = this.writeToMemory(prefix);

            this.wasmInstance.exports.wasm_solve(
                retptr,
                challengeData.ptr,
                challengeData.length,
                prefixData.ptr,
                prefixData.length,
                Number(difficulty)
            );

            const memoryView = new DataView(this.wasmMemory.buffer);
            const status = memoryView.getInt32(retptr, true);

            if (status === 0) {
                return null;
            }

            const value = memoryView.getFloat64(retptr + 8, true);
            return Math.floor(value);

        } finally {
            this.wasmInstance.exports.__wbindgen_add_to_stack_pointer(16);
        }
    }

    static solvePowChallenge(config) {
        const answer = this.calculateHash(
            config.algorithm,
            config.challenge,
            config.salt,
            config.difficulty,
            config.expire_at
        );

        const result = {
            algorithm: config.algorithm,
            challenge: config.challenge,
            salt: config.salt,
            answer: answer,
            signature: config.signature,
            target_path: config.target_path
        };

        return Buffer.from(JSON.stringify(result)).toString('base64');
    }

    // ==================== Authentication ====================

    /**
     * Set auth token directly
     */
    static setAuthToken(token) {
        this.authToken = token;
    }

    /**
     * Set auth token and save to cache file for reuse
     */
    static async setAuthTokenWithCache(token, cachePath = null) {
        this.authToken = token;
        this.tokenCachePath = cachePath || path.join(__dirname, '.deepseek_token.json');

        try {
            const cacheData = {
                token: token,
                savedAt: Date.now(),
                expiresHint: 'Token may expire after ~24-48 hours of inactivity'
            };
            await fs.writeFile(this.tokenCachePath, JSON.stringify(cacheData, null, 2));
        } catch (e) {
            // Silently fail cache write
        }
    }

    /**
     * Load auth token from cache file
     */
    static async loadAuthTokenFromCache(cachePath = null) {
        this.tokenCachePath = cachePath || path.join(__dirname, '.deepseek_token.json');

        try {
            const data = await fs.readFile(this.tokenCachePath, 'utf8');
            const cache = JSON.parse(data);

            if (cache.token) {
                this.authToken = cache.token;

                // Add to pool if valid
                if (!this.tokenPool.includes(cache.token)) {
                    this.tokenPool.push(cache.token);
                }

                // Warn if token is old
                const ageHours = (Date.now() - cache.savedAt) / (1000 * 60 * 60);
                if (ageHours > 48) {
                    console.warn(`⚠️ DeepSeek token is ${Math.round(ageHours)}h old - may need refresh`);
                }

                return true;
            }
        } catch (e) {
            // Cache file doesn't exist or is invalid
        }

        return false;
    }

    /**
     * Check if token is set
     */
    static hasAuthToken() {
        return !!this.authToken || this.tokenPool.length > 0;
    }

    /**
     * Keep-alive ping to prevent token expiration
     * Sends a lightweight request to DeepSeek every 30 minutes
     */
    static async keepAlivePing() {
        if (!this.hasAuthToken()) {
            console.log('⚠️  Keep-alive: No token available, skipping ping');
            return false;
        }

        try {
            // Use a lightweight endpoint to keep session alive
            const response = await axios.get(
                `${this.apiEndpoint}/client/settings?did=&scope=banner`,
                { 
                    headers: this.getHeaders(),
                    timeout: 10000 
                }
            );

            this.lastKeepAlive = new Date();
            console.log(`💓 Keep-alive ping successful at ${this.lastKeepAlive.toLocaleTimeString()}`);
            return true;
        } catch (error) {
            console.error('❌ Keep-alive ping failed:', error.message);
            return false;
        }
    }

    /**
     * Start automatic keep-alive system
     * @param {number} intervalMinutes - Interval in minutes (default: 30)
     */
    static startKeepAlive(intervalMinutes = 30) {
        if (this.keepAliveEnabled) {
            console.log('⚠️  Keep-alive already running');
            return;
        }

        if (!this.hasAuthToken()) {
            console.log('⚠️  Cannot start keep-alive: No token configured');
            return;
        }

        this.keepAliveEnabled = true;
        const intervalMs = intervalMinutes * 60 * 1000;

        // Initial ping
        this.keepAlivePing();

        // Set up recurring pings
        this.keepAliveInterval = setInterval(() => {
            this.keepAlivePing();
        }, intervalMs);

        console.log(`✅ Keep-alive started (ping every ${intervalMinutes} minutes)`);
    }

    /**
     * Stop automatic keep-alive system
     */
    static stopKeepAlive() {
        if (this.keepAliveInterval) {
            clearInterval(this.keepAliveInterval);
            this.keepAliveInterval = null;
            this.keepAliveEnabled = false;
            console.log('🛑 Keep-alive stopped');
        }
    }

    /**
     * Get keep-alive status
     */
    static getKeepAliveStatus() {
        return {
            enabled: this.keepAliveEnabled,
            lastPing: this.lastKeepAlive ? this.lastKeepAlive.toISOString() : null,
            minutesSinceLastPing: this.lastKeepAlive 
                ? Math.floor((Date.now() - this.lastKeepAlive.getTime()) / 60000)
                : null
        };
    }

    /**
     * Get auth token (uses pool rotation if multiple tokens)
     */
    static getAuthToken(rotate = false) {
        // Use token pool if available
        if (this.tokenPool.length > 0) {
            if (rotate) {
                return this.getNextToken();
            }
            return this.tokenPool[this.currentTokenIndex] || this.authToken;
        }

        if (!this.authToken) {
            throw new Error(
                "Auth token not set. Options:\n" +
                "1. Set directly: DeepSeek.setAuthToken('TOKEN')\n" +
                "2. Load from env: DeepSeek.initFromEnv()\n" +
                "3. Load from cache: await DeepSeek.loadAuthTokenFromCache()\n\n" +
                "Environment variables:\n" +
                "  DEEPSEEK_TOKENS=token1,token2,token3\n" +
                "  API_KEYS=your-api-key-1,your-api-key-2"
            );
        }
        return this.authToken;
    }

    // ==================== HTTP Helpers ====================

    static getHeaders(powResponse = null) {
        const headers = {
            'accept': '*/*',
            'accept-language': 'en,en-US;q=0.9',
            'authorization': `Bearer ${this.getAuthToken()}`,
            'content-type': 'application/json',
            'origin': 'https://chat.deepseek.com',
            'referer': 'https://chat.deepseek.com/',
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36',
            'x-app-version': '20241129.1',
            'x-client-locale': 'en_US',
            'x-client-platform': 'web',
            'x-client-version': '1.6.1',
        };

        if (powResponse) {
            headers['x-ds-pow-response'] = powResponse;
        }

        return headers;
    }

    static async getPowChallenge() {
        const response = await axios.post(
            `${this.apiEndpoint}/chat/create_pow_challenge`,
            { target_path: '/api/v0/chat/completion' },
            { headers: this.getHeaders() }
        );

        return response.data.data.biz_data.challenge;
    }

    // ==================== Session Management ====================

    static async createChatSession() {
        const response = await axios.post(
            `${this.apiEndpoint}/chat_session/create`,
            { character_id: null },
            { headers: this.getHeaders() }
        );

        return response.data.data.biz_data.id;
    }

    // ==================== Chat Completion ====================

    static async *createAsyncGenerator(prompt, options = {}) {
        await this.initWasm();

        const chatSessionId = options.chatId || await this.createChatSession();

        // Get PoW challenge and solve it
        const challenge = await this.getPowChallenge();
        const powResponse = this.solvePowChallenge(challenge);

        // Format: YYYYMMDD-16hexchars (e.g., "20260112-9989808bcf444dcf")
        const now = new Date();
        const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
        const clientStreamId = `${dateStr}-${crypto.randomBytes(8).toString('hex')}`;

        const data = {
            chat_session_id: chatSessionId,
            parent_message_id: options.parentMessageId || null,
            prompt: prompt,
            ref_file_ids: [],
            thinking_enabled: options.reasoning !== false, // Default: true for DeepThink
            search_enabled: options.search || false,
            client_stream_id: clientStreamId
        };

        const response = await axios.post(
            `${this.apiEndpoint}/chat/completion`,
            data,
            {
                headers: this.getHeaders(powResponse),
                responseType: 'stream'
            }
        );

        let lineBuffer = '';
        let messageId = null;
        let currentEvent = null;
        let currentFragmentType = 'RESPONSE'; // Track if we're in THINK or RESPONSE mode

        for await (const chunk of response.data) {
            lineBuffer += chunk.toString();
            const lines = lineBuffer.split('\n');
            lineBuffer = lines.pop() || '';

            for (const line of lines) {
                const trimmedLine = line.trim();

                // Track event type
                if (trimmedLine.startsWith('event: ')) {
                    currentEvent = trimmedLine.slice(7);
                    continue;
                }

                if (!trimmedLine.startsWith('data: ')) continue;

                try {
                    const jsonData = JSON.parse(trimmedLine.slice(6));

                    // Handle initial response with message structure
                    if (jsonData.v && jsonData.v.response) {
                        messageId = jsonData.v.response.message_id;

                        // Check for initial fragment content
                        if (jsonData.v.response.fragments) {
                            for (const fragment of jsonData.v.response.fragments) {
                                currentFragmentType = fragment.type || 'RESPONSE';
                                if (fragment.content) {
                                    yield {
                                        type: fragment.type === 'THINK' ? 'reasoning' : 'content',
                                        content: fragment.content
                                    };
                                }
                            }
                        }
                        continue;
                    }

                    // Handle BATCH operations (fragments with content)
                    if (jsonData.p === 'response' && jsonData.o === 'BATCH' && Array.isArray(jsonData.v)) {
                        for (const op of jsonData.v) {
                            // New fragments being appended
                            if (op.p === 'fragments' && op.o === 'APPEND' && Array.isArray(op.v)) {
                                for (const fragment of op.v) {
                                    currentFragmentType = fragment.type || 'RESPONSE';
                                    if (fragment.content) {
                                        yield {
                                            type: fragment.type === 'THINK' ? 'reasoning' : 'content',
                                            content: fragment.content
                                        };
                                    }
                                }
                            }
                            // Check for FINISHED status
                            if (op.p === 'status' && op.v === 'FINISHED') {
                                yield {
                                    type: 'done',
                                    message_id: messageId,
                                    chat_session_id: chatSessionId
                                };
                            }
                        }
                        continue;
                    }

                    // Handle new fragment APPEND  (e.g., {"p":"response/fragments","o":"APPEND","v":[{...}]})
                    if (jsonData.p === 'response/fragments' && jsonData.o === 'APPEND' && Array.isArray(jsonData.v)) {
                        for (const fragment of jsonData.v) {
                            currentFragmentType = fragment.type || 'RESPONSE';
                            if (fragment.content) {
                                yield {
                                    type: fragment.type === 'THINK' ? 'reasoning' : 'content',
                                    content: fragment.content
                                };
                            }
                        }
                        continue;
                    }

                    // Handle content APPEND operations
                    if (jsonData.p && jsonData.o === 'APPEND' && typeof jsonData.v === 'string') {
                        yield {
                            type: currentFragmentType === 'THINK' ? 'reasoning' : 'content',
                            content: jsonData.v
                        };
                        continue;
                    }

                    // Handle content SET operations (e.g., {"p":"response/fragments/-1/content","v":" +"})
                    if (jsonData.p && jsonData.p.includes('/content') && typeof jsonData.v === 'string' && !jsonData.o) {
                        yield {
                            type: currentFragmentType === 'THINK' ? 'reasoning' : 'content',
                            content: jsonData.v
                        };
                        continue;
                    }

                    // Handle simple content (just {"v": "text"}) - use current fragment type
                    if (typeof jsonData.v === 'string' && !jsonData.p && !jsonData.o) {
                        yield {
                            type: currentFragmentType === 'THINK' ? 'reasoning' : 'content',
                            content: jsonData.v
                        };
                        continue;
                    }

                    // Handle finish event
                    if (currentEvent === 'finish') {
                        yield {
                            type: 'done',
                            message_id: messageId,
                            chat_session_id: chatSessionId
                        };
                    }

                } catch (e) {
                    // Skip malformed JSON lines
                }
            }
        }
    }

    static async createCompletion(prompt, options = {}) {
        let fullContent = '';
        let reasoning = '';
        let messageId = null;
        let chatSessionId = null;

        for await (const chunk of this.createAsyncGenerator(prompt, options)) {
            if (chunk.type === 'content') {
                fullContent += chunk.content;
            } else if (chunk.type === 'reasoning') {
                reasoning += chunk.content;
            } else if (chunk.type === 'done') {
                messageId = chunk.message_id;
                chatSessionId = chunk.chat_session_id;
            }
        }

        return {
            content: fullContent.trim(),
            reasoning: reasoning.trim(),
            message_id: messageId,
            chat_session_id: chatSessionId
        };
    }

    /**
     * Get response in OpenAI-compatible format with <think> tags
     * This matches the official DeepSeek API response format
     */
    static async createCompletionOpenAI(prompt, options = {}) {
        const response = await this.createCompletion(prompt, options);

        // Combine reasoning and content with <think> tags (OpenAI format)
        let fullContent = '';
        if (response.reasoning) {
            fullContent = `<think>\n${response.reasoning}\n</think>\n\n${response.content}`;
        } else {
            fullContent = response.content;
        }

        return {
            id: `chatcmpl-${response.message_id || Date.now()}`,
            object: 'chat.completion',
            created: Math.floor(Date.now() / 1000),
            model: options.model || 'deepseek-v3',
            choices: [{
                index: 0,
                message: {
                    role: 'assistant',
                    content: fullContent
                },
                finish_reason: 'stop'
            }],
            usage: {
                prompt_tokens: 0,  // Not available from chat.deepseek.com
                completion_tokens: 0,
                total_tokens: 0
            }
        };
    }

    // ==================== OpenAI-Compatible Interface ====================

    /**
     * Fully OpenAI-compatible chat completions
     * @param {Object} params - OpenAI-style params
     * @param {Array} params.messages - Array of {role, content} messages
     * @param {string} params.model - Model name (deepseek-v3, deepseek-r1)
     * @param {boolean} params.stream - Enable streaming
     * @param {number} params.temperature - Not used (for compatibility)
     * @param {number} params.max_tokens - Not used (for compatibility)
     * @returns {Object|AsyncGenerator} OpenAI-compatible response
     */
    static async chatCompletions(params = {}) {
        const { messages = [], model = 'deepseek-v3', stream = false } = params;

        // Validate model
        if (!this.models.includes(model) && !this.modelAliases[model]) {
            throw new Error(`Model '${model}' not found. Available models: ${this.models.join(', ')}`);
        }

        // Convert messages array to single prompt
        const prompt = this.messagesToPrompt(messages);

        // Get model config for reasoning
        const modelConfig = this.getModelConfig(model);
        const reasoning = modelConfig.thinking;

        if (stream) {
            return this.streamChatCompletions(prompt, { model, reasoning });
        }

        // Non-streaming response
        const response = await this.createCompletion(prompt, { reasoning });

        let content = response.content;
        if (response.reasoning) {
            content = `<think>\n${response.reasoning}\n</think>\n\n${response.content}`;
        }

        return {
            id: `chatcmpl-${response.message_id || crypto.randomBytes(12).toString('hex')}`,
            object: 'chat.completion',
            created: Math.floor(Date.now() / 1000),
            model: model,
            choices: [{
                index: 0,
                message: {
                    role: 'assistant',
                    content: content
                },
                finish_reason: 'stop'
            }],
            usage: {
                prompt_tokens: 0,
                completion_tokens: 0,
                total_tokens: 0
            }
        };
    }

    /**
     * Streaming chat completions (OpenAI SSE format)
     */
    static async *streamChatCompletions(prompt, options = {}) {
        const { model = 'deepseek-v3', reasoning = false } = options;
        const id = `chatcmpl-${crypto.randomBytes(12).toString('hex')}`;
        const created = Math.floor(Date.now() / 1000);

        let inThinking = false;
        let thinkingStarted = false;
        let firstChunk = true;

        for await (const chunk of this.createAsyncGenerator(prompt, { reasoning })) {
            if (chunk.type === 'reasoning') {
                // Start think tag if needed
                if (!thinkingStarted) {
                    // First chunk with role
                    if (firstChunk) {
                        yield {
                            id,
                            object: 'chat.completion.chunk',
                            created,
                            model,
                            choices: [{
                                index: 0,
                                delta: { role: 'assistant', content: '<think>\n' },
                                finish_reason: null
                            }]
                        };
                        firstChunk = false;
                    } else {
                        yield {
                            id,
                            object: 'chat.completion.chunk',
                            created,
                            model,
                            choices: [{
                                index: 0,
                                delta: { content: '<think>\n' },
                                finish_reason: null
                            }]
                        };
                    }
                    thinkingStarted = true;
                    inThinking = true;
                }

                yield {
                    id,
                    object: 'chat.completion.chunk',
                    created,
                    model,
                    choices: [{
                        index: 0,
                        delta: { content: chunk.content },
                        finish_reason: null
                    }]
                };
            } else if (chunk.type === 'content') {
                // Close think tag if we were thinking
                if (inThinking) {
                    yield {
                        id,
                        object: 'chat.completion.chunk',
                        created,
                        model,
                        choices: [{
                            index: 0,
                            delta: { content: '\n</think>\n\n' },
                            finish_reason: null
                        }]
                    };
                    inThinking = false;
                }

                // First chunk with role if not sent yet
                if (firstChunk) {
                    yield {
                        id,
                        object: 'chat.completion.chunk',
                        created,
                        model,
                        choices: [{
                            index: 0,
                            delta: { role: 'assistant', content: chunk.content },
                            finish_reason: null
                        }]
                    };
                    firstChunk = false;
                } else {
                    yield {
                        id,
                        object: 'chat.completion.chunk',
                        created,
                        model,
                        choices: [{
                            index: 0,
                            delta: { content: chunk.content },
                            finish_reason: null
                        }]
                    };
                }
            } else if (chunk.type === 'done') {
                // Close think tag if still open
                if (inThinking) {
                    yield {
                        id,
                        object: 'chat.completion.chunk',
                        created,
                        model,
                        choices: [{
                            index: 0,
                            delta: { content: '\n</think>\n\n' },
                            finish_reason: null
                        }]
                    };
                }

                yield {
                    id,
                    object: 'chat.completion.chunk',
                    created,
                    model,
                    choices: [{
                        index: 0,
                        delta: {},
                        finish_reason: 'stop'
                    }]
                };
            }
        }
    }

    /**
     * Convert OpenAI messages array to single prompt string
     * Properly handles system prompts and conversation history
     */
    static messagesToPrompt(messages) {
        if (!messages || messages.length === 0) {
            return '';
        }

        // Extract system prompt if present (can be multiple, concatenate them)
        let systemPrompt = '';
        const conversationMessages = [];

        for (const msg of messages) {
            if (msg.role === 'system') {
                systemPrompt += (systemPrompt ? '\n' : '') + msg.content;
            } else {
                conversationMessages.push(msg);
            }
        }

        // Build the final prompt
        let prompt = '';

        // Add system prompt at the beginning if present
        if (systemPrompt) {
            prompt = systemPrompt + '\n\n';
        }

        // Add conversation history
        for (const msg of conversationMessages) {
            if (msg.role === 'user') {
                prompt += msg.content;
            } else if (msg.role === 'assistant') {
                // Include assistant messages for context (multi-turn conversations)
                prompt += `\n\nAssistant: ${msg.content}\n\nUser: `;
            }
        }

        return prompt.trim();
    }

    /**
     * Helper to strip <think> tags from content
     */
    static stripThinkingTags(content) {
        return content.replace(/<think>[\s\S]*?<\/think>\s*/g, '').trim();
    }

    /**
     * Helper to extract thinking from <think> tags
     */
    static extractThinking(content) {
        const match = content.match(/<think>([\s\S]*?)<\/think>/);
        return match ? match[1].trim() : '';
    }

    /**
     * Create completion with model name (auto-sets reasoning based on model)
     */
    static async chat(prompt, options = {}) {
        const modelConfig = this.getModelConfig(options.model);

        // Auto-enable reasoning for R1 models unless explicitly disabled
        const reasoning = options.reasoning ?? modelConfig.thinking;

        return this.createCompletion(prompt, {
            ...options,
            reasoning
        });
    }
}
