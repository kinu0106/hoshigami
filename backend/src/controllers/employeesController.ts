import { Request, Response } from 'express';
import pool from '../config/db';

export async function listEmployees(req: Request, res: Response) {
  const showAll = req.query.all === 'true';
  if (showAll) {
    const { rows } = await pool.query('SELECT id, name, is_active FROM employees ORDER BY id');
    res.json(rows);
  } else {
    const { rows } = await pool.query('SELECT id, name FROM employees WHERE is_active = TRUE ORDER BY id');
    res.json(rows);
  }
}

export async function createEmployee(req: Request, res: Response) {
  const { name } = req.body;
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({ ok: false, message: 'name is required' });
  }
  try {
    const { rows } = await pool.query(
      'INSERT INTO employees (name, is_active) VALUES ($1, TRUE) RETURNING id, name, is_active',
      [name.trim()],
    );
    res.json({ ok: true, data: rows[0] });
  } catch (e: any) {
    if (e.code === '23505') {
      return res.status(400).json({ ok: false, message: 'この入力者名は既に登録されています' });
    }
    console.error('POST /api/employees error:', e?.message);
    res.status(500).json({ ok: false, message: e?.message ?? 'insert failed' });
  }
}

export async function updateEmployee(req: Request, res: Response) {
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
      'UPDATE employees SET is_active = $1 WHERE id = $2 RETURNING id, name, is_active',
      [is_active, id],
    );
    if (!rowCount) {
      return res.status(404).json({ ok: false, message: '入力者が見つかりません' });
    }
    res.json({ ok: true });
  } catch (e: any) {
    console.error('PUT /api/employees/:id error:', e?.message);
    res.status(500).json({ ok: false, message: e?.message ?? 'update failed' });
  }
}

















