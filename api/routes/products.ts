import express from 'express';
import { supabase } from '../utils/supabase.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('id, name, icon, color, description, image, tags');

    if (error) {
      res.json([]);
      return;
    }

    res.json(Array.isArray(data) ? data : []);
  } catch {
    res.json([]);
  }
});

export default router;
