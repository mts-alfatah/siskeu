// ==========================================
// SISTEM INFORMASI KEUANGAN (SisKeu) - Apps Script
// (Versi Support Bulk Insert)
// ==========================================

// ==========================================
// 1. FUNGSI READ (GET DATA FROM SPREADSHEET)
// ==========================================
function doGet(e) {
  try {
    var action = e.parameter.action;
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // A. Ambil Data Transaksi Siswa (Termasuk Kelas)
    if (action === 'getTransaksiSiswa') {
      var sheet = ss.getSheetByName("Transaksi_Siswa");
      if (!sheet) return responseJSON({ status: "error", message: "Sheet Transaksi_Siswa tidak ditemukan" });
      var rows = sheet.getDataRange().getDisplayValues();
      var data = [];
      for (var i = 1; i < rows.length; i++) {
        if (!rows[i][0]) continue; // Lewati baris kosong
        data.push({
          id: rows[i][0],
          sheetRow: i + 1,
          tanggal: rows[i][1],
          nisn: String(rows[i][2]).replace(/^'/, ''), // Bersihkan petik satu jika ada
          nama: rows[i][3],
          kelas: rows[i][4],     // <-- MEMBACA KELAS
          pembayaran: rows[i][5],
          nominal: rows[i][6],
          admin: rows[i][7]
        });
      }
      data.reverse(); // Data terbaru di atas
      return responseJSON({ status: "success", data: data });
    }

    // B. Ambil Data Transaksi Internal
    if (action === 'getTransaksiInternal') {
      var sheet = ss.getSheetByName("Transaksi_Internal");
      if (!sheet) return responseJSON({ status: "error", message: "Sheet Transaksi_Internal tidak ditemukan" });
      var rows = sheet.getDataRange().getDisplayValues();
      var data = [];
      for (var i = 1; i < rows.length; i++) {
        if (!rows[i][0]) continue;
        data.push({
          id: rows[i][0],
          sheetRow: i + 1,
          tanggal: rows[i][1],
          jenis: rows[i][2],
          keterangan: rows[i][3],
          nominal: rows[i][4],
          admin: rows[i][5]
        });
      }
      data.reverse();
      return responseJSON({ status: "success", data: data });
    }

    // C. Ambil Data Tarif Pembayaran
    if (action === 'getTarifPembayaran') {
      var sheet = ss.getSheetByName("Tarif_Pembayaran");
      if (!sheet) return responseJSON({ status: "error", message: "Sheet Tarif_Pembayaran tidak ditemukan" });
      var rows = sheet.getDataRange().getDisplayValues();
      var data = [];
      for (var i = 1; i < rows.length; i++) {
        if (!rows[i][0]) continue;
        data.push({
          sheetRow: i + 1,
          namaPembayaran: rows[i][0],
          targetKelas: rows[i][1],
          nominalTarif: rows[i][2]
        });
      }
      data.reverse();
      return responseJSON({ status: "success", data: data });
    }

    // D. Ambil Data Akun
    if (action === 'getAccounts') {
      var sheet = ss.getSheetByName("Akun");
      if (!sheet) return responseJSON({ status: "error", message: "Sheet Akun tidak ditemukan" });
      var rows = sheet.getDataRange().getDisplayValues();
      var data = [];
      for (var i = 1; i < rows.length; i++) {
        if (!rows[i][1]) continue;
        data.push({
          sheetRow: i + 1,
          role: rows[i][0],
          idLogin: rows[i][1],
          password: rows[i][2],
          nama: rows[i][3],
          kelas: rows[i][4]
        });
      }
      return responseJSON({ status: "success", data: data });
    }

    // E. Ambil Data Tabungan
    if (action === 'getTabungan') {
      var sheet = ss.getSheetByName("Tabungan");
      if (!sheet) return responseJSON({ status: "error", message: "Sheet Tabungan tidak ditemukan" });
      var rows = sheet.getDataRange().getDisplayValues();
      var data = [];
      for (var i = 1; i < rows.length; i++) {
        if (!rows[i][0]) continue;
        data.push({
          id: rows[i][0],
          sheetRow: i + 1,
          tanggal: rows[i][1],
          nisn: String(rows[i][2]).replace(/^'/, ''),
          nama: rows[i][3],
          kelas: rows[i][4],
          jenis: rows[i][5],
          nominal: rows[i][6],
          keterangan: rows[i][7],
          admin: rows[i][8]
        });
      }
      data.reverse();
      return responseJSON({ status: "success", data: data });
    }

    return responseJSON({ status: "error", message: "Action GET tidak valid." });

  } catch (err) {
    return responseJSON({ status: "error", message: err.toString() });
  }
}

// ==========================================
// 2. FUNGSI WRITE (SAVE DATA TO SPREADSHEET)
// ==========================================
function doPost(e) {
  // Mencegah bentrok data saat diakses bersamaan
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000); // Tunggu maksimal 10 detik
  } catch (e) {
    return responseJSON({ status: "error", message: "Server sibuk, silakan coba beberapa saat lagi." });
  }

  try {
    var data;
    if (e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    } else {
      data = e.parameter;
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var action = data.action;

    // A. Login Akun
    if (!action || action === 'login') {
      var sheet = ss.getSheetByName("Akun");
      var rows = sheet.getDataRange().getValues();
      var usernameInput = String(data.username).trim();
      var passwordInput = String(data.password).trim();
      var isSuccess = false;
      var userData = {};

      for (var i = 1; i < rows.length; i++) {
        var role = String(rows[i][0]).trim();
        var idLogin = String(rows[i][1]).trim();
        var pass = String(rows[i][2]).trim();
        var nama = String(rows[i][3]).trim();
        var kelas = String(rows[i][4]).trim();

        if (idLogin === usernameInput && pass === passwordInput) {
          isSuccess = true;
          userData = { role: role, nama: nama, id: idLogin, kelas: kelas };
          break;
        }
      }

      if (isSuccess) {
        return responseJSON({ status: "success", user: userData });
      } else {
        return responseJSON({ status: "error", message: "ID Login atau Password salah!" });
      }
    }

    // B1. Tambah Transaksi Siswa (Single)
    if (action === 'addTransaksiSiswa') {
      var sheet = ss.getSheetByName("Transaksi_Siswa");
      var rows = sheet.getDataRange().getValues();
      
      var nisnInput = String(data.nisn || '').trim();
      var pembayaranInput = String(data.pembayaran || '').trim();

      for (var i = 1; i < rows.length; i++) {
        var existingNisn = String(rows[i][2] || '').replace(/^'/, '').trim();
        var existingPembayaran = String(rows[i][5] || '').trim();

        if (existingNisn === nisnInput && existingPembayaran.toLowerCase() === pembayaranInput.toLowerCase()) {
          return responseJSON({ 
            status: "error", 
            message: "Sudah Bayar! Transaksi " + pembayaranInput + " untuk NISN " + nisnInput + " sudah dicatat sebelumnya." 
          });
        }
      }

      var date = new Date();
      sheet.appendRow([
        "TRX-S-" + date.getTime(),
        Utilities.formatDate(date, "GMT+7", "dd/MM/yyyy HH:mm:ss"),
        "'" + data.nisn,
        data.namaSiswa,
        data.kelas,
        data.pembayaran,
        data.nominal,
        data.admin
      ]);
      
      rekapTransaksiPivoted();
      
      return responseJSON({ status: "success", message: "Transaksi Siswa berhasil disimpan!" });
    }

    // B1-BULK. Tambah Transaksi Siswa Secara Massal (CSV Import)
    if (action === 'bulkAddTransaksiSiswa') {
      var sheet = ss.getSheetByName("Transaksi_Siswa");
      var rows = sheet.getDataRange().getValues();
      var items = data.items || [];
      var admin = data.admin || 'System';
      
      var newRows = [];
      var successCount = 0;
      var duplicateCount = 0;
      
      for (var j = 0; j < items.length; j++) {
        var item = items[j];
        var nisnInput = String(item.nisn || '').trim();
        var pembayaranInput = String(item.pembayaran || '').trim();
        var isDuplicate = false;
        
        // 1. Cek duplikasi di data sheet yg sudah ada
        for (var i = 1; i < rows.length; i++) {
          var existingNisn = String(rows[i][2] || '').replace(/^'/, '').trim();
          var existingPembayaran = String(rows[i][5] || '').trim();
          if (existingNisn === nisnInput && existingPembayaran.toLowerCase() === pembayaranInput.toLowerCase()) {
            isDuplicate = true;
            break;
          }
        }
        
        // 2. Cek duplikasi di baris baru yang akan di-insert
        if (!isDuplicate) {
          for (var k = 0; k < newRows.length; k++) {
            var newNisn = String(newRows[k][2] || '').replace(/^'/, '').trim();
            var newPembayaran = String(newRows[k][5] || '').trim();
            if (newNisn === nisnInput && newPembayaran.toLowerCase() === pembayaranInput.toLowerCase()) {
              isDuplicate = true;
              break;
            }
          }
        }
        
        if (isDuplicate) {
          duplicateCount++;
        } else {
          var date = new Date();
          newRows.push([
            "TRX-S-" + date.getTime() + "-" + j,
            Utilities.formatDate(date, "GMT+7", "dd/MM/yyyy HH:mm:ss"),
            "'" + item.nisn,
            item.namaSiswa,
            item.kelas,
            item.pembayaran,
            item.nominal,
            admin
          ]);
          successCount++;
        }
      }
      
      if (newRows.length > 0) {
        var lastRow = sheet.getLastRow();
        sheet.getRange(lastRow + 1, 1, newRows.length, newRows[0].length).setValues(newRows);
        rekapTransaksiPivoted();
      }
      
      return responseJSON({ 
        status: "success", 
        message: "Berhasil mengimpor " + successCount + " data. Ditolak (Duplikat): " + duplicateCount
      });
    }

    // B2. Edit Transaksi Siswa
    if (action === 'updateTransaksiSiswa') {
      var sheet = ss.getSheetByName("Transaksi_Siswa");
      var rowNum = findRowByIdOrIndex(sheet, data.id, data.sheetRow, 0);
      if (!rowNum) return responseJSON({ status: "error", message: "Baris transaksi tidak ditemukan." });

      sheet.getRange(rowNum, 3, 1, 6).setValues([[
        "'" + data.nisn,
        data.namaSiswa,
        data.kelas,
        data.pembayaran,
        data.nominal,
        data.admin
      ]]);
      
      rekapTransaksiPivoted();
      return responseJSON({ status: "success", message: "Transaksi Siswa berhasil diperbarui!" });
    }

    // B3. Hapus Transaksi Siswa
    if (action === 'deleteTransaksiSiswa') {
      var sheet = ss.getSheetByName("Transaksi_Siswa");
      var rowNum = findRowByIdOrIndex(sheet, data.id, data.sheetRow, 0);
      if (!rowNum) return responseJSON({ status: "error", message: "Baris transaksi tidak ditemukan." });

      sheet.deleteRow(rowNum);
      rekapTransaksiPivoted();
      return responseJSON({ status: "success", message: "Transaksi Siswa berhasil dihapus!" });
    }

    // C1. Tambah Transaksi Internal (Single)
    if (action === 'addTransaksiInternal') {
      var sheet = ss.getSheetByName("Transaksi_Internal");
      var date = new Date();
      sheet.appendRow([
        "TRX-I-" + date.getTime(),
        Utilities.formatDate(date, "GMT+7", "dd/MM/yyyy HH:mm:ss"),
        data.jenis,
        data.keterangan,
        data.nominal,
        data.admin
      ]);
      return responseJSON({ status: "success", message: "Transaksi Internal berhasil disimpan!" });
    }

    // C1-BULK. Tambah Transaksi Internal Secara Massal (CSV Import)
    if (action === 'bulkAddTransaksiInternal') {
      var sheet = ss.getSheetByName("Transaksi_Internal");
      var items = data.items || [];
      var admin = data.admin || 'System';
      var newRows = [];
      
      for (var j = 0; j < items.length; j++) {
        var item = items[j];
        var date = new Date();
        newRows.push([
          "TRX-I-" + date.getTime() + "-" + j,
          Utilities.formatDate(date, "GMT+7", "dd/MM/yyyy HH:mm:ss"),
          item.jenis,
          item.keterangan,
          item.nominal,
          admin
        ]);
      }
      
      if (newRows.length > 0) {
        var lastRow = sheet.getLastRow();
        sheet.getRange(lastRow + 1, 1, newRows.length, newRows[0].length).setValues(newRows);
      }
      
      return responseJSON({ status: "success", message: "Berhasil mengimpor " + newRows.length + " transaksi internal." });
    }

    // C2. Edit Transaksi Internal
    if (action === 'updateTransaksiInternal') {
      var sheet = ss.getSheetByName("Transaksi_Internal");
      var rowNum = findRowByIdOrIndex(sheet, data.id, data.sheetRow, 0);
      if (!rowNum) return responseJSON({ status: "error", message: "Baris transaksi tidak ditemukan." });

      sheet.getRange(rowNum, 3, 1, 4).setValues([[
        data.jenis,
        data.keterangan,
        data.nominal,
        data.admin
      ]]);
      return responseJSON({ status: "success", message: "Transaksi Internal berhasil diperbarui!" });
    }

    // C3. Hapus Transaksi Internal
    if (action === 'deleteTransaksiInternal') {
      var sheet = ss.getSheetByName("Transaksi_Internal");
      var rowNum = findRowByIdOrIndex(sheet, data.id, data.sheetRow, 0);
      if (!rowNum) return responseJSON({ status: "error", message: "Baris transaksi tidak ditemukan." });

      sheet.deleteRow(rowNum);
      return responseJSON({ status: "success", message: "Transaksi Internal berhasil dihapus!" });
    }

    // D1. Tambah Tarif Pembayaran (Single)
    if (action === 'addTarifPembayaran') {
      var sheet = ss.getSheetByName("Tarif_Pembayaran");
      sheet.appendRow([
        data.namaPembayaran,
        data.targetKelas,
        data.nominalTarif
      ]);
      return responseJSON({ status: "success", message: "Tarif Pembayaran berhasil ditambahkan!" });
    }

    // D1-BULK. Tambah Tarif Pembayaran Secara Massal (CSV Import)
    if (action === 'bulkAddTarifPembayaran') {
      var sheet = ss.getSheetByName("Tarif_Pembayaran");
      var items = data.items || [];
      var newRows = [];
      
      for (var j = 0; j < items.length; j++) {
        var item = items[j];
        newRows.push([
          item.namaPembayaran,
          item.targetKelas,
          item.nominalTarif
        ]);
      }
      
      if (newRows.length > 0) {
        var lastRow = sheet.getLastRow();
        sheet.getRange(lastRow + 1, 1, newRows.length, newRows[0].length).setValues(newRows);
      }
      
      return responseJSON({ status: "success", message: "Berhasil mengimpor " + newRows.length + " tarif." });
    }

    // D2. Edit Tarif Pembayaran
    if (action === 'updateTarifPembayaran') {
      var sheet = ss.getSheetByName("Tarif_Pembayaran");
      var rowNum = validateSheetRow(sheet, data.sheetRow);
      if (!rowNum) return responseJSON({ status: "error", message: "Baris tarif tidak ditemukan." });

      sheet.getRange(rowNum, 1, 1, 3).setValues([[
        data.namaPembayaran,
        data.targetKelas,
        data.nominalTarif
      ]]);
      return responseJSON({ status: "success", message: "Tarif Pembayaran berhasil diperbarui!" });
    }

    // D3. Hapus Tarif Pembayaran
    if (action === 'deleteTarifPembayaran') {
      var sheet = ss.getSheetByName("Tarif_Pembayaran");
      var rowNum = validateSheetRow(sheet, data.sheetRow);
      if (!rowNum) return responseJSON({ status: "error", message: "Baris tarif tidak ditemukan." });

      sheet.deleteRow(rowNum);
      return responseJSON({ status: "success", message: "Tarif Pembayaran berhasil dihapus!" });
    }

    // E1. Tambah Akun
    if (action === 'addAccount') {
      var sheet = ss.getSheetByName("Akun");
      var rows = sheet.getDataRange().getValues();
      var idLoginInput = String(data.idLogin || '').trim();
      if (!idLoginInput) return responseJSON({ status: "error", message: "ID Login tidak boleh kosong." });
      if (!data.password) return responseJSON({ status: "error", message: "Password wajib diisi untuk akun baru." });

      for (var i = 1; i < rows.length; i++) {
        if (String(rows[i][1]).trim() === idLoginInput) {
          return responseJSON({ status: "error", message: "ID Login \"" + idLoginInput + "\" sudah dipakai." });
        }
      }

      sheet.appendRow([
        data.role,
        idLoginInput,
        data.password,
        data.nama,
        data.kelas
      ]);
      return responseJSON({ status: "success", message: "Akun berhasil ditambahkan!" });
    }

    // E2. Edit Akun
    if (action === 'updateAccount') {
      var sheet = ss.getSheetByName("Akun");
      var rowNum = validateSheetRow(sheet, data.sheetRow);
      if (!rowNum) return responseJSON({ status: "error", message: "Baris akun tidak ditemukan." });

      var idLoginInput = String(data.idLogin || '').trim();
      if (!idLoginInput) return responseJSON({ status: "error", message: "ID Login tidak boleh kosong." });

      var rows = sheet.getDataRange().getValues();
      for (var i = 1; i < rows.length; i++) {
        if ((i + 1) !== rowNum && String(rows[i][1]).trim() === idLoginInput) {
          return responseJSON({ status: "error", message: "ID Login \"" + idLoginInput + "\" sudah dipakai akun lain." });
        }
      }

      var passwordToSave = data.password;
      if (!passwordToSave) {
        passwordToSave = sheet.getRange(rowNum, 3).getValue();
      }

      sheet.getRange(rowNum, 1, 1, 5).setValues([[
        data.role,
        idLoginInput,
        passwordToSave,
        data.nama,
        data.kelas
      ]]);
      return responseJSON({ status: "success", message: "Akun berhasil diperbarui!" });
    }

    // E3. Hapus Akun
    if (action === 'deleteAccount') {
      var sheet = ss.getSheetByName("Akun");
      var rowNum = validateSheetRow(sheet, data.sheetRow);
      if (!rowNum) return responseJSON({ status: "error", message: "Baris akun tidak ditemukan." });

      sheet.deleteRow(rowNum);
      return responseJSON({ status: "success", message: "Akun berhasil dihapus!" });
    }

    // F1. Tambah Transaksi Tabungan
    if (action === 'addTabungan') {
      var sheet = ss.getSheetByName("Tabungan");
      if (!sheet) return responseJSON({ status: "error", message: "Sheet Tabungan tidak ditemukan" });
      
      var date = new Date();
      sheet.appendRow([
        "TBG-" + date.getTime(),
        Utilities.formatDate(date, "GMT+7", "dd/MM/yyyy HH:mm:ss"),
        "'" + data.nisn,
        data.namaSiswa,
        data.kelas,
        data.jenis,
        data.nominal,
        data.keterangan || '-',
        data.admin
      ]);
      return responseJSON({ status: "success", message: "Transaksi Tabungan (" + data.jenis + ") berhasil disimpan!" });
    }

    // F2. Hapus Transaksi Tabungan
    if (action === 'deleteTabungan') {
      var sheet = ss.getSheetByName("Tabungan");
      if (!sheet) return responseJSON({ status: "error", message: "Sheet Tabungan tidak ditemukan" });
      
      var rowNum = findRowByIdOrIndex(sheet, data.id, data.sheetRow, 0);
      if (!rowNum) return responseJSON({ status: "error", message: "Baris transaksi tabungan tidak ditemukan." });

      sheet.deleteRow(rowNum);
      return responseJSON({ status: "success", message: "Transaksi Tabungan berhasil dihapus!" });
    }

    return responseJSON({ status: "error", message: "Action POST tidak dikenali." });

  } catch (err) {
    return responseJSON({ status: "error", message: err.toString() });
  } finally {
    lock.releaseLock();
  }
}

// ==========================================
// 3. FUNGSI REKAPITULASI OTOMATIS (PIVOT) - FIXED
// ==========================================
function rekapTransaksiPivoted() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Ambil/Buat Sheet Rekap_Siswa dan BERSAHKAN DULU di awal
  var sheetRekap = ss.getSheetByName("Rekap_Siswa");
  if (!sheetRekap) {
    sheetRekap = ss.insertSheet("Rekap_Siswa");
  }
  sheetRekap.clear(); // Menghapus seluruh isi sheet rekap lama

  var sheetSumber = ss.getSheetByName("Transaksi_Siswa");
  if (!sheetSumber) return;
  
  var data = sheetSumber.getDataRange().getValues();
  // Jika hanya ada header atau sheet kosong, hentikan (sheet rekap sudah bersih)
  if (data.length <= 1) return; 
  
  var rekapMap = {};
  var jenisPembayaranSet = new Set();
  
  // Olah Data Transaksi (C=NISN[2], D=Nama[3], E=Kelas[4], F=Jenis[5], G=Nominal[6])
  for (var i = 1; i < data.length; i++) {
    var idSiswa = String(data[i][2] || '').trim();
    var namaSiswa = String(data[i][3] || '').trim();
    var jenisPembayaran = String(data[i][5] || '').trim();
    var nominal = Number(data[i][6]) || 0;
    
    if (!idSiswa || !jenisPembayaran) continue;
    
    jenisPembayaranSet.add(jenisPembayaran);
    
    var key = idSiswa + "_" + namaSiswa;
    
    if (!rekapMap[key]) {
      rekapMap[key] = {
        id: idSiswa,
        nama: namaSiswa,
        pembayaran: {}
      };
    }
    
    if (rekapMap[key].pembayaran[jenisPembayaran]) {
      rekapMap[key].pembayaran[jenisPembayaran] += nominal;
    } else {
      rekapMap[key].pembayaran[jenisPembayaran] = nominal;
    }
  }
  
  // Urutkan jenis pembayaran secara A-Z
  var daftarJenisPembayaran = Array.from(jenisPembayaranSet).sort();
  
  // Header Table
  var headerRow = ["NISN/ID_Siswa", "Nama_Siswa"].concat(daftarJenisPembayaran).concat(["Total"]);
  var outputData = [headerRow];
  
  // Urutkan Nama Siswa A-Z
  var studentKeys = Object.keys(rekapMap).sort(function(a, b) {
    return rekapMap[a].nama.localeCompare(rekapMap[b].nama);
  });
  
  // Susun Baris Data
  for (var i = 0; i < studentKeys.length; i++) {
    var k = studentKeys[i];
    var siswa = rekapMap[k];
    
    var row = ["'" + siswa.id, siswa.nama];
    var totalSiswa = 0;
    
    for (var j = 0; j < daftarJenisPembayaran.length; j++) {
      var jenis = daftarJenisPembayaran[j];
      var nominalBayar = siswa.pembayaran[jenis] || 0;
      row.push(nominalBayar);
      totalSiswa += nominalBayar;
    }
    
    row.push(totalSiswa);
    outputData.push(row);
  }
  
  // Tulis ke Sheet Rekap & Format Tampilan (jika ada data valid)
  if (outputData.length > 1) {
    var numRows = outputData.length;
    var numCols = outputData[0].length;
    
    var range = sheetRekap.getRange(1, 1, numRows, numCols);
    range.setValues(outputData);
    
    // Style Header
    sheetRekap.getRange(1, 1, 1, numCols)
      .setFontWeight("bold")
      .setBackground("#0d6efd")
      .setFontColor("#ffffff");
      
    // Format Rupiah
    if (numCols > 2) {
      sheetRekap.getRange(2, 3, numRows - 1, numCols - 2)
        .setNumberFormat('Rp#,##0');
    }
    
    // Border & Auto Fit Column
    range.setBorder(true, true, true, true, true, true);
    sheetRekap.autoResizeColumns(1, numCols);
  }
}

// ==========================================
// 4. HELPER FUNCTIONS
// ==========================================

// Mencari baris berdasarkan ID unik. Jika ID tidak dikirim/ditemukan, baru menggunakan fallback sheetRow.
function findRowByIdOrIndex(sheet, targetId, fallbackRow, idColumnIndex) {
  var rows = sheet.getDataRange().getValues();
  if (targetId) {
    for (var i = 1; i < rows.length; i++) {
      if (String(rows[i][idColumnIndex]).trim() === String(targetId).trim()) {
        return i + 1;
      }
    }
  }
  return validateSheetRow(sheet, fallbackRow);
}

function validateSheetRow(sheet, sheetRow) {
  var rowNum = parseInt(sheetRow, 10);
  if (isNaN(rowNum) || rowNum < 2) return null;
  if (rowNum > sheet.getLastRow()) return null;
  return rowNum;
}

function responseJSON(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// ==========================================
// 5. SETUP FUNGSI TABUNGAN (Jalankan Sekali Saja)
// ==========================================
function setupSheetTabungan() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Tabungan");
  
  if (sheet) {
    Browser.msgBox("Sheet 'Tabungan' sudah ada! Tidak perlu dibuat lagi.");
    return;
  }
  
  // 1. Membuat Sheet Baru
  sheet = ss.insertSheet("Tabungan");
  
  // 2. Menentukan Kolom Header
  var headers = [
    "ID_Transaksi", "Tanggal", "NISN", "Nama", "Kelas", 
    "Jenis", "Nominal", "Keterangan", "Petugas"
  ];
  
  var headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setValues([headers]);
  
  // 3. Mempercantik Header (Tebal, Warna Biru, Teks Putih)
  headerRange.setFontWeight("bold");
  headerRange.setBackground("#0d6efd");
  headerRange.setFontColor("#ffffff");
  
  // 4. Freeze baris pertama agar header selalu terlihat saat discroll
  sheet.setFrozenRows(1);
  
  // 5. Mengubah format kolom "Nominal" (Kolom ke-7 / G) menjadi Format Mata Uang (Rp)
  sheet.getRange(2, 7, 1000, 1).setNumberFormat('Rp#,##0');
  
  Browser.msgBox("Sukses! Sheet 'Tabungan' berhasil dibuat beserta formatnya.");
}

