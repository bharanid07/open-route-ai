import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { routeRouter } from './routes/routeRouter';
import { nodesRouter } from './routes/nodesRouter';
import { hazardsRouter } from './routes/hazardsRouter';
import { fleetRouter } from './routes/fleetRouter';
import { auditRouter } from './routes/auditRouter';
import { districtRouter } from './routes/districtRouter';
import { aiRouter } from './routes/aiRouter';
import { authRouter } from './routes/authRouter';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

import { weatherRouter } from './routes/weatherRouter';

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/ai', aiRouter);
app.use('/api/route', routeRouter);
app.use('/api/nodes', nodesRouter);
app.use('/api/hazards', hazardsRouter);
app.use('/api/fleet', fleetRouter);
app.use('/api/audit', auditRouter);
app.use('/api/district', districtRouter);
app.use('/api/weather', weatherRouter);


// Healthcheck
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'healthy',
    platform: 'OPENROUTE AI (தமிழ்நாடு அணுகல் & சரக்கு தளம்)',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    supportedDistricts: 38
  });
});

app.use(express.static(path.resolve('.')));

app.listen(PORT, () => {
  console.log(`🚀 OPENROUTE AI Backend API running at http://localhost:${PORT}`);
  console.log(`📡 Endpoints: /api/route/compute, /api/route/real-road, /api/ai/chat, /api/nodes, /api/hazards, /api/fleet, /api/district`);
});

