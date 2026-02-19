import { Request, Response } from 'express';
import pool from '../config/db';

export type Invoice = {
  id: number;
  invoice_number: string;
  issue_date: string;
  department_id: number;
  department_name?: string;
  shipment_date_from: string;
  shipment_date_to: string;
  pdf_file_path: string | null;
  pdf_file_name: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

/**
 * 発行済み請求書一覧を取得
 * 検索条件: 発行日範囲、請求書番号
 */
export async function listInvoices(req: Request, res: Response) {
  const issueDateFrom = req.query.issue_date_from as string | undefined;
  const issueDateTo = req.query.issue_date_to as string | undefined;
  const invoiceNumber = req.query.invoice_number as string | undefined;

  const where: string[] = ['i.deleted_at IS NULL'];
  const params: any[] = [];

  if (issueDateFrom) {
    params.push(issueDateFrom);
    where.push(`i.issue_date >= $${params.length}::date`);
  }
  if (issueDateTo) {
    params.push(issueDateTo);
    where.push(`i.issue_date <= $${params.length}::date`);
  }
  if (invoiceNumber) {
    params.push(`%${invoiceNumber}%`);
    where.push(`i.invoice_number ILIKE $${params.length}`);
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const sql = `
    SELECT i.id,
           i.invoice_number,
           i.issue_date::text AS issue_date,
           i.department_id,
           d.name AS department_name,
           i.shipment_date_from::text AS shipment_date_from,
           i.shipment_date_to::text AS shipment_date_to,
           i.pdf_file_path,
           i.pdf_file_name,
           i.created_at::text AS created_at,
           i.updated_at::text AS updated_at,
           i.deleted_at::text AS deleted_at
      FROM invoices i
      LEFT JOIN departments d ON d.id = i.department_id
      ${whereSql}
      ORDER BY i.issue_date DESC, i.invoice_number DESC
  `;

  try {
    const { rows } = await pool.query(sql, params);
    res.json(rows);
  } catch (error: any) {
    console.error('GET /api/invoices error:', error.message);
    res.status(500).json({ ok: false, message: error.message ?? '請求書一覧の取得に失敗しました' });
  }
}

/**
 * 特定の請求書情報を取得（PDF再生成用）
 */
export async function getInvoice(req: Request, res: Response) {
  const invoiceId = Number(req.params.id);
  if (!invoiceId || isNaN(invoiceId)) {
    return res.status(400).json({ ok: false, message: '無効な請求書IDです' });
  }

  const sql = `
    SELECT i.id,
           i.invoice_number,
           i.issue_date::text AS issue_date,
           i.department_id,
           d.name AS department_name,
           i.shipment_date_from::text AS shipment_date_from,
           i.shipment_date_to::text AS shipment_date_to,
           i.pdf_file_path,
           i.pdf_file_name,
           i.created_at::text AS created_at,
           i.updated_at::text AS updated_at
      FROM invoices i
      LEFT JOIN departments d ON d.id = i.department_id
      WHERE i.id = $1 AND i.deleted_at IS NULL
  `;

  try {
    const { rows } = await pool.query(sql, [invoiceId]);
    if (rows.length === 0) {
      return res.status(404).json({ ok: false, message: '請求書が見つかりません' });
    }
    res.json({ ok: true, invoice: rows[0] });
  } catch (error: any) {
    console.error('GET /api/invoices/:id error:', error.message);
    res.status(500).json({ ok: false, message: error.message ?? '請求書の取得に失敗しました' });
  }
}

/**
 * 請求書を新規作成（発行時）
 */
export async function createInvoice(req: Request, res: Response) {
  const {
    invoice_number,
    issue_date,
    department_id,
    shipment_date_from,
    shipment_date_to,
    pdf_file_path,
    pdf_file_name,
  } = req.body;

  if (!invoice_number || !issue_date || !department_id || !shipment_date_from || !shipment_date_to) {
    return res.status(400).json({ ok: false, message: '必須項目が不足しています' });
  }

  const sql = `
    INSERT INTO invoices (
      invoice_number,
      issue_date,
      department_id,
      shipment_date_from,
      shipment_date_to,
      pdf_file_path,
      pdf_file_name
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING id, invoice_number, issue_date::text AS issue_date, created_at::text AS created_at
  `;

  try {
    const { rows } = await pool.query(sql, [
      invoice_number,
      issue_date,
      department_id,
      shipment_date_from,
      shipment_date_to,
      pdf_file_path || null,
      pdf_file_name || null,
    ]);
    res.json({ ok: true, invoice: rows[0] });
  } catch (error: any) {
    console.error('POST /api/invoices error:', error.message);
    if (error.code === '23505') {
      // ユニーク制約違反（請求書番号の重複）
      return res.status(400).json({ ok: false, message: 'この請求書番号は既に使用されています' });
    }
    res.status(500).json({ ok: false, message: error.message ?? '請求書の作成に失敗しました' });
  }
}

/**
 * 発行日を修正（新しい請求書番号で再発行）
 */
export async function updateIssueDate(req: Request, res: Response) {
  const invoiceId = Number(req.params.id);
  const { new_issue_date } = req.body;

  if (!invoiceId || isNaN(invoiceId)) {
    return res.status(400).json({ ok: false, message: '無効な請求書IDです' });
  }
  if (!new_issue_date) {
    return res.status(400).json({ ok: false, message: '新しい発行日を指定してください' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 元の請求書情報を取得
    const selectResult = await client.query(
      `SELECT invoice_number, department_id, shipment_date_from, shipment_date_to, pdf_file_name
       FROM invoices
       WHERE id = $1 AND deleted_at IS NULL`,
      [invoiceId]
    );

    if (selectResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ ok: false, message: '請求書が見つかりません' });
    }

    const oldInvoice = selectResult.rows[0];

    // 元の請求書を論理削除
    await client.query(
      `UPDATE invoices SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [invoiceId]
    );

    // 新しい請求書番号を取得
    const numberResult = await client.query(
      'SELECT current_number FROM invoice_numbers ORDER BY id LIMIT 1 FOR UPDATE'
    );

    if (numberResult.rows.length === 0) {
      await client.query('INSERT INTO invoice_numbers (current_number) VALUES (1)');
      var nextNumber = 1;
    } else {
      const currentNumber = numberResult.rows[0].current_number;
      nextNumber = currentNumber + 1;
      await client.query(
        'UPDATE invoice_numbers SET current_number = $1, updated_at = CURRENT_TIMESTAMP WHERE id = (SELECT id FROM invoice_numbers ORDER BY id LIMIT 1)',
        [nextNumber]
      );
    }

    // 新しい請求書番号をフォーマット（INV-000001形式）
    const formattedNumber = `INV-${String(nextNumber).padStart(6, '0')}`;

    // 新しい請求書を作成
    const insertResult = await client.query(
      `INSERT INTO invoices (
        invoice_number,
        issue_date,
        department_id,
        shipment_date_from,
        shipment_date_to,
        pdf_file_path,
        pdf_file_name
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, invoice_number, issue_date::text AS issue_date`,
      [
        formattedNumber,
        new_issue_date,
        oldInvoice.department_id,
        oldInvoice.shipment_date_from,
        oldInvoice.shipment_date_to,
        null, // PDFファイルパスは再生成時に設定
        null, // PDFファイル名は再生成時に設定
      ]
    );

    await client.query('COMMIT');
    res.json({
      ok: true,
      invoice: insertResult.rows[0],
      old_invoice_number: oldInvoice.invoice_number,
    });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('PATCH /api/invoices/:id/issue-date error:', error.message);
    res.status(500).json({ ok: false, message: error.message ?? '発行日の更新に失敗しました' });
  } finally {
    client.release();
  }
}

/**
 * 請求書のPDFファイル名を更新
 */
export async function updateInvoicePdfFileName(req: Request, res: Response) {
  const invoiceId = Number(req.params.id);
  const { pdf_file_name } = req.body;

  if (!invoiceId || isNaN(invoiceId)) {
    return res.status(400).json({ ok: false, message: '無効な請求書IDです' });
  }

  const sql = `
    UPDATE invoices
    SET pdf_file_name = $1, updated_at = CURRENT_TIMESTAMP
    WHERE id = $2 AND deleted_at IS NULL
    RETURNING id, invoice_number, pdf_file_name
  `;

  try {
    const { rows } = await pool.query(sql, [pdf_file_name || null, invoiceId]);
    if (rows.length === 0) {
      return res.status(404).json({ ok: false, message: '請求書が見つかりません' });
    }
    res.json({ ok: true, invoice: rows[0] });
  } catch (error: any) {
    console.error('PATCH /api/invoices/:id/pdf-file-name error:', error.message);
    res.status(500).json({ ok: false, message: error.message ?? 'PDFファイル名の更新に失敗しました' });
  }
}

/**
 * 請求書を論理削除
 */
export async function deleteInvoice(req: Request, res: Response) {
  const invoiceId = Number(req.params.id);
  if (!invoiceId || isNaN(invoiceId)) {
    return res.status(400).json({ ok: false, message: '無効な請求書IDです' });
  }

  const sql = `
    UPDATE invoices
    SET deleted_at = CURRENT_TIMESTAMP
    WHERE id = $1 AND deleted_at IS NULL
    RETURNING id, invoice_number
  `;

  try {
    const { rows } = await pool.query(sql, [invoiceId]);
    if (rows.length === 0) {
      return res.status(404).json({ ok: false, message: '請求書が見つかりません' });
    }
    res.json({ ok: true, message: '請求書を削除しました' });
  } catch (error: any) {
    console.error('DELETE /api/invoices/:id error:', error.message);
    res.status(500).json({ ok: false, message: error.message ?? '請求書の削除に失敗しました' });
  }
}

