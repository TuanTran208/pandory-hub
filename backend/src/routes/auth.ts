import { Request, Response, Router } from 'express';
import { authService } from '../services/authService';

const router = Router();

// Route to fetch Discord OAuth URL (helpful for frontend to redirect)
router.get('/discord/url', (req: Request, res: Response) => {
    const clientId = process.env.DISCORD_CLIENT_ID;
    const redirectUri = process.env.DISCORD_REDIRECT_URI;
    if (!clientId || !redirectUri) {
        return res.status(500).json({ error: 'OAuth not configured on backend.' });
    }

    const authUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=identify`;
    res.json({ url: authUrl });
});

// Callback route where frontend sends the code after Discord redirects
router.post('/discord/callback', async (req: Request, res: Response) => {
    const { code } = req.body;
    if (!code) {
        return res.status(400).json({ error: 'Missing authorization code.' });
    }

    try {
        const discordUser = await authService.handleDiscordLogin(code);
        const token = authService.generateToken(discordUser);
        
        // Expose user basics required by the frontend
        res.json({
            success: true,
            token,
            user: {
                id: discordUser.id,
                username: discordUser.username,
                avatar: discordUser.avatar,
                isOwner: discordUser.id === (process.env.DISCORD_OWNER_ID || '')
            }
        });
    } catch (error: any) {
        console.error('Discord authentication error:', error.message || error.response?.data);
        res.status(401).json({ error: 'Authentication failed.' });
    }
});

router.post('/logout', (req: Request, res: Response) => {
    // JWT uses stateless session, frontend handles logout by clearing token
    res.json({ success: true, message: 'Logged out successfully locally.' });
});

export default router;
