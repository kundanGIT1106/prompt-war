import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { z } from 'zod';
import { analyzeCivicReportWithGemini } from './geminiService';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// 1. Security: CORS configuration
app.use(
  cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173', process.env.CLIENT_ORIGIN || '*'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// 2. Security: Request payload size limit (mitigate DoS / memory exhaustion)
app.use(express.json({ limit: '5mb' }));

// 3. Simple in-memory rate limiter per IP (max 60 requests per minute)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

const rateLimiter = (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const windowMs = 60 * 1000;
  const limit = 60;

  const record = rateLimitMap.get(ip);
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return next();
  }

  if (record.count >= limit) {
    return res.status(429).json({
      error: 'Rate limit exceeded. Please wait a minute before sending additional requests.',
    });
  }

  record.count++;
  return next();
};

app.use(rateLimiter);

// 4. Request Validation Schemas
const AnalyzeReportInputSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(3000),
  category: z.string(),
  urgency: z.string(),
  location: z.object({ address: z.string().optional() }).optional(),
});

// --- API ROUTES ---

// Health Check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'CivicPulse AI Server',
    version: '1.0.0',
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY.includes('your_')),
    timestamp: new Date().toISOString(),
  });
});

// AI Report Understanding & Triage
app.post('/api/ai/analyze-report', async (req: Request, res: Response) => {
  try {
    const parsed = AnalyzeReportInputSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Invalid request payload',
        details: parsed.error.issues,
      });
    }

    const analysis = await analyzeCivicReportWithGemini(parsed.data);
    return res.json(analysis);
  } catch (err: any) {
    console.error('Error in /api/ai/analyze-report:', err);
    return res.status(500).json({
      error: 'Internal server error analyzing report',
    });
  }
});

// AI Resolution Assistance & Checklist
app.post('/api/ai/suggest-resolution', (req: Request, res: Response) => {
  const { category, title } = req.body;

  const departmentPlans: Record<string, { dept: string; action: string; checklist: string[]; days: number }> = {
    pothole: {
      dept: 'Department of Transportation',
      action: 'Deploy Roadway Maintenance crew for pavement milling and asphalt cold-patch or permanent infill.',
      checklist: [
        'Place high-visibility safety traffic cones around crater',
        'Inspect surrounding roadbed for subsurface moisture failure',
        'Clean debris and apply tack coat bonding emulsion',
        'Fill with hot mix asphalt and compact using vibratory roller',
      ],
      days: 2,
    },
    water_leakage: {
      dept: 'Water Supply & Public Utilities',
      action: 'Emergency dispatch to isolate valve section and excavate damaged piping connection.',
      checklist: [
        'Check utility maps for co-located electrical and gas lines',
        'Turn off municipal isolation valve to halt flooding',
        'Replace burst pipe segment with corrosion-resistant ductile iron',
        'Restore water pressure and conduct water purity test',
      ],
      days: 1,
    },
    broken_streetlights: {
      dept: 'Electrical & Public Lighting Division',
      action: 'Deploy bucket truck to test ballast, wiring harness, and photo-sensor unit.',
      checklist: [
        'Isolate local electrical breaker panel',
        'Inspect pole access door for frayed wiring or water intrusion',
        'Replace ballast and install high-lumen energy-efficient LED luminaire',
        'Test automated photocell activation',
      ],
      days: 3,
    },
    garbage: {
      dept: 'Department of Sanitation & Waste Management',
      action: 'Dispatch bulk collection vehicle and mechanical street sweeper.',
      checklist: [
        'Inspect site for hazardous or biohazard chemical materials',
        'Load bulk refuse into compactor vehicle',
        'Disinfect and sweep curb and stormwater grate entrance',
        'Post municipal anti-dumping signage and citation warning',
      ],
      days: 1,
    },
    damaged_infrastructure: {
      dept: 'Public Works & Civil Engineering',
      action: 'Structural engineer site assessment and installation of perimeter barricade.',
      checklist: [
        'Establish physical perimeter exclusion zone',
        'Structural load-bearing assessment and photographic documentation',
        'Draft remediation work order for contractor bidding',
        'Execute reinforced repair or demolition',
      ],
      days: 5,
    },
  };

  const plan = departmentPlans[category] || {
    dept: 'Citizen Services Bureau',
    action: 'Conduct citizen outreach call to clarify issue specifics and coordinate multi-agency review.',
    checklist: [
      'Verify complaint jurisdiction',
      'Contact reporting citizen for additional context',
      'Route work order to specialized municipal division',
    ],
    days: 4,
  };

  res.json({
    recommendedDepartment: plan.dept,
    recommendedAction: plan.action,
    checklist: plan.checklist,
    estimatedResolutionDays: plan.days,
  });
});

// Admin Privileged Role Update Check
app.post('/api/admin/update-role', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  // In production with Firebase Admin SDK, verify ID token here and ensure admin custom claims:
  // const decodedToken = await admin.auth().verifyIdToken(idToken);
  // if (!decodedToken.admin) return res.status(403)...

  const { targetUid, newRole, callerRole } = req.body;
  if (callerRole !== 'admin') {
    return res.status(403).json({
      error: 'Privilege escalation rejected: Only system administrators may alter staff roles.',
    });
  }

  res.json({
    success: true,
    message: `Role for ${targetUid} updated to ${newRole}`,
  });
});

// Centralized error handling
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled server exception:', err);
  res.status(500).json({ error: 'Internal server error occurred.' });
});

// Only listen if not imported by test runner
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`CivicPulse AI Server running on http://localhost:${PORT}`);
  });
}

export default app;
