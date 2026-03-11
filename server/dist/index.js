import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';
import { initBot } from './bot.js';
import authRoutes from './routes/auth.js';
import offersRoutes from './routes/offers.js';
import clipsRoutes from './routes/clips.js';
import usersRoutes from './routes/users.js';
import adminRoutes from './routes/admin.js';
import campaignsRoutes from './routes/campaigns.js';
import tiktokRoutes from './routes/tiktok.js';
import referralsRoutes from './routes/referrals.js';
import uploadRoutes from './routes/upload.js';
import { startStatsUpdateScheduler } from './jobs/updateVideoStats.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Load env vars (ALWAYS load from .env since that's what PM2 uses and where the user edits)
dotenv.config({ path: path.join(__dirname, '../.env'), override: true });
console.log(`📂 Loaded environment from .env at ${path.join(__dirname, '../.env')}`);
console.log(`🔑 RAPIDAPI_KEY present: ${!!process.env.RAPIDAPI_KEY} (Starts with: ${process.env.RAPIDAPI_KEY?.substring(0, 5)}...)`);
export const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3001;
// Middleware
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:5173', process.env.WEBAPP_URL || ''].filter(Boolean),
    credentials: true
}));
app.use(express.json({ limit: '20mb' }));
// Serve uploaded files via API route so Nginx proxies it correctly
app.use('/api/uploads', express.static(path.join(__dirname, '../uploads')));
// Routes
app.use('/api/auth', authRoutes);
app.use('/api/offers', offersRoutes);
app.use('/api/clips', clipsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/campaigns', campaignsRoutes);
app.use('/api/tiktok', tiktokRoutes);
app.use('/api/referrals', referralsRoutes);
app.use('/api/upload', uploadRoutes);
// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// Start server
async function main() {
    try {
        await prisma.$connect();
        console.log('✅ Database connected');
        // Initialize Telegram bot
        if (process.env.BOT_TOKEN) {
            initBot();
            console.log('✅ Telegram bot started');
        }
        else {
            console.log('⚠️ BOT_TOKEN not set, skipping bot initialization');
        }
        app.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
        });
        // Start video stats update scheduler
        if (process.env.NODE_ENV === 'production') {
            startStatsUpdateScheduler();
        }
    }
    catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}
main();
