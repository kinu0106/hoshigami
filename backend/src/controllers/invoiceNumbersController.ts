import { Request, Response } from 'express';
import pool from '../config/db';

/**
 * 請求書番号を取得してインクリメントする
 * トランザクション内でSELECT FOR UPDATEを使用して同時アクセスを防ぐ
 */
export async function getNextInvoiceNumber(req: Request, res: Response) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // 現在の番号を取得（ロックをかける）
    const selectResult = await client.query(
      'SELECT current_number FROM invoice_numbers ORDER BY id LIMIT 1 FOR UPDATE'
    );
    
    if (selectResult.rows.length === 0) {
      // データが存在しない場合は初期化
      await client.query(
        'INSERT INTO invoice_numbers (current_number) VALUES (1)'
      );
      await client.query('COMMIT');
      return res.json({ ok: true, invoiceNumber: 1 });
    }
    
    const currentNumber = selectResult.rows[0].current_number;
    const nextNumber = currentNumber + 1;
    
    // 番号をインクリメント
    await client.query(
      'UPDATE invoice_numbers SET current_number = $1, updated_at = CURRENT_TIMESTAMP WHERE id = (SELECT id FROM invoice_numbers ORDER BY id LIMIT 1)',
      [nextNumber]
    );
    
    await client.query('COMMIT');
    res.json({ ok: true, invoiceNumber: nextNumber });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('GET /api/invoice-numbers/next error:', error?.message);
    res.status(500).json({ ok: false, message: error?.message ?? '請求書番号の取得に失敗しました' });
  } finally {
    client.release();
  }
}
















