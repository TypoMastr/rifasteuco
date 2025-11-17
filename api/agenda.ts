import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Placeholder handler for the /api/agenda endpoint.
 * @param req - The Vercel request object.
 * @param res - The Vercel response object.
 */
export default function handler(req: VercelRequest, res: VercelResponse) {
  res.status(200).json({ message: 'Agenda endpoint placeholder.' });
}
