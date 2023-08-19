import express from 'express';

const router = express.Router();

router.get('/', async (req, res) => {
  res.sendStatus(410);
});

router.post('/', async (req, res) => {
  res.sendStatus(410);
});

export default router;
