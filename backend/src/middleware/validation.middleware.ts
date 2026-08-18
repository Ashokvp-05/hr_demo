import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';
import { AppError } from './error.middleware';

export const validate = (schema: z.ZodObject<any, any>) => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            schema.parse({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const errorMessages = error.errors.map((issue) => ({
                    field: issue.path.join('.'),
                    message: issue.message,
                }));
                return res.status(400).json({
                    status: 'error',
                    message: 'Validation failed',
                    errors: errorMessages,
                });
            }
            next(error);
        }
    };
};

// Common validation schemas
export const schemas = {
    // Leave request validation
    leaveRequest: z.object({
        body: z.object({
            type: z.enum(['SICK', 'CASUAL', 'VACATION', 'MATERNITY', 'UNPAID']),
            startDate: z.string().datetime().or(z.string()),
            endDate: z.string().datetime().or(z.string()),
            reason: z.string().optional(),
        }),
    }),

    // Clock in validation
    clockIn: z.object({
        body: z.object({
            type: z.enum(['IN_OFFICE', 'REMOTE', 'HYBRID']),
            location: z.any().optional(),
            isOnCall: z.boolean().optional(),
        }),
    }),

    // User update validation
    userUpdate: z.object({
        body: z.object({
            name: z.string().min(2).optional(),
            phone: z.string().optional(),
            department: z.string().optional(),
            designation: z.string().optional(),
        }),
    }),

    // Ticket creation validation
    ticketCreate: z.object({
        body: z.object({
            title: z.string().min(5).max(200),
            description: z.string().min(10),
            category: z.string(),
            priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
            sourcePage: z.string().optional(),
        }),
    }),
};
