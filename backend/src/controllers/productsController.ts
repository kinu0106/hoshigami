import { Request, Response } from 'express';
import pool from '../config/db';

export async function listProducts(req: Request, res: Response) {
  const showAll = req.query.all === 'true';
  const deptId = req.query.department_id ? Number(req.query.department_id) : undefined;

  const conditions: string[] = [];
  const params: any[] = [];

  if (deptId) {
    params.push(deptId);
    conditions.push(`department_id = $${params.length}`);
  }
  if (!showAll) {
    conditions.push('is_active = TRUE');
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const sql = `
    SELECT id, department_id, name, unit, unit_price, is_active
      FROM products
      ${whereClause}
      ORDER BY id
  `;

  try {
    const { rows } = await pool.query(sql, params);
    res.json(rows);
  } catch (e: any) {
    console.error('GET /api/products error:', e?.message);
    res.status(500).json({ ok: false, message: e?.message ?? '取得に失敗しました' });
  }
}

export async function createProduct(req: Request, res: Response) {
  const { name, department_id, unit, unit_price } = req.body;
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({ ok: false, message: 'name is required' });
  }
  if (!department_id || typeof department_id !== 'number') {
    return res.status(400).json({ ok: false, message: 'department_id is required' });
  }
  if (!unit || typeof unit !== 'string' || unit.trim().length === 0) {
    return res.status(400).json({ ok: false, message: 'unit is required' });
  }
  if (unit.trim().length > 10) {
    return res.status(400).json({ ok: false, message: 'unit must be 10 characters or fewer' });
  }
  if (unit_price === undefined || unit_price === null || typeof unit_price !== 'number' || unit_price < 0) {
    return res.status(400).json({ ok: false, message: 'unit_price is required and must be >= 0' });
  }
  try {
    const trimmedName = name.trim();
    const trimmedUnit = unit.trim();
    const { rows } = await pool.query(
      `INSERT INTO products (name, department_id, unit, unit_price, is_active)
       VALUES ($1, $2, $3, $4, TRUE)
       RETURNING id, name, department_id, unit, unit_price, is_active`,
      [trimmedName, department_id, trimmedUnit, unit_price],
    );
    res.json({ ok: true, data: rows[0] });
  } catch (e: any) {
    if (e.code === '23505') {
      return res.status(400).json({ ok: false, message: 'この製造依頼元と製品名の組み合わせは既に登録されています' });
    }
    if (e.code === '23503') {
      return res.status(400).json({ ok: false, message: '無効な製造依頼元IDです' });
    }
    console.error('POST /api/products error:', e?.message);
    res.status(500).json({ ok: false, message: e?.message ?? 'insert failed' });
  }
}

export async function updateProduct(req: Request, res: Response) {
  const id = Number(req.params.id);
  const { is_active } = req.body;
  if (!id || Number.isNaN(id)) {
    return res.status(400).json({ ok: false, message: 'invalid id' });
  }
  if (typeof is_active !== 'boolean') {
    return res.status(400).json({ ok: false, message: 'is_active is required and must be boolean' });
  }
  try {
    const { rowCount } = await pool.query(
      'UPDATE products SET is_active = $1 WHERE id = $2 RETURNING id, name, department_id, unit_price, is_active',
      [is_active, id],
    );
    if (!rowCount) {
      return res.status(404).json({ ok: false, message: '製品が見つかりません' });
    }
    res.json({ ok: true });
  } catch (e: any) {
    console.error('PUT /api/products/:id error:', e?.message);
    res.status(500).json({ ok: false, message: e?.message ?? 'update failed' });
  }
}