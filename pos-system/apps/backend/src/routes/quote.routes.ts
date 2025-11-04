import { Router } from 'express';
import { calculateQuote } from '../controllers/quote.controller';

const router = Router();

router.post('/', calculateQuote);

export default router;
