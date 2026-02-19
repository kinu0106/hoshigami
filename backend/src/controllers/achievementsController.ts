import { Request, Response } from 'express';
import pool from '../config/db';

export async function listAchievements(req: Request, res: Response) {
  const shipmentDateFrom = req.query.shipment_date_from as string | undefined;
  const shipmentDateTo = req.query.shipment_date_to as string | undefined;
  const departmentId = req.query.department_id ? Number(req.query.department_id) : undefined;
  console.log('GET /api/achievements Query params:', { shipmentDateFrom, shipmentDateTo, departmentId });
  const page = req.query.page ? Math.max(1, Number(req.query.page)) : 1;
  const pageSize = req.query.page_size ? Math.min(100, Number(req.query.page_size)) : 20;
  const offset = (page - 1) * pageSize;

  const where: string[] = [];
  const params: any[] = [];
  where.push('a.shipment_date IS NOT NULL');
  if (shipmentDateFrom) {
    params.push(shipmentDateFrom);
    where.push(`a.shipment_date >= $${params.length}::date`);
  }
  if (shipmentDateTo) {
    params.push(shipmentDateTo);
    where.push(`a.shipment_date <= $${params.length}::date`);
  }
  if (departmentId) {
    params.push(departmentId);
    where.push(`a.department_id = $${params.length}`);
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const sql = `
    SELECT a.id,
           a.input_date::text AS input_date,
           a.shipment_date::text AS shipment_date,
           e.name AS employee_name,
           a.department_id,
           d.name AS department_name,
           a.product_id,
           p.name AS product_name,
           p.unit,
           a.remark,
           a.quantity,
           p.unit_price,
           (a.quantity * p.unit_price) AS total
      FROM achievements a
      JOIN employees e   ON e.id = a.employee_id
      JOIN departments d ON d.id = a.department_id
      JOIN products p    ON p.id = a.product_id
      ${whereSql}
      ORDER BY a.input_date ASC, a.id ASC
      LIMIT ${pageSize} OFFSET ${offset}
  `;
  console.log('GET /api/achievements SQL:', sql);
  console.log('GET /api/achievements Params:', params);
  try {
    const { rows } = await pool.query(sql, params);
    console.log('GET /api/achievements Result count:', rows.length);
    if (rows.length > 0) {
      console.log('GET /api/achievements Results:', JSON.stringify(rows.map((r: any) => ({
        id: r.id,
        shipment_date: r.shipment_date,
        shipment_date_type: typeof r.shipment_date,
        input_date: r.input_date,
        department_id: r.department_id,
      })), null, 2));
    }
    res.json(rows);
  } catch (error: any) {
    console.error('GET /api/achievements Query error:', error.message);
    res.status(500).json({ error: error.message });
  }
}

export async function createAchievements(req: Request, res: Response) {
  const items = (req.body?.items ?? []) as Array<{
    input_date: string;
    shipment_date: string;
    employee_id: number;
    department_id: number;
    product_id: number;
    quantity: number;
    remark?: string;
  }>;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ ok: false, message: 'no items' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const it of items) {
      if (!it.input_date || !it.shipment_date || !it.employee_id || !it.department_id || !it.product_id || !it.quantity) {
        throw new Error('missing fields');
      }
      const remark = (it.remark ?? '').trim();
      await client.query(
        `INSERT INTO achievements (input_date, shipment_date, employee_id, department_id, product_id, quantity, remark)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [
          it.input_date,
          it.shipment_date,
          it.employee_id,
          it.department_id,
          it.product_id,
          it.quantity,
          remark !== '' ? remark : null,
        ],
      );
    }
    await client.query('COMMIT');
    res.json({ ok: true, inserted: items.length });
  } catch (e: any) {
    await client.query('ROLLBACK');
    console.error('POST /api/achievements error:', e?.message);
    res.status(500).json({ ok: false, message: e?.message ?? 'insert failed' });
  } finally {
    client.release();
  }
}

export async function updateAchievement(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (!id || Number.isNaN(id)) {
    return res.status(400).json({ ok: false, message: 'invalid id' });
  }

  const { shipment_date, department_id, product_id, quantity, remark } = req.body as any;

  const updates: string[] = [];
  const params: any[] = [];
  let idx = 1;

  if (shipment_date !== undefined) {
    updates.push(`shipment_date = $${idx}`);
    params.push(shipment_date ?? null);
    idx += 1;
  }
  if (department_id !== undefined) {
    updates.push(`department_id = $${idx}`);
    params.push(department_id ?? null);
    idx += 1;
  }
  if (product_id !== undefined) {
    updates.push(`product_id = $${idx}`);
    params.push(product_id ?? null);
    idx += 1;
  }
  if (quantity !== undefined) {
    updates.push(`quantity = $${idx}`);
    params.push(quantity ?? null);
    idx += 1;
  }
  if (remark !== undefined) {
    updates.push(`remark = $${idx}`);
    if (typeof remark === 'string') {
      const trimmed = remark.trim();
      params.push(trimmed === '' ? null : trimmed);
    } else {
      params.push(null);
    }
    idx += 1;
  }

  if (updates.length === 0) {
    return res.status(400).json({ ok: false, message: 'no fields to update' });
  }

  updates.push('updated_at = CURRENT_TIMESTAMP');

  params.push(id);
  const sql = `UPDATE achievements SET ${updates.join(', ')} WHERE id = $${idx}`;
  const { rowCount } = await pool.query(sql, params);
  if (!rowCount) return res.status(404).json({ ok: false });
  res.json({ ok: true });
}

export async function deleteAchievement(req: Request, res: Response) {
  const id = Number(req.params.id);
  const { rowCount } = await pool.query('DELETE FROM achievements WHERE id = $1', [id]);
  if (!rowCount) return res.status(404).json({ ok: false });
  res.json({ ok: true });
}

export async function getSummary(req: Request, res: Response) {
  const shipmentDateFrom = req.query.shipment_date_from as string | undefined;
  const shipmentDateTo = req.query.shipment_date_to as string | undefined;
  const departmentId = req.query.department_id ? Number(req.query.department_id) : undefined;
  const where: string[] = [];
  const params: any[] = [];
  where.push('a.shipment_date IS NOT NULL');
  if (shipmentDateFrom) {
    params.push(shipmentDateFrom);
    where.push(`a.shipment_date >= $${params.length}::date`);
  }
  if (shipmentDateTo) {
    params.push(shipmentDateTo);
    where.push(`a.shipment_date <= $${params.length}::date`);
  }
  if (departmentId) {
    params.push(departmentId);
    where.push(`a.department_id = $${params.length}`);
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const sql = `
    SELECT COALESCE(SUM(a.quantity * p.unit_price), 0) AS total_amount
      FROM achievements a
      JOIN products p ON p.id = a.product_id
      ${whereSql}
  `;
  const { rows } = await pool.query(sql, params);
  res.json({ total_amount: rows[0]?.total_amount ?? 0 });
}
