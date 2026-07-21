import XLSX from 'xlsx';

export function generateTemplateExcelBuffer(): Buffer {
  // Column definitions: No, Kode, Uraian Pekerjaan, Satuan, Volume, Harga Satuan, Jumlah
  const headers = ['No', 'Kode', 'Uraian Pekerjaan', 'Satuan', 'Volume', 'Harga Satuan', 'Jumlah'];
  
  const sampleData = [
    { No: '1', Kode: 'I', 'Uraian Pekerjaan': 'Pekerjaan Persiapan', Satuan: '', Volume: '', 'Harga Satuan': '', Jumlah: '' },
    { No: '2', Kode: '1.1', 'Uraian Pekerjaan': 'Pembersihan Lahan', Satuan: 'm2', Volume: 150, 'Harga Satuan': 25000, Jumlah: 3750000 },
    { No: '3', Kode: '1.2', 'Uraian Pekerjaan': 'Direksi Keet', Satuan: 'ls', Volume: 1, 'Harga Satuan': 5000000, Jumlah: 5000000 },
    { No: '4', Kode: 'II', 'Uraian Pekerjaan': 'Pekerjaan Tanah', Satuan: '', Volume: '', 'Harga Satuan': '', Jumlah: '' },
    { No: '5', Kode: '2.1', 'Uraian Pekerjaan': 'Galian Pondasi', Satuan: 'm3', Volume: 45, 'Harga Satuan': 80000, Jumlah: 3600000 },
    { No: '6', Kode: '2.2', 'Uraian Pekerjaan': 'Urugan Pasir bawah pondasi', Satuan: 'm3', Volume: 12, 'Harga Satuan': 150000, Jumlah: 1800000 },
    { No: '7', Kode: 'III', 'Uraian Pekerjaan': 'Pekerjaan Pondasi', Satuan: '', Volume: '', 'Harga Satuan': '', Jumlah: '' },
    { No: '8', Kode: '3.1', 'Uraian Pekerjaan': 'Pasang Pondasi Batu Kali 1:5', Satuan: 'm3', Volume: 35, 'Harga Satuan': 450000, Jumlah: 15750000 },
    { No: '9', Kode: '3.2', 'Uraian Pekerjaan': 'Sloof Beton Bertulang 15/20', Satuan: 'm3', Volume: 4.5, 'Harga Satuan': 3200000, Jumlah: 14400000 },
    { No: '10', Kode: 'IV', 'Uraian Pekerjaan': 'Pekerjaan Struktur', Satuan: '', Volume: '', 'Harga Satuan': '', Jumlah: '' },
    { No: '11', Kode: '4.1', 'Uraian Pekerjaan': 'Kolom Beton Bertulang 15/15', Satuan: 'm3', Volume: 3.2, 'Harga Satuan': 3400000, Jumlah: 10880000 },
    { No: '12', Kode: '4.2', 'Uraian Pekerjaan': 'Balok Beton Bertulang 15/25', Satuan: 'm3', Volume: 2.8, 'Harga Satuan': 3500000, Jumlah: 9800000 },
    { No: '13', Kode: 'V', 'Uraian Pekerjaan': 'Pekerjaan Arsitektur', Satuan: '', Volume: '', 'Harga Satuan': '', Jumlah: '' },
    { No: '14', Kode: '5.1', 'Uraian Pekerjaan': 'Pasangan Dinding Bata Merah 1/2b t=1:5', Satuan: 'm2', Volume: 180, 'Harga Satuan': 110000, Jumlah: 19800000 },
    { No: '15', Kode: '5.2', 'Uraian Pekerjaan': 'Plesteran Dinding t=15mm 1:5', Satuan: 'm2', Volume: 360, 'Harga Satuan': 65000, Jumlah: 23400000 },
    { No: '16', Kode: '5.3', 'Uraian Pekerjaan': 'Acian Dinding Semen PC', Satuan: 'm2', Volume: 360, 'Harga Satuan': 35000, Jumlah: 12600000 },
    { No: '17', Kode: 'VI', 'Uraian Pekerjaan': 'Pekerjaan Finishing & Pengecatan', Satuan: '', Volume: '', 'Harga Satuan': '', Jumlah: '' },
    { No: '18', Kode: '6.1', 'Uraian Pekerjaan': 'Pasang Lantai Keramik 40x40 Polos', Satuan: 'm2', Volume: 120, 'Harga Satuan': 185000, Jumlah: 22200000 },
    { No: '19', Kode: '6.2', 'Uraian Pekerjaan': 'Pengecatan Tembok Interior', Satuan: 'm2', Volume: 360, 'Harga Satuan': 25000, Jumlah: 9000000 }
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData, { header: headers });

  // Adjust column widths to look beautiful
  worksheet['!cols'] = [
    { wch: 5 },  // No
    { wch: 10 }, // Kode
    { wch: 45 }, // Uraian Pekerjaan
    { wch: 10 }, // Satuan
    { wch: 12 }, // Volume
    { wch: 15 }, // Harga Satuan
    { wch: 18 }  // Jumlah
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'RAB_Template');

  // Return as Buffer
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}
