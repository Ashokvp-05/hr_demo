import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';
import fs from 'fs';
import path from 'path';

export const setupSwagger = (app: Express) => {
    // Don't expose the full API surface publicly in production. Off by default
    // there; set SWAGGER_ENABLED=true to deliberately turn it back on.
    const enabled = process.env.NODE_ENV !== 'production' || process.env.SWAGGER_ENABLED === 'true';
    if (!enabled) {
        console.log('[Swagger] Disabled in production (set SWAGGER_ENABLED=true to enable).');
        return;
    }
    try {
        const swaggerFile = path.resolve(__dirname, 'swagger-output.json');
        const swaggerData = fs.readFileSync(swaggerFile, 'utf8');
        const swaggerDocument = JSON.parse(swaggerData);
        
        // Serve swagger UI
        app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
        
        // Serve swagger spec as JSON
        app.get('/api-docs.json', (req, res) => {
            res.setHeader('Content-Type', 'application/json');
            res.send(swaggerDocument);
        });
        
        console.log('[Swagger] UI available at /api-docs');
    } catch (err) {
        console.error('[Swagger] Failed to load swagger-output.json:', err);
    }
};
