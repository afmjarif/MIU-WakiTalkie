
import 'dotenv/config';

import express from 'express';
import cors from 'cors';
import { AccessToken } from 'livekit-server-sdk';

const app = express();

// Render provides PORT automatically.
const PORT = Number(process.env.PORT || 4000);

// LiveKit configuration from environment variables.
const LIVEKIT_URL = process.env.LIVEKIT_URL;
const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY;
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET;

// Middleware
app.use(cors());
app.use(express.json());

// Basic health check
app.get('/', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    app: 'MIU WakiTalkie API',
    message: 'Backend is running.',
  });
});

// Render health-check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    app: 'MIU WakiTalkie',
  });
});

// Generate a LiveKit access token
app.get('/token', async (req, res) => {
  try {
    const room = String(req.query.room ?? '').trim();
    const identity = String(req.query.identity ?? '').trim();

    // Validate room name and user identity.
    if (
      !/^[a-zA-Z0-9_-]{3,40}$/.test(room) ||
      !/^[a-zA-Z0-9_-]{1,40}$/.test(identity)
    ) {
      return res.status(400).json({
        error: 'Invalid room code or display name.',
      });
    }

    // Check LiveKit configuration.
    if (!LIVEKIT_URL || !LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
      console.error('LiveKit environment variables are missing.');

      return res.status(500).json({
        error: 'LiveKit server configuration is missing.',
      });
    }

    // Create a participant access token.
    const accessToken = new AccessToken(
      LIVEKIT_API_KEY,
      LIVEKIT_API_SECRET,
      {
        identity,
        ttl: '1h',
      }
    );

    accessToken.addGrant({
      roomJoin: true,
      room,
      canPublish: true,
      canSubscribe: true,
      canPublishData: false,
    });

    const token = await accessToken.toJwt();

    return res.status(200).json({
      token,
      serverUrl: LIVEKIT_URL,
    });
  } catch (error) {
    console.error('Token generation failed:', error);

    return res.status(500).json({
      error: 'Could not generate access token.',
    });
  }
});

// Handle unknown routes.
app.use((_req, res) => {
  res.status(404).json({
    error: 'Endpoint not found.',
  });
});

// Log startup errors.
app.on('error', (error) => {
  console.error('Express application error:', error);
});

// Start the HTTP server. Keep this at the bottom.
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`MIU WakiTalkie API listening on port ${PORT}`);
});

server.on('error', (error) => {
  console.error('Failed to start MIU WakiTalkie API:', error);
  process.exitCode = 1;
});
