/**
 * Debug endpoint for Vercel
 * Shows raw environment variable status
 */

export default function handler(req, res) {
    const debug = {
        timestamp: new Date().toISOString(),
        environment: {
            DEEPSEEK_AUTHTOKEN: process.env.DEEPSEEK_AUTHTOKEN ? 
                `Set (${process.env.DEEPSEEK_AUTHTOKEN.substring(0, 30)}...)` : 
                'NOT SET',
            API_KEY: process.env.API_KEY || 'NOT SET',
            KEEP_ALIVE_INTERVAL: process.env.KEEP_ALIVE_INTERVAL || 'NOT SET',
            PORT: process.env.PORT || 'NOT SET',
            NODE_ENV: process.env.NODE_ENV || 'NOT SET',
            VERCEL: process.env.VERCEL || 'NOT SET',
            VERCEL_ENV: process.env.VERCEL_ENV || 'NOT SET'
        },
        allEnvKeys: Object.keys(process.env).filter(k => 
            k.includes('DEEPSEEK') || k.includes('API_KEY')
        )
    };
    
    res.status(200).json(debug);
}
