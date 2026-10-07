import { Router } from 'express';
import verifierRoutes from './verifier.route.js';

const router = Router();

router.use('/', verifierRoutes);

export default router;
