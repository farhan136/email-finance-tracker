// src/config/parserRules.js (Simplified Version)

const PARSER_RULES = [
  // --- BCA: Outgoing Transactions ---
  {
    bank: 'BCA',
    flow: 'OUT',
    subjects: ['Internet Transaction Journal', 'Pembayaran Berhasil'],
    type: 'QRIS/Payment',
    patterns: {
      amount: /Total Bayar\s*:\s*IDR\s*([\d.,]+)/i,
      description_target: /Pembayaran Ke\s*:\s*(.*?)\s*\n/i,
    },
    required_fields: ['amount', 'description_target'],
    description: 'Bayar ke {{description_target}}',
  },
  {
    bank: 'BCA',
    flow: 'OUT',
    subjects: ['Internet Transaction Journal'],
    type: 'Transfer',
    patterns: {
      amount: /Nominal Tujuan\s*:\s*IDR\s*([\d.,]+)/i,
      description_target: /Nama Penerima\s*:\s*(.*?)\s*\n/i,
    },
    required_fields: ['amount', 'description_target'],
    description: 'Transfer ke {{description_target}}',
  },
  // --- Mandiri: Outgoing Transactions ---
  {
    bank: 'Mandiri',
    flow: 'OUT',
    subjects: ['Transfer Berhasil', 'Transfer dengan BI Fast Berhasil'],
    type: 'Transfer',
    patterns: {
        amount: /Jumlah Transfer\s*Rp\s*([\d.,]+)/i,
        description_target: /Penerima\s*([\s\S]*?)Bank Mandiri/i,
    },
    required_fields: ['amount', 'description_target'],
    description: 'Transfer ke {{description_target}}',
  },
  {
    bank: 'Mandiri',
    flow: 'OUT',
    subjects: ['Top-up Berhasil', 'Top-up e-money Berhasil', 'Pembayaran Berhasil'],
    type: 'Top-up/Payment',
    patterns: {
        amount: /(?:Total Transaksi|Nominal Top-up|Total Bayar)\s*Rp\s*([\d.,]+)/i,
        description_target: /Penyedia Jasa\s*(.*?)\n/i,
    },
    required_fields: ['amount', 'description_target'],
    description: 'Top-up/Bayar ke {{description_target}}',
  }
];

module.exports = { PARSER_RULES };