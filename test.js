function test(trxPembayaran, tarifNama) {
  var tPembayaran = String(trxPembayaran || '').replace(/^\s+|\s+$/g, '').toLowerCase();
  var tTarif = String(tarifNama || '').replace(/^\s+|\s+$/g, '').toLowerCase();
  var isBeasiswa = false;
  if (tPembayaran === tTarif) {
    // normal
  } else if (tPembayaran.indexOf('(beasiswa)') !== -1 && tPembayaran.replace('(beasiswa)', '').replace(/^\s+|\s+$/g, '') === tTarif) {
    isBeasiswa = true;
  }
  return isBeasiswa;
}

WScript.Echo(test("MAKESTA (Beasiswa)", "MAKESTA"));
WScript.Echo(test("MAKESTA", "MAKESTA"));

