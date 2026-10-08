import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import cors from 'cors';
import { connectDB } from './src/server/db.ts';
import { seedDatabase } from './src/server/seed.ts';
import authRoutes from './src/server/routes/authRoutes.ts';
import studentRoutes from './src/server/routes/studentRoutes.ts';
import recruiterRoutes from './src/server/routes/recruiterRoutes.ts';
import adminRoutes from './src/server/routes/adminRoutes.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Connect to MongoDB and seed demo accounts and data
  try {
    await connectDB();
    await seedDatabase();
  } catch (err) {
    console.error('Database initialization error:', err);
  }

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'CampusVelocity Placement Portal API',
      timestamp: new Date().toISOString(),
    });
  });

  // Mount API routers
  app.use('/api/auth', authRoutes);
  app.use('/api/students', studentRoutes);
  app.use('/api/recruiter', recruiterRoutes);
  app.use('/api/admin', adminRoutes);

  // Global API error handler
  app.use('/api', (err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('API Error:', err);
    res.status(err.status || 500).json({
      success: false,
      message: err.message || 'Internal server error occurred.',
    });
  });

  // Mount Vite development middlewares or serve production dist
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 CampusVelocity server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup failure:', err);
  process.exit(1);
});
