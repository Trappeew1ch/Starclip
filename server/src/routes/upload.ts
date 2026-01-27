import { Router } from 'express';
import { authMiddleware, adminMiddleware, AuthRequest } from '../middleware/auth.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const router = Router();

// Get directory path for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Uploads directory
const UPLOADS_DIR = path.join(__dirname, '../../uploads');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Generate unique filename
function generateFilename(originalName: string): string {
    const ext = path.extname(originalName);
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${timestamp}-${random}${ext}`;
}

// Admin can upload files
router.post('/', authMiddleware, adminMiddleware, async (req: AuthRequest, res) => {
    try {
        // Check if we have raw base64 data
        const { filename, data, mimeType } = req.body;

        if (!filename || !data) {
            return res.status(400).json({ error: 'Filename and data are required' });
        }

        // Validate mime type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (mimeType && !allowedTypes.includes(mimeType)) {
            return res.status(400).json({ error: 'Invalid file type. Allowed: jpg, png, webp, gif' });
        }

        // Decode base64
        const base64Data = data.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');

        // Check file size (max 10MB)
        if (buffer.length > 10 * 1024 * 1024) {
            return res.status(400).json({ error: 'File too large. Max 10MB' });
        }

        // Generate unique filename
        const newFilename = generateFilename(filename);
        const filePath = path.join(UPLOADS_DIR, newFilename);

        // Save file
        fs.writeFileSync(filePath, buffer);

        // Return URL
        const fileUrl = `/uploads/${newFilename}`;

        res.json({
            success: true,
            url: fileUrl,
            filename: newFilename
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Upload failed' });
    }
});

export default router;
