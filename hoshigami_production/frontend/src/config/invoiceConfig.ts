export type InvoiceCompanyInfo = {
  name: string;
  address: string;
  tel: string;
  fax?: string;
  representative?: string;
  sealImagePath?: string;
  registrationNumber?: string;
};

export type InvoiceSettings = {
  numberPrefix: string;
  provisionalNumber: string;
  taxRate: number;
  roundingMode: 'round' | 'floor' | 'ceil';
};

export type InvoiceBankInfo = {
  bankName: string;
  branchName: string;
  accountType: string;
  accountNumber: string;
  accountName: string;
};

export const invoiceRecipientBase = {
  companyName: '株式会社デジアイズ',
  // department: '生産部', // 製造依頼元に組み込んだため削除
};

export const invoiceCompanyInfo: InvoiceCompanyInfo = {
  name: '星上通信株式会社',
  address: '〒021-0101 岩手県一関市厳美町字上ノ台42-2',
  tel: '0191-29-2008',
  fax: '0191-29-2212',
  representative: '代表取締役 滝上　賢彦',
  sealImagePath: '/company_seal.png',
  registrationNumber: 'T3004050000273',
};

export const invoiceSettings: InvoiceSettings = {
  numberPrefix: 'INV-',
  provisionalNumber: 'INV-000000',
  taxRate: 0.1,
  roundingMode: 'ceil',
};

export const invoiceBankInfo: InvoiceBankInfo = {
  bankName: '北日本銀行',
  branchName: '山目支店072',
  accountType: '普通',
  accountNumber: '2895581',
  accountName: '星上通信株式会社　代表取締役　滝上賢彦',
};

