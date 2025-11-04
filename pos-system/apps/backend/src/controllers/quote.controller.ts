import { Request, Response } from 'express';
import { QuoteRequestSchema } from '../lib/validate';
import { computeQuote } from '../lib/computeQuote';
import { z } from 'zod';

/**
 * @swagger
 * /quote:
 *   post:
 *     summary: Calculate pricing quote for a dish with addons
 *     tags: [Pricing]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/QuoteRequest'
 *     responses:
 *       200:
 *         description: Quote calculated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/QuoteResponse'
 *       400:
 *         description: Invalid input data
 *       404:
 *         description: Dish or size not found
 *       422:
 *         description: Business rule validation failed
 */
export const calculateQuote = async (req: Request, res: Response) => {
  try {
    const validatedData = QuoteRequestSchema.parse(req.body);

    if (!validatedData.dishId || !validatedData.sizeId) {
      return res.status(400).json({
        success: false,
        error: 'dishId and sizeId are required'
      });
    }

    const quote = await computeQuote(validatedData as any);

    res.json(quote);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid input data', details: error.errors });
      return;
    }

    if ((error as Error).message.includes('not found') || (error as Error).message.includes('not available')) {
      res.status(404).json({ error: (error as Error).message });
      return;
    }

    if ((error as Error).message.includes('not assigned') || 
        (error as Error).message.includes('not available online') ||
        (error as Error).message.includes('only allows') ||
        (error as Error).message.includes('requires minimum') ||
        (error as Error).message.includes('allows maximum')) {
      res.status(422).json({ error: (error as Error).message });
      return;
    }

    console.error('Error calculating quote:', error);
    res.status(500).json({ error: 'Failed to calculate quote' });
  }
};
