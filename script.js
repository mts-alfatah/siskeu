// ===================================================
// PWA SERVICE WORKER & INSTALL BANNER
// ===================================================
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('PWA ServiceWorker berhasil didaftarkan'))
      .catch(err => console.log('PWA ServiceWorker gagal', err));
  });
}

// Logika Prompt Install Banner PWA
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
  const installBanner = document.getElementById('pwaInstallBanner');
  if (installBanner) {
    e.preventDefault();
    deferredPrompt = e;

    if (!sessionStorage.getItem('pwaBannerDismissed')) {
      installBanner.style.display = 'flex';
    }
  }
});

// Logika Tombol Hamburger Menu & Event PWA Banner
document.addEventListener('DOMContentLoaded', () => {
  // Sidebar Toggle (Mobile)
  const menuToggles = document.querySelectorAll('.btn-menu');
  const sidebar = document.querySelector('.sidebar');

  if (menuToggles.length > 0 && sidebar) {
    menuToggles.forEach(toggle => {
      toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        sidebar.classList.toggle('open');
      });
    });

    document.querySelector('.main-content')?.addEventListener('click', () => {
      if (sidebar.classList.contains('open')) {
        sidebar.classList.remove('open');
      }
    });

    document.querySelectorAll('.sidebar-menu li').forEach(item => {
      item.addEventListener('click', () => {
        if (sidebar.classList.contains('open')) {
          sidebar.classList.remove('open');
        }
      });
    });
  }

  // PWA Install Banner Handlers
  const btnInstall = document.getElementById('btnPwaInstall');
  const btnClose = document.getElementById('btnPwaClose');
  const installBanner = document.getElementById('pwaInstallBanner');

  if (btnInstall) {
    btnInstall.addEventListener('click', async () => {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      deferredPrompt = null;
      if (installBanner) installBanner.style.display = 'none';
    });
  }

  if (btnClose) {
    btnClose.addEventListener('click', () => {
      if (installBanner) installBanner.style.display = 'none';
      sessionStorage.setItem('pwaBannerDismissed', 'true');
    });
  }
});

window.addEventListener('appinstalled', () => {
  const installBanner = document.getElementById('pwaInstallBanner');
  if (installBanner) installBanner.style.display = 'none';
  deferredPrompt = null;
});

// URL Google Apps Script
const scriptURL = 'https://script.google.com/macros/s/AKfycbyzV8nkEaO-kywXDnfXp1YOmxcRay0soyjJE2wSZHjUQUdjDEZYt41LcXOEDwnZllJikg/exec';

// ===================================================
// 1. LOGIKA HALAMAN LOGIN
// ===================================================
function selectRole(roleName, element) {
  document.querySelectorAll('.role-card').forEach(card => card.classList.remove('active'));
  element.classList.add('active');
  document.getElementById('selectedRole').value = roleName;

  const labelUser = document.getElementById('labelUsername');
  const inputUser = document.getElementById('username');
  const groupPass = document.getElementById('groupPassword');
  const inputPass = document.getElementById('password');

  if (roleName === 'Admin') {
    labelUser.textContent = 'Username';
    inputUser.placeholder = 'Masukkan Username';
    groupPass.style.display = 'block';
    inputPass.required = true;
  } else if (roleName === 'Walikelas') {
    labelUser.textContent = 'PegID / ID Wali Kelas';
    inputUser.placeholder = 'Masukan PegID';
    groupPass.style.display = 'block';
    inputPass.required = true;
  } else if (roleName === 'Siswa') {
    labelUser.textContent = 'NISN Siswa';
    inputUser.placeholder = 'Masukan NISN';
    groupPass.style.display = 'block';
    inputPass.required = true;
  } else if (roleName === 'Kantin') {
    labelUser.textContent = 'ID Kantin';
    inputUser.placeholder = 'Masukan ID Kantin';
    groupPass.style.display = 'block';
    inputPass.required = true;
  }
}

const loginForm = document.getElementById('loginForm');
if (loginForm) {
  // Auto-clear input fields on load (e.g. after logout)
  document.getElementById('username').value = '';
  document.getElementById('password').value = '';

  const savedCreds = JSON.parse(localStorage.getItem('savedCredentials'));
  if (savedCreds) {
    setTimeout(() => {
      const roleCards = document.querySelectorAll('.role-card');
      roleCards.forEach(card => {
        if (card.querySelector('.role-title').textContent.trim() === savedCreds.role) {
          selectRole(savedCreds.role, card);
        }
      });
      document.getElementById('username').value = savedCreds.username || '';
      document.getElementById('password').value = savedCreds.password || '';
      const rememberCheckbox = document.getElementById('rememberMe');
      if (rememberCheckbox) rememberCheckbox.checked = true;
    }, 50);
  }

  loginForm.addEventListener('submit', function (e) {
    e.preventDefault();

    const btnSubmit = document.getElementById('btnSubmit');
    const messageDiv = document.getElementById('message');

    btnSubmit.disabled = true;
    btnSubmit.textContent = 'Memeriksa...';
    messageDiv.style.color = '#0d6efd';
    messageDiv.textContent = 'Menghubungkan ke server...';

    const payload = {
      role: document.getElementById('selectedRole').value,
      username: document.getElementById('username').value.trim(),
      password: document.getElementById('password').value.trim()
    };

    fetch(scriptURL, {
      method: 'POST',
      body: JSON.stringify(payload),
      redirect: 'follow'
    })
      .then(response => {
        if (!response.ok) throw new Error('Gagal terhubung ke server.');
        return response.json();
      })
      .then(data => {
        btnSubmit.disabled = false;
        btnSubmit.textContent = 'Masuk';

        if (data.status === 'success') {
          const roleLower = String(data.user.role || '').trim().toLowerCase();
          const selectedRoleLower = payload.role.trim().toLowerCase();

          // Validasi apakah role yang dipilih sesuai dengan role asli akun
          if (roleLower !== selectedRoleLower) {
            messageDiv.style.color = '#dc3545';
            messageDiv.textContent = `Gagal login: Akun ini tidak memiliki akses sebagai ${payload.role}`;
            return;
          }

          messageDiv.style.color = '#198754';
          messageDiv.textContent = `Login Berhasil! Mengalihkan...`;

          localStorage.setItem('userSession', JSON.stringify(data.user));
          
          const rememberCheckbox = document.getElementById('rememberMe');
          if (rememberCheckbox && rememberCheckbox.checked) {
            localStorage.setItem('savedCredentials', JSON.stringify({
              role: payload.role,
              username: payload.username,
              password: payload.password
            }));
          } else {
            localStorage.removeItem('savedCredentials');
          }

          setTimeout(() => {
            if (roleLower === 'admin') window.location.href = 'dashboard.html';
            else if (roleLower === 'walikelas') window.location.href = 'walikelas.html';
            else if (roleLower === 'siswa') window.location.href = 'siswa.html';
            else if (roleLower === 'kantin') window.location.href = 'kantin.html';
            else {
              messageDiv.style.color = '#dc3545';
              messageDiv.textContent = 'Role tidak dikenali: ' + data.user.role;
            }
          }, 1000);
        } else {
          messageDiv.style.color = '#dc3545';
          messageDiv.textContent = data.message;
        }
      })
      .catch(error => {
        btnSubmit.disabled = false;
        btnSubmit.textContent = 'Masuk';
        messageDiv.style.color = '#dc3545';
        messageDiv.textContent = 'Gagal terhubung server.';
        console.error('Error:', error);
      });
  });
}

// ===================================================
// 2. LOGIKA HALAMAN DASHBOARD ADMIN
// ===================================================
const pageTitleElem = document.getElementById('pageTitle');

if (pageTitleElem) {
  const session = JSON.parse(localStorage.getItem('userSession'));
  if (!session || String(session.role || '').trim().toLowerCase() !== 'admin') {
    alert('Sesi habis atau akses ditolak.');
    window.location.href = 'index.html';
  } else {
    const adminLabel = document.getElementById('adminNameLabel');
    if (adminLabel) adminLabel.textContent = `Halo, ${session.nama}`;
  }
}

function logout() {
  localStorage.removeItem('userSession');
  window.location.replace('index.html');
}

// Mencegah user kembali ke halaman dashboard setelah logout menggunakan tombol Back di browser (Bfcache)
window.addEventListener('pageshow', function (event) {
  const path = window.location.pathname.toLowerCase();
  const isProtectedPage = path.includes('dashboard.html') || path.includes('walikelas.html') || path.includes('siswa.html') || path.includes('kantin.html');
  
  if (isProtectedPage && !localStorage.getItem('userSession')) {
    window.location.replace('index.html');
  }
});

function formatRp(value) {
  let num = parseFloat(value) || 0;
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
}

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function toComparableDate(val) {
  if (!val) return null;
  const d = new Date(val);
  if (!isNaN(d.getTime())) return d;
  const parts = String(val).split('/');
  if (parts.length === 3) {
    const d2 = new Date(parts, parts - 1, parts[0]);
    if (!isNaN(d2.getTime())) return d2;
  }
  return null;
}

function inDateRange(val, fromId, toId) {
  const from = document.getElementById(fromId)?.value;
  const to = document.getElementById(toId)?.value;
  if (!from && !to) return true;
  const d = toComparableDate(val);
  if (!d) return true;
  if (from && d < new Date(from)) return false;
  if (to && d > new Date(to + 'T23:59:59')) return false;
  return true;
}

function clearFilter(prefix) {
  ['search-', 'from-', 'to-', 'jenis-', 'role-', 'kelas-'].forEach(p => {
    const el = document.getElementById(p + prefix);
    if (el) el.value = '';
  });
  if (prefix === 'ts') renderTransaksiSiswa();
  if (prefix === 'ti') renderTransaksiInternal();
  if (prefix === 'tp') renderTarifPembayaran();
  if (prefix === 'akun') renderAkun();
  if (prefix === 'laporan') renderLaporan();
  if (prefix === 'tabungan') renderTabunganAdmin();
}

function openModal(id) { document.getElementById(id)?.classList.add('active'); }
function closeModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.remove('active');
  if (id === 'modal-transaksi-siswa') {
    document.getElementById('form-ts').reset();
    document.getElementById('ts_sheetRow').value = '';
    document.getElementById('ts_pembayaran').innerHTML = '<option value="">-- Pilih Siswa terlebih dahulu --</option>';
    document.getElementById('modal-ts-title').textContent = 'Input Pembayaran Siswa';
  }
  if (id === 'modal-transaksi-internal') { document.getElementById('form-ti').reset(); document.getElementById('ti_sheetRow').value = ''; document.getElementById('modal-ti-title').textContent = 'Input Transaksi Internal'; }
  if (id === 'modal-jenis-pembayaran') { document.getElementById('form-tp').reset(); document.getElementById('tp_sheetRow').value = ''; document.getElementById('modal-tp-title').textContent = 'Pengaturan Tarif Pembayaran'; }
  if (id === 'modal-akun') {
    document.getElementById('form-akun').reset();
    document.getElementById('akun_sheetRow').value = '';
    document.getElementById('akun_password').required = true;
    document.getElementById('akun_password_hint').style.display = 'none';
    document.getElementById('modal-akun-title').textContent = 'Tambah Akun';
  }
}

// Navigasi Dashboard
const navItems = document.querySelectorAll('.nav-item');
navItems.forEach(item => {
  item.addEventListener('click', function (e) {
    e.preventDefault();
    navItems.forEach(nav => nav.classList.remove('active'));
    this.classList.add('active');
    document.querySelectorAll('.page-section, .tab-content').forEach(section => {
      section.classList.remove('active');
      section.style.display = 'none';
    });
    const targetId = this.getAttribute('data-target');
    const targetElem = document.getElementById(targetId);
    if (targetElem) {
      targetElem.classList.add('active');
      targetElem.style.display = 'block';
    }
    if (pageTitleElem) pageTitleElem.textContent = this.textContent.replace(/[^a-zA-Z0-9 &]/g, '').trim();
    loadDataForSection(targetId);
  });
});

function loadDataForSection(sectionId) {
  if (sectionId === 'transaksi-siswa') loadTransaksiSiswa();
  if (sectionId === 'tabungan-siswa') loadTabunganAdmin();
  if (sectionId === 'transaksi-internal') loadTransaksiInternal();
  if (sectionId === 'jenis-pembayaran') loadTarifPembayaran();
  if (sectionId === 'manajemen-akun') loadAkun();
  if (sectionId === 'laporan-total') loadLaporanTotal();
}

// Data Storage Dashboard
let rawTs = [], filteredTs = [], rawTi = [], filteredTi = [], rawTp = [], filteredTp = [], rawAkun = [], filteredAkun = [], rawLaporan = [], filteredLaporan = [];
let tsModalSiswaList = [], tsModalTarifList = [];

// State Paginasi
let pageTs = 1, pageTi = 1, pageTp = 1, pageAkun = 1, pageLaporan = 1;
let pageWkTagihan = 1, pageWkLaporan = 1;
let pageSiswaTagihan = 1, pageSiswaRiwayat = 1;
const PAGE_LIMIT = 10;

function renderPagination(totalItems, limit, currentPage, containerId, onPageChange) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';
  
  const totalPages = Math.ceil(totalItems / limit);
  if (totalPages <= 1) return;
  
  const btnPrev = document.createElement('button');
  btnPrev.className = 'btn-page';
  btnPrev.textContent = 'Â« Prev';
  btnPrev.disabled = currentPage === 1;
  btnPrev.onclick = () => onPageChange(currentPage - 1);
  container.appendChild(btnPrev);

  let startPage = Math.max(1, currentPage - 2);
  let endPage = Math.min(totalPages, startPage + 4);
  if (endPage - startPage < 4) {
    startPage = Math.max(1, endPage - 4);
  }

  for (let i = startPage; i <= endPage; i++) {
    const btn = document.createElement('button');
    btn.className = 'btn-page' + (i === currentPage ? ' active' : '');
    btn.textContent = i;
    btn.onclick = () => onPageChange(i);
    container.appendChild(btn);
  }

  const btnNext = document.createElement('button');
  btnNext.className = 'btn-page';
  btnNext.textContent = 'Next Â»';
  btnNext.disabled = currentPage === totalPages;
  btnNext.onclick = () => onPageChange(currentPage + 1);
  container.appendChild(btnNext);
}

// ---------------------------------------------------
// 2.1 TRANSAKSI SISWA (Tanpa Review/Kalkulasi Ringkasan)
// ---------------------------------------------------
function loadTransaksiSiswa() {
  const tbody = document.getElementById('tbody-transaksi-siswa');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">â³ Memuat data...</td></tr>';
  fetch(scriptURL + '?t=' + new Date().getTime() + '&action=getTransaksiSiswa')
    .then(r => r.json())
    .then(res => { rawTs = (res.status === 'success') ? res.data : []; renderTransaksiSiswa(); })
    .catch(() => { tbody.innerHTML = '<tr><td colspan="7" class="empty-state">Gagal memuat data.</td></tr>'; });
}

function renderTransaksiSiswa(resetPage = true) {
  if (resetPage === true) pageTs = 1;
  const tbody = document.getElementById('tbody-transaksi-siswa');
  if (!tbody) return;
  const q = (document.getElementById('search-ts')?.value || '').toLowerCase().trim();

  filteredTs = rawTs.filter(r => {
    const matchesSearch = !q || [r.nama, r.nisn, r.kelas, r.pembayaran].some(v => String(v || '').toLowerCase().includes(q));
    const matchesDate = inDateRange(r.tanggal, 'from-ts', 'to-ts');
    return matchesSearch && matchesDate;
  });

  const start = (pageTs - 1) * PAGE_LIMIT;
  const paginated = filteredTs.slice(start, start + PAGE_LIMIT);
  const end = Math.min(start + PAGE_LIMIT, filteredTs.length);

  document.getElementById('count-ts').textContent = `Menampilkan ${filteredTs.length > 0 ? start + 1 : 0}-${end} dari ${filteredTs.length} transaksi`;
  renderPagination(filteredTs.length, PAGE_LIMIT, pageTs, 'pg-ts', (p) => { pageTs = p; renderTransaksiSiswa(false); });

  if (paginated.length > 0) {
    tbody.innerHTML = paginated.map(r => `
      <tr>
        <td>${escapeHtml(r.tanggal)}</td>
        <td><strong>${escapeHtml(r.nama)}</strong><br><small style="color:gray;">${escapeHtml(r.nisn)}</small></td>
        <td><span style="padding:2px 6px; border-radius:4px; font-size:12px; background:#e2e3e5; font-weight:bold;">${escapeHtml(r.kelas || '-')}</span></td>
        <td>${escapeHtml(r.pembayaran)}</td>
        <td style="color:green; font-weight:bold;">${formatRp(r.nominal)}</td>
        <td>${escapeHtml(r.admin) || '-'}</td>
        <td>
          <div class="row-actions">
            <button class="btn-icon btn-edit" onclick="editTransaksiSiswa(${r.sheetRow})">âœï¸ Edit</button>
            <button class="btn-icon btn-delete" onclick="deleteTransaksiSiswa(${r.sheetRow})">ðŸ—‘ï¸ Hapus</button>
          </div>
        </td>
      </tr>
    `).join('');
  } else {
    tbody.innerHTML = '<tr><td colspan="7" class="empty-state">Tidak ada data yang cocok.</td></tr>';
  }
}

function openAddTsModal() {
  Promise.all([
    fetch(scriptURL + '?t=' + new Date().getTime() + '&action=getAccounts').then(r => r.json()),
    fetch(scriptURL + '?t=' + new Date().getTime() + '&action=getTarifPembayaran').then(r => r.json())
  ]).then(([resAkun, resTarif]) => {
    if (resAkun.status === 'success') tsModalSiswaList = resAkun.data.filter(a => String(a.role).toLowerCase() === 'siswa');
    if (resTarif.status === 'success') tsModalTarifList = resTarif.data;

    const selectSiswa = document.getElementById('ts_siswaSelect');
    selectSiswa.innerHTML = '<option value="">-- Pilih Siswa --</option>' +
      tsModalSiswaList.map(s => `<option value="${escapeHtml(s.idLogin)}|${escapeHtml(s.nama)}|${escapeHtml(s.kelas)}">${escapeHtml(s.idLogin)} - ${escapeHtml(s.nama)} (Kelas ${escapeHtml(s.kelas)})</option>`).join('');

    const searchSiswa = document.getElementById('ts_searchSiswa');
    if (searchSiswa) searchSiswa.value = '';

    document.getElementById('ts_pembayaran').innerHTML = '<option value="">-- Pilih Siswa terlebih dahulu --</option>';
    document.getElementById('ts_nominal').value = '';

    document.getElementById('fg-pembayaran-single').style.display = 'none';
    document.getElementById('fg-pembayaran-multi').style.display = 'block';
    const cb = document.getElementById('ts_pembayaran_checkboxes');
    if (cb) cb.innerHTML = '<span style="color:gray; font-size: 13px;">-- Pilih Siswa terlebih dahulu --</span>';
    
    document.getElementById('ts_pembayaran').required = false;
    document.getElementById('ts_nominal').required = false;

    document.getElementById('ts_sheetRow').value = '';
    document.getElementById('modal-ts-title').textContent = 'Input Pembayaran Siswa';
    openModal('modal-transaksi-siswa');
  }).catch(err => alert('Gagal memuat data siswa/tarif: ' + err.message));
}

document.getElementById('ts_searchSiswa')?.addEventListener('input', function () {
  const keyword = this.value.toLowerCase().trim();
  const selectSiswa = document.getElementById('ts_siswaSelect');
  
  if (!keyword) {
    selectSiswa.innerHTML = '<option value="">-- Pilih Siswa --</option>' +
      tsModalSiswaList.map(s => `<option value="${escapeHtml(s.idLogin)}|${escapeHtml(s.nama)}|${escapeHtml(s.kelas)}">${escapeHtml(s.idLogin)} - ${escapeHtml(s.nama)} (Kelas ${escapeHtml(s.kelas)})</option>`).join('');
    selectSiswa.selectedIndex = 0;
    selectSiswa.dispatchEvent(new Event('change'));
    return;
  }

  const filteredSiswa = tsModalSiswaList.filter(s => 
    String(s.nama).toLowerCase().includes(keyword) || 
    String(s.idLogin).toLowerCase().includes(keyword)
  );

  selectSiswa.innerHTML = '<option value="">-- Pilih Siswa --</option>' +
    filteredSiswa.map(s => `<option value="${escapeHtml(s.idLogin)}|${escapeHtml(s.nama)}|${escapeHtml(s.kelas)}">${escapeHtml(s.idLogin)} - ${escapeHtml(s.nama)} (Kelas ${escapeHtml(s.kelas)})</option>`).join('');

  const exactMatch = filteredSiswa.find(s => String(s.idLogin).toLowerCase() === keyword || String(s.nama).toLowerCase() === keyword);
  if (exactMatch) {
    selectSiswa.value = `${exactMatch.idLogin}|${exactMatch.nama}|${exactMatch.kelas}`;
    selectSiswa.dispatchEvent(new Event('change'));
  } else if (filteredSiswa.length === 1) {
    selectSiswa.selectedIndex = 1;
    selectSiswa.dispatchEvent(new Event('change'));
  } else {
    selectSiswa.selectedIndex = 0;
    selectSiswa.dispatchEvent(new Event('change'));
  }
});

document.getElementById('ts_siswaSelect')?.addEventListener('change', function () {
  const val = this.value;
  const selectPembayaran = document.getElementById('ts_pembayaran');
  const checkboxContainer = document.getElementById('ts_pembayaran_checkboxes');

  if (!val) {
    selectPembayaran.innerHTML = '<option value="">-- Pilih Siswa terlebih dahulu --</option>';
    document.getElementById('ts_nominal').value = '';
    if (checkboxContainer) checkboxContainer.innerHTML = '<span style="color:gray; font-size: 13px;">-- Pilih Siswa terlebih dahulu --</span>';
    return;
  }
  const parts = val.split('|');
  const siswaKelas = parts.length > 2 ? parts[2] : '';
  const filteredTarif = tsModalTarifList.filter(t => {
    const target = String(t.targetKelas || '').toLowerCase();
    return target.includes('semua') || target.includes(siswaKelas.toLowerCase());
  });

  // Populate Single Select
  selectPembayaran.innerHTML = '<option value="">-- Pilih Jenis Pembayaran --</option>' +
    filteredTarif.map(t => `<option value="${escapeHtml(t.namaPembayaran)}" data-nominal="${t.nominalTarif}">${escapeHtml(t.namaPembayaran)} (${formatRp(t.nominalTarif)})</option>`).join('');

  // Populate Multi Checkboxes
  if (checkboxContainer) {
    if (filteredTarif.length === 0) {
      checkboxContainer.innerHTML = '<span style="color:red; font-size: 13px;">Belum ada tarif pembayaran untuk kelas siswa ini.</span>';
    } else {
      checkboxContainer.innerHTML = filteredTarif.map((t, idx) => `
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; border-bottom: 1px solid #eee; padding-bottom: 8px;">
          <label style="margin:0; font-weight:normal; display:flex; align-items:flex-start; gap:8px; cursor:pointer; flex: 1; padding-right: 10px;">
            <input type="checkbox" class="ts_multi_check" value="${escapeHtml(t.namaPembayaran)}" data-nominal="${t.nominalTarif}" id="chk_${idx}" style="cursor:pointer; flex-shrink:0; margin-top:4px; width:auto; height:auto;">
            <span style="text-align:left; line-height:1.3;">${escapeHtml(t.namaPembayaran)}</span>
          </label>
          <input type="number" id="nom_${idx}" class="ts_multi_nominal" value="${t.nominalTarif}" style="width: 120px; padding: 4px; border: 1px solid #ccc; border-radius: 4px; flex-shrink:0;" disabled>
        </div>
      `).join('');

      document.querySelectorAll('.ts_multi_check').forEach((chk, i) => {
        chk.addEventListener('change', function() {
          const numInput = document.getElementById('nom_' + i);
          numInput.disabled = !this.checked;
          if (this.checked) numInput.focus();
        });
      });
    }
  }
});

document.getElementById('ts_pembayaran')?.addEventListener('change', function () {
  const selectedOpt = this.options[this.selectedIndex];
  if (selectedOpt && selectedOpt.dataset.nominal) {
    document.getElementById('ts_nominal').value = selectedOpt.dataset.nominal;
  }
});

function editTransaksiSiswa(sheetRow) {
  const item = rawTs.find(r => r.sheetRow === sheetRow);
  if (!item) return alert('Data tidak ditemukan.');
  openAddTsModal();
  setTimeout(() => {
    document.getElementById('ts_sheetRow').value = item.sheetRow;
    document.getElementById('modal-ts-title').textContent = 'Edit Transaksi Siswa';

    document.getElementById('fg-pembayaran-single').style.display = 'block';
    document.getElementById('fg-pembayaran-multi').style.display = 'none';
    document.getElementById('ts_pembayaran').required = true;
    document.getElementById('ts_nominal').required = true;
    const selectSiswa = document.getElementById('ts_siswaSelect');
    for (let i = 0; i < selectSiswa.options.length; i++) {
      if (selectSiswa.options[i].value.startsWith(item.nisn + '|')) {
        selectSiswa.selectedIndex = i;
        selectSiswa.dispatchEvent(new Event('change'));
        break;
      }
    }
    setTimeout(() => {
      document.getElementById('ts_pembayaran').value = item.pembayaran;
      document.getElementById('ts_nominal').value = item.nominal;
    }, 100);
  }, 300);
}

function deleteTransaksiSiswa(sheetRow) {
  if (!confirm('Apakah Anda yakin ingin menghapus transaksi siswa ini?')) return;
  fetch(scriptURL, { method: 'POST', body: JSON.stringify({ action: 'deleteTransaksiSiswa', sheetRow: sheetRow }) })
    .then(r => r.json())
    .then(res => { alert(res.message || 'Transaksi berhasil dihapus.'); loadTransaksiSiswa(); })
    .catch(err => alert('Gagal menghapus: ' + err.message));
}

// ---------------------------------------------------
// 2.2 TRANSAKSI INTERNAL (Tanpa Review/Kalkulasi Ringkasan)
// ---------------------------------------------------
function loadTransaksiInternal() {
  const tbody = document.getElementById('tbody-transaksi-internal');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">â³ Memuat data...</td></tr>';
  fetch(scriptURL + '?t=' + new Date().getTime() + '&action=getTransaksiInternal')
    .then(r => r.json())
    .then(res => { rawTi = (res.status === 'success') ? res.data : []; renderTransaksiInternal(); })
    .catch(() => { tbody.innerHTML = '<tr><td colspan="6" class="empty-state">Gagal memuat data.</td></tr>'; });
}

function renderTransaksiInternal(resetPage = true) {
  if (resetPage === true) pageTi = 1;
  const tbody = document.getElementById('tbody-transaksi-internal');
  if (!tbody) return;
  const q = (document.getElementById('search-ti')?.value || '').toLowerCase().trim();
  const jenisFilter = document.getElementById('jenis-ti')?.value;

  filteredTi = rawTi.filter(r => {
    const matchesSearch = !q || String(r.keterangan || '').toLowerCase().includes(q);
    const matchesJenis = !jenisFilter || r.jenis === jenisFilter;
    const matchesDate = inDateRange(r.tanggal, 'from-ti', 'to-ti');
    return matchesSearch && matchesJenis && matchesDate;
  });

  const start = (pageTi - 1) * PAGE_LIMIT;
  const paginated = filteredTi.slice(start, start + PAGE_LIMIT);
  const end = Math.min(start + PAGE_LIMIT, filteredTi.length);

  document.getElementById('count-ti').textContent = `Menampilkan ${filteredTi.length > 0 ? start + 1 : 0}-${end} dari ${filteredTi.length} transaksi`;
  renderPagination(filteredTi.length, PAGE_LIMIT, pageTi, 'pg-ti', (p) => { pageTi = p; renderTransaksiInternal(false); });

  if (paginated.length > 0) {
    tbody.innerHTML = paginated.map(r => {
      let badge = r.jenis === 'Pemasukan' ? '<span style="color:green;font-weight:bold;">(+) Pemasukan</span>' : '<span style="color:red;font-weight:bold;">(-) Pengeluaran</span>';
      return `
        <tr>
          <td>${escapeHtml(r.tanggal)}</td>
          <td>${badge}</td>
          <td>${escapeHtml(r.keterangan)}</td>
          <td style="font-weight:bold;">${formatRp(r.nominal)}</td>
          <td>${escapeHtml(r.admin) || '-'}</td>
          <td>
            <div class="row-actions">
              <button class="btn-icon btn-edit" onclick="editTransaksiInternal(${r.sheetRow})">âœï¸ Edit</button>
              <button class="btn-icon btn-delete" onclick="deleteTransaksiInternal(${r.sheetRow})">ðŸ—‘ï¸ Hapus</button>
            </div>
          </td>
        </tr>`;
    }).join('');
  } else {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-state">Tidak ada data yang cocok.</td></tr>';
  }
}

function editTransaksiInternal(sheetRow) {
  const item = rawTi.find(r => r.sheetRow === sheetRow);
  if (!item) return alert('Data tidak ditemukan.');
  document.getElementById('ti_sheetRow').value = item.sheetRow;
  document.getElementById('ti_jenis').value = item.jenis;
  document.getElementById('ti_keterangan').value = item.keterangan;
  document.getElementById('ti_nominal').value = item.nominal;
  document.getElementById('modal-ti-title').textContent = 'Edit Transaksi Internal';
  openModal('modal-transaksi-internal');
}

function deleteTransaksiInternal(sheetRow) {
  if (!confirm('Apakah Anda yakin ingin menghapus transaksi internal ini?')) return;
  fetch(scriptURL, { method: 'POST', body: JSON.stringify({ action: 'deleteTransaksiInternal', sheetRow: sheetRow }) })
    .then(r => r.json())
    .then(res => { alert(res.message || 'Transaksi berhasil dihapus.'); loadTransaksiInternal(); })
    .catch(err => alert('Gagal menghapus: ' + err.message));
}

// ---------------------------------------------------
// 2.3 TARIF PEMBAYARAN
// ---------------------------------------------------
function loadTarifPembayaran() {
  const tbody = document.getElementById('tbody-tarif-pembayaran');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">â³ Memuat data...</td></tr>';
  fetch(scriptURL + '?t=' + new Date().getTime() + '&action=getTarifPembayaran')
    .then(r => r.json())
    .then(res => { rawTp = (res.status === 'success') ? res.data : []; renderTarifPembayaran(); })
    .catch(() => { tbody.innerHTML = '<tr><td colspan="4" class="empty-state">Gagal memuat data.</td></tr>'; });
}

function renderTarifPembayaran(resetPage = true) {
  if (resetPage === true) pageTp = 1;
  const tbody = document.getElementById('tbody-tarif-pembayaran');
  if (!tbody) return;
  const q = (document.getElementById('search-tp')?.value || '').toLowerCase().trim();
  filteredTp = rawTp.filter(r => !q || [r.namaPembayaran, r.targetKelas].some(v => String(v || '').toLowerCase().includes(q)));
  
  const start = (pageTp - 1) * PAGE_LIMIT;
  const paginated = filteredTp.slice(start, start + PAGE_LIMIT);
  const end = Math.min(start + PAGE_LIMIT, filteredTp.length);

  document.getElementById('count-tp').textContent = `Menampilkan ${filteredTp.length > 0 ? start + 1 : 0}-${end} dari ${filteredTp.length} tarif`;
  renderPagination(filteredTp.length, PAGE_LIMIT, pageTp, 'pg-tp', (p) => { pageTp = p; renderTarifPembayaran(false); });

  if (paginated.length > 0) {
    tbody.innerHTML = paginated.map(r => `
      <tr>
        <td><strong>${escapeHtml(r.namaPembayaran)}</strong></td>
        <td>${escapeHtml(r.targetKelas)}</td>
        <td style="font-weight:bold;">${formatRp(r.nominalTarif)}</td>
        <td>
          <div class="row-actions">
            <button class="btn-icon btn-edit" onclick="editTarifPembayaran(${r.sheetRow})">âœï¸ Edit</button>
            <button class="btn-icon btn-delete" onclick="deleteTarifPembayaran(${r.sheetRow})">ðŸ—‘ï¸ Hapus</button>
          </div>
        </td>
      </tr>`).join('');
  } else {
    tbody.innerHTML = '<tr><td colspan="4" class="empty-state">Tidak ada data yang cocok.</td></tr>';
  }
}

function editTarifPembayaran(sheetRow) {
  const item = rawTp.find(r => r.sheetRow === sheetRow);
  if (!item) return alert('Data tidak ditemukan.');
  document.getElementById('tp_sheetRow').value = item.sheetRow;
  document.getElementById('tp_nama').value = item.namaPembayaran;
  document.getElementById('tp_kelas').value = item.targetKelas;
  document.getElementById('tp_nominal').value = item.nominalTarif;
  document.getElementById('modal-tp-title').textContent = 'Edit Tarif Pembayaran';
  openModal('modal-jenis-pembayaran');
}

function deleteTarifPembayaran(sheetRow) {
  if (!confirm('Apakah Anda yakin ingin menghapus tarif pembayaran ini?')) return;
  fetch(scriptURL, { method: 'POST', body: JSON.stringify({ action: 'deleteTarifPembayaran', sheetRow: sheetRow }) })
    .then(r => r.json())
    .then(res => { alert(res.message || 'Tarif berhasil dihapus.'); loadTarifPembayaran(); })
    .catch(err => alert('Gagal menghapus: ' + err.message));
}

// ---------------------------------------------------
// 2.4 MANAJEMEN AKUN
// ---------------------------------------------------
function loadAkun() {
  const tbody = document.getElementById('tbody-akun');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">â³ Memuat data...</td></tr>';
  fetch(scriptURL + '?t=' + new Date().getTime() + '&action=getAccounts')
    .then(r => r.json())
    .then(res => { rawAkun = (res.status === 'success') ? res.data : []; renderAkun(); })
    .catch(() => { tbody.innerHTML = '<tr><td colspan="5" class="empty-state">Gagal memuat data.</td></tr>'; });
}

function renderAkun(resetPage = true) {
  if (resetPage === true) pageAkun = 1;
  const tbody = document.getElementById('tbody-akun');
  if (!tbody) return;
  const q = (document.getElementById('search-akun')?.value || '').toLowerCase().trim();
  const roleFilter = document.getElementById('role-akun')?.value;
  filteredAkun = rawAkun.filter(r => {
    const matchesSearch = !q || [r.idLogin, r.nama, r.kelas].some(v => String(v || '').toLowerCase().includes(q));
    const matchesRole = !roleFilter || String(r.role).toLowerCase() === roleFilter.toLowerCase();
    return matchesSearch && matchesRole;
  });
  
  const start = (pageAkun - 1) * PAGE_LIMIT;
  const paginated = filteredAkun.slice(start, start + PAGE_LIMIT);
  const end = Math.min(start + PAGE_LIMIT, filteredAkun.length);

  document.getElementById('count-akun').textContent = `Menampilkan ${filteredAkun.length > 0 ? start + 1 : 0}-${end} dari ${filteredAkun.length} akun`;
  renderPagination(filteredAkun.length, PAGE_LIMIT, pageAkun, 'pg-akun', (p) => { pageAkun = p; renderAkun(false); });

  if (paginated.length > 0) {
    tbody.innerHTML = paginated.map(r => `
      <tr>
        <td><strong>${escapeHtml(r.idLogin)}</strong></td>
        <td>${escapeHtml(r.nama)}</td>
        <td><span style="padding: 3px 8px; border-radius: 4px; font-size:12px; background:#e2e3e5; font-weight:bold;">${escapeHtml(r.role)}</span></td>
        <td>${escapeHtml(r.kelas) || '-'}</td>
        <td>
          <div class="row-actions">
            <button class="btn-icon btn-edit" onclick="editAkun(${r.sheetRow})">âœï¸ Edit</button>
            <button class="btn-icon btn-delete" onclick="deleteAkun(${r.sheetRow})">ðŸ—‘ï¸ Hapus</button>
          </div>
        </td>
      </tr>`).join('');
  } else {
    tbody.innerHTML = '<tr><td colspan="5" class="empty-state">Tidak ada data yang cocok.</td></tr>';
  }
}

function openAddAkunModal() {
  document.getElementById('form-akun').reset();
  document.getElementById('akun_sheetRow').value = '';
  document.getElementById('akun_password').required = true;
  document.getElementById('akun_password_hint').style.display = 'none';
  document.getElementById('modal-akun-title').textContent = 'Tambah Akun';
  openModal('modal-akun');
}

function editAkun(sheetRow) {
  const item = rawAkun.find(r => r.sheetRow === sheetRow);
  if (!item) return alert('Data tidak ditemukan.');
  document.getElementById('akun_sheetRow').value = item.sheetRow;
  document.getElementById('akun_role').value = item.role;
  document.getElementById('akun_idLogin').value = item.idLogin;
  document.getElementById('akun_nama').value = item.nama;
  document.getElementById('akun_kelas').value = item.kelas || '';
  document.getElementById('akun_password').value = '';
  document.getElementById('akun_password').required = false;
  document.getElementById('akun_password_hint').style.display = 'block';
  document.getElementById('modal-akun-title').textContent = 'Edit Akun';
  openModal('modal-akun');
}

function deleteAkun(sheetRow) {
  if (!confirm('Apakah Anda yakin ingin menghapus akun ini?')) return;
  fetch(scriptURL, { method: 'POST', body: JSON.stringify({ action: 'deleteAccount', sheetRow: sheetRow }) })
    .then(r => r.json())
    .then(res => { alert(res.message || 'Akun berhasil dihapus.'); loadAkun(); })
    .catch(err => alert('Gagal menghapus: ' + err.message));
}

// ---------------------------------------------------
// 2.5 LAPORAN KEUANGAN
// ---------------------------------------------------
function loadLaporanTotal() {
  Promise.all([
    fetch(scriptURL + '?t=' + new Date().getTime() + '&action=getTransaksiSiswa').then(r => r.json()),
    fetch(scriptURL + '?t=' + new Date().getTime() + '&action=getTransaksiInternal').then(r => r.json())
  ]).then(([resTs, resTi]) => {
    const listTs = (resTs.status === 'success') ? resTs.data : [];
    const listTi = (resTi.status === 'success') ? resTi.data : [];

    let totalPemasukan = 0, totalPengeluaran = 0;
    rawLaporan = [];

    listTs.forEach(item => {
      let nom = parseFloat(item.nominal) || 0;
      let isBeasiswa = String(item.pembayaran || '').includes('(Beasiswa)');
      if (!isBeasiswa) {
        totalPemasukan += nom;
      }
      rawLaporan.push({
        tanggal: item.tanggal,
        sumber: 'Siswa (' + item.nama + ')',
        kelas: item.kelas || '-',
        keterangan: item.pembayaran,
        jenis: isBeasiswa ? 'Beasiswa' : 'Pemasukan',
        nominal: nom,
        admin: item.admin
      });
    });

    listTi.forEach(item => {
      let nom = parseFloat(item.nominal) || 0;
      if (item.jenis === 'Pemasukan') totalPemasukan += nom;
      else totalPengeluaran += nom;
      rawLaporan.push({
        tanggal: item.tanggal,
        sumber: 'Internal',
        kelas: '-',
        keterangan: item.keterangan,
        jenis: item.jenis,
        nominal: nom,
        admin: item.admin
      });
    });

    document.getElementById('total-pemasukan').textContent = formatRp(totalPemasukan);
    document.getElementById('total-pengeluaran').textContent = formatRp(totalPengeluaran);
    document.getElementById('saldo-total').textContent = formatRp(totalPemasukan - totalPengeluaran);

    // Populate Dropdown Filter Kelas
    const kelasSelect = document.getElementById('kelas-laporan');
    if (kelasSelect) {
      const uniqueKelas = [...new Set(rawLaporan.map(r => r.kelas).filter(k => k && k !== '-'))].sort();
      kelasSelect.innerHTML = '<option value="">Semua Kelas</option>' +
        uniqueKelas.map(k => `<option value="${escapeHtml(k)}">Kelas ${escapeHtml(k)}</option>`).join('');
    }

    renderLaporan();
  }).catch(err => alert('Gagal memuat laporan: ' + err.message));
}

function renderLaporan(resetPage = true) {
  if (resetPage === true) pageLaporan = 1;
  const tbody = document.getElementById('tbody-laporan');
  if (!tbody) return;
  const jenisFilter = document.getElementById('jenis-laporan')?.value;
  const kelasFilter = document.getElementById('kelas-laporan')?.value;

  filteredLaporan = rawLaporan.filter(r => {
    const matchesJenis = !jenisFilter || r.jenis === jenisFilter;
    const matchesKelas = !kelasFilter || r.kelas === kelasFilter;
    const matchesDate = inDateRange(r.tanggal, 'from-laporan', 'to-laporan');
    return matchesJenis && matchesKelas && matchesDate;
  });

  let pMasuk = 0, pKeluar = 0;
  filteredLaporan.forEach(r => {
    if (r.jenis === 'Pemasukan') pMasuk += r.nominal;
    else pKeluar += r.nominal;
  });

  document.getElementById('periode-pemasukan').textContent = formatRp(pMasuk);
  document.getElementById('periode-pengeluaran').textContent = formatRp(pKeluar);
  document.getElementById('periode-selisih').textContent = formatRp(pMasuk - pKeluar);
  
  const start = (pageLaporan - 1) * PAGE_LIMIT;
  const paginated = filteredLaporan.slice(start, start + PAGE_LIMIT);
  const end = Math.min(start + PAGE_LIMIT, filteredLaporan.length);

  document.getElementById('count-laporan').textContent = `Menampilkan ${filteredLaporan.length > 0 ? start + 1 : 0}-${end} dari ${filteredLaporan.length} transaksi`;
  renderPagination(filteredLaporan.length, PAGE_LIMIT, pageLaporan, 'pg-laporan', (p) => { pageLaporan = p; renderLaporan(false); });

  if (paginated.length > 0) {
    tbody.innerHTML = paginated.map(r => {
      let badge = '';
      if (r.jenis === 'Pemasukan') badge = '<span style="color:green;font-weight:bold;">Pemasukan</span>';
      else if (r.jenis === 'Pengeluaran') badge = '<span style="color:red;font-weight:bold;">Pengeluaran</span>';
      else if (r.jenis === 'Beasiswa') badge = '<span style="color:#0d6efd;font-weight:bold;">Beasiswa</span>';
      return `
        <tr>
          <td>${escapeHtml(r.tanggal)}</td>
          <td>${escapeHtml(r.sumber)}</td>
          <td><span style="padding:2px 6px; border-radius:4px; font-size:12px; background:#e2e3e5;">${escapeHtml(r.kelas)}</span></td>
          <td>${escapeHtml(r.keterangan)}</td>
          <td>${badge}</td>
          <td style="font-weight:bold;">${formatRp(r.nominal)}</td>
          <td>${escapeHtml(r.admin) || '-'}</td>
        </tr>`;
    }).join('');
  } else {
    tbody.innerHTML = '<tr><td colspan="7" class="empty-state">Tidak ada data laporan untuk periode ini.</td></tr>';
  }
}

// ---------------------------------------------------
// EXPORT LAPORAN (EXCEL & PDF)
// ---------------------------------------------------
function exportLaporanExcel() {
  if (filteredLaporan.length === 0) return alert('Tidak ada data laporan untuk diekspor.');

  if (typeof XLSX === 'undefined') {
    return alert('Library Excel (SheetJS) belum dimuat.');
  }

  const dataForExcel = filteredLaporan.map((r, idx) => ({
    'No': idx + 1,
    'Tanggal': r.tanggal,
    'Sumber': r.sumber,
    'Kelas': r.kelas,
    'Keterangan': r.keterangan,
    'Jenis': r.jenis,
    'Nominal (Rp)': r.nominal,
    'Petugas': r.admin || '-'
  }));

  const worksheet = XLSX.utils.json_to_sheet(dataForExcel);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Keuangan");
  XLSX.writeFile(workbook, `Laporan-Keuangan-${new Date().toISOString().slice(0, 10)}.xlsx`);
}

function exportLaporanPDF() {
  if (filteredLaporan.length === 0) return alert('Tidak ada data laporan untuk diekspor.');

  if (!window.jspdf || !window.jspdf.jsPDF) {
    return alert('Library PDF (jsPDF) belum dimuat.');
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text("Laporan Keuangan MTs Al-Fatah", 14, 15);
  doc.setFontSize(10);
  doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}`, 14, 22);

  const tableRows = filteredLaporan.map((r, idx) => [
    idx + 1,
    r.tanggal,
    r.sumber,
    r.kelas,
    r.keterangan,
    r.jenis,
    formatRp(r.nominal),
    r.admin || '-'
  ]);

  doc.autoTable({
    startY: 28,
    head: [['No', 'Tanggal', 'Sumber', 'Kelas', 'Keterangan', 'Jenis', 'Nominal', 'Petugas']],
    body: tableRows,
    theme: 'grid',
    headStyles: { fillColor: [13, 110, 253] }
  });

  doc.save(`Laporan-Keuangan-${new Date().toISOString().slice(0, 10)}.pdf`);
}

// ---------------------------------------------------
// FORM SUBMISSION HANDLERS DASHBOARD
// ---------------------------------------------------
document.getElementById('form-ts')?.addEventListener('submit', function (e) {
  e.preventDefault();
  const btn = document.getElementById('btn-ts');
  btn.disabled = true; btn.textContent = 'Menyimpan...';

  const sheetRow = document.getElementById('ts_sheetRow').value;
  const parts = document.getElementById('ts_siswaSelect').value.split('|');
  const session = JSON.parse(localStorage.getItem('userSession')) || {};
  const isBeasiswa = document.getElementById('ts_beasiswa')?.checked;

  if (!sheetRow) {
    // Mode Tambah (Multi Checkbox)
    const checkedBoxes = Array.from(document.querySelectorAll('.ts_multi_check:checked'));
    if (checkedBoxes.length === 0) {
      alert('Pilih minimal satu jenis pembayaran!');
      btn.disabled = false; btn.textContent = 'Simpan';
      return;
    }
    
    // Check duplicates
    let hasDuplicate = false;
    let duplicateName = '';
    for (let chk of checkedBoxes) {
      let paymentName = chk.value;
      if (isBeasiswa) paymentName += ' (Beasiswa)';
      const isDup = rawTs.some(r => String(r.nisn).trim() === String(parts[0]).trim() && String(r.pembayaran).trim().toLowerCase() === paymentName.toLowerCase());
      if (isDup) {
        hasDuplicate = true;
        duplicateName = paymentName;
        break;
      }
    }

    if (hasDuplicate) {
      alert("Sudah Bayar! Transaksi " + duplicateName + " untuk NISN " + (parts[0] || '') + " sudah dicatat sebelumnya.");
      btn.disabled = false; btn.textContent = 'Simpan';
      return;
    }

    const requests = checkedBoxes.map((chk, i) => {
      let finalPayment = chk.value;
      if (isBeasiswa) finalPayment += ' (Beasiswa)';
      const nominalInputId = chk.id.replace('chk_', 'nom_');
      const nominalValue = document.getElementById(nominalInputId).value;

      return fetch(scriptURL, {
        method: 'POST',
        body: JSON.stringify({
          action: 'addTransaksiSiswa',
          sheetRow: '',
          nisn: parts[0] || '',
          namaSiswa: parts[1] || '',
          kelas: parts[2] || '',
          pembayaran: finalPayment,
          nominal: nominalValue,
          admin: session.nama
        })
      }).then(r => r.json());
    });

    btn.textContent = 'Menyimpan (' + requests.length + ' data)...';
    Promise.all(requests)
      .then(results => {
        const allSuccess = results.every(res => res.status === 'success');
        if (allSuccess) {
          alert('Berhasil disimpan!');
          closeModal('modal-transaksi-siswa');
          loadTransaksiSiswa();
        } else {
          alert('Sebagian atau seluruh transaksi gagal disimpan. Silakan periksa kembali.');
        }
      })
      .catch(err => alert('Gagal menyimpan: ' + err.message))
      .finally(() => { btn.disabled = false; btn.textContent = 'Simpan'; });

  } else {
    // Mode Edit (Single Select)
    let finalPembayaran = document.getElementById('ts_pembayaran').value;
    if (isBeasiswa) finalPembayaran += ' (Beasiswa)';

    fetch(scriptURL, {
      method: 'POST',
      body: JSON.stringify({
        action: 'updateTransaksiSiswa',
        sheetRow: sheetRow,
        nisn: parts[0] || '',
        namaSiswa: parts[1] || '',
        kelas: parts[2] || '',
        pembayaran: finalPembayaran,
        nominal: document.getElementById('ts_nominal').value,
        admin: session.nama
      })
    })
      .then(r => r.json())
      .then(res => {
        if (res.status === 'success') {
          alert(res.message || 'Berhasil disimpan!');
          closeModal('modal-transaksi-siswa');
          loadTransaksiSiswa();
        } else {
          alert(res.message || 'Gagal menyimpan transaksi.');
        }
      })
      .catch(err => alert('Gagal menyimpan: ' + err.message))
      .finally(() => { btn.disabled = false; btn.textContent = 'Simpan'; });
  }
});

// ==========================================
// IMPORT TRANSAKSI SISWA (CSV)
// ==========================================
async function processImportTS() {
  const fileInput = document.getElementById('file-import-ts');
  if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
    return alert('Silakan pilih file CSV terlebih dahulu!');
  }
  const file = fileInput.files[0];

  const btnStart = document.getElementById('btn-start-import-ts');
  const btnCancel = document.getElementById('btn-cancel-import-ts');
  const progressDiv = document.getElementById('import-progress');

  btnStart.disabled = true;
  btnCancel.disabled = true;
  progressDiv.style.display = 'block';
  progressDiv.textContent = 'Membaca file CSV...';

  const reader = new FileReader();
  reader.onload = async function (e) {
    const text = e.target.result;
    const rows = text.split('\n').map(row => row.trim()).filter(row => row);
    if (rows.length < 2) {
      alert('File CSV kosong atau tidak memiliki baris data.');
      return resetImportUI();
    }

    const dataToImport = [];
    for (let i = 1; i < rows.length; i++) {
      const cols = rows[i].split(',');
      if (cols.length >= 5) {
        dataToImport.push({
          nisn: cols[0].trim(),
          namaSiswa: cols[1].trim(),
          kelas: cols[2].trim(),
          pembayaran: cols[3].trim(),
          nominal: cols[4].trim()
        });
      }
    }

    const validData = [];
    const session = JSON.parse(localStorage.getItem('userSession')) || {};

    dataToImport.forEach(item => {
      const isDuplicate = rawTs.some(trx =>
        String(trx.nisn).trim() === item.nisn &&
        String(trx.pembayaran).trim().toLowerCase() === item.pembayaran.toLowerCase()
      );
      if (!isDuplicate && item.nisn && item.pembayaran && item.nominal) {
        validData.push(item);
      }
    });

    if (validData.length === 0) {
      alert('Semua data dalam CSV diabaikan karena duplikat atau format tidak valid.');
      return resetImportUI();
    }

    progressDiv.textContent = `Mengunggah ${validData.length} transaksi yang valid secara bersamaan (Bulk Insert)...`;

    try {
      const payload = {
        action: 'bulkAddTransaksiSiswa',
        admin: session.nama,
        items: validData
      };
      
      const response = await fetch(scriptURL, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      
      const result = await response.json();
      if (result.status === 'success') {
        alert(`Impor Selesai!\n${result.message}\nDiabaikan (Duplikat CSV/Invalid): ${dataToImport.length - validData.length}`);
      } else {
        alert(`Gagal menyimpan bulk data: ${result.message}`);
      }
    } catch (err) {
      alert(`Gagal menghubungi server: ${err.message}`);
    }
    loadTransaksiSiswa();
    closeModal('modal-import-ts');
    resetImportUI();
  };
  reader.onerror = function () {
    alert('Gagal membaca file CSV.');
    resetImportUI();
  };
  reader.readAsText(file);
}

function resetImportUI() {
  const btnStart = document.getElementById('btn-start-import-ts');
  const btnCancel = document.getElementById('btn-cancel-import-ts');
  const progressDiv = document.getElementById('import-progress');
  const fileInput = document.getElementById('file-import-ts');

  if (btnStart) btnStart.disabled = false;
  if (btnCancel) btnCancel.disabled = false;
  if (progressDiv) progressDiv.style.display = 'none';
  if (fileInput) fileInput.value = '';
}
// ==========================================
// IMPORT TRANSAKSI INTERNAL (CSV)
// ==========================================
async function processImportTI() {
  const fileInput = document.getElementById('file-import-ti');
  if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
    return alert('Silakan pilih file CSV terlebih dahulu!');
  }
  const file = fileInput.files[0];

  const btnStart = document.getElementById('btn-start-import-ti');
  const btnCancel = document.getElementById('btn-cancel-import-ti');
  const progressDiv = document.getElementById('import-progress-ti');

  btnStart.disabled = true;
  btnCancel.disabled = true;
  progressDiv.style.display = 'block';
  progressDiv.textContent = 'Membaca file CSV...';

  const reader = new FileReader();
  reader.onload = async function (e) {
    const text = e.target.result;
    const rows = text.split('\n').map(row => row.trim()).filter(row => row);
    if (rows.length < 2) {
      alert('File CSV kosong atau tidak memiliki baris data.');
      return resetImportUITI();
    }

    const dataToImport = [];
    for (let i = 1; i < rows.length; i++) {
      const cols = rows[i].split(',');
      if (cols.length >= 3) {
        dataToImport.push({
          jenis: cols[0].trim(),
          keterangan: cols[1].trim(),
          nominal: cols[2].trim()
        });
      }
    }

    const validData = [];
    const session = JSON.parse(localStorage.getItem('userSession')) || {};

    dataToImport.forEach(item => {
      const isDuplicate = rawTi.some(trx =>
        String(trx.keterangan).trim().toLowerCase() === item.keterangan.toLowerCase() &&
        String(trx.nominal).trim() === item.nominal
      );
      if (!isDuplicate && item.jenis && item.keterangan && item.nominal) {
        validData.push(item);
      }
    });

    if (validData.length === 0) {
      alert('Semua data dalam CSV diabaikan karena duplikat atau format tidak valid.');
      return resetImportUITI();
    }

    progressDiv.textContent = `Mengunggah ${validData.length} transaksi yang valid secara bersamaan (Bulk Insert)...`;

    try {
      const payload = {
        action: 'bulkAddTransaksiInternal',
        admin: session.nama,
        items: validData
      };
      
      const response = await fetch(scriptURL, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      
      const result = await response.json();
      if (result.status === 'success') {
        alert(`Impor Selesai!\n${result.message}\nDiabaikan (Duplikat CSV/Invalid): ${dataToImport.length - validData.length}`);
      } else {
        alert(`Gagal menyimpan bulk data: ${result.message}`);
      }
    } catch (err) {
      alert(`Gagal menghubungi server: ${err.message}`);
    }
    loadTransaksiInternal();
    closeModal('modal-import-ti');
    resetImportUITI();
  };
  reader.onerror = function () {
    alert('Gagal membaca file CSV.');
    resetImportUITI();
  };
  reader.readAsText(file);
}

function resetImportUITI() {
  const btnStart = document.getElementById('btn-start-import-ti');
  const btnCancel = document.getElementById('btn-cancel-import-ti');
  const progressDiv = document.getElementById('import-progress-ti');
  const fileInput = document.getElementById('file-import-ti');

  if (btnStart) btnStart.disabled = false;
  if (btnCancel) btnCancel.disabled = false;
  if (progressDiv) progressDiv.style.display = 'none';
  if (fileInput) fileInput.value = '';
}

// ==========================================
// IMPORT TARIF PEMBAYARAN (CSV)
// ==========================================
async function processImportTP() {
  const fileInput = document.getElementById('file-import-tp');
  if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
    return alert('Silakan pilih file CSV terlebih dahulu!');
  }
  const file = fileInput.files[0];

  const btnStart = document.getElementById('btn-start-import-tp');
  const btnCancel = document.getElementById('btn-cancel-import-tp');
  const progressDiv = document.getElementById('import-progress-tp');

  btnStart.disabled = true;
  btnCancel.disabled = true;
  progressDiv.style.display = 'block';
  progressDiv.textContent = 'Membaca file CSV...';

  const reader = new FileReader();
  reader.onload = async function (e) {
    const text = e.target.result;
    const rows = text.split('\n').map(row => row.trim()).filter(row => row);
    if (rows.length < 2) {
      alert('File CSV kosong atau tidak memiliki baris data.');
      return resetImportUITP();
    }

    const dataToImport = [];
    for (let i = 1; i < rows.length; i++) {
      const cols = rows[i].split(',');
      if (cols.length >= 3) {
        dataToImport.push({
          namaPembayaran: cols[0].trim(),
          targetKelas: cols[1].trim(),
          nominalTarif: cols[2].trim()
        });
      }
    }

    const validData = [];

    dataToImport.forEach(item => {
      const isDuplicate = rawTp.some(tarif =>
        String(tarif.namaPembayaran).trim().toLowerCase() === item.namaPembayaran.toLowerCase()
      );
      if (!isDuplicate && item.namaPembayaran && item.targetKelas && item.nominalTarif) {
        validData.push(item);
      }
    });

    if (validData.length === 0) {
      alert('Semua data dalam CSV diabaikan karena duplikat atau format tidak valid.');
      return resetImportUITP();
    }

    progressDiv.textContent = `Mengunggah ${validData.length} tarif yang valid secara bersamaan (Bulk Insert)...`;

    try {
      const payload = {
        action: 'bulkAddTarifPembayaran',
        items: validData
      };
      
      const response = await fetch(scriptURL, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      
      const result = await response.json();
      if (result.status === 'success') {
        alert(`Impor Selesai!\n${result.message}\nDiabaikan (Duplikat CSV/Invalid): ${dataToImport.length - validData.length}`);
      } else {
        alert(`Gagal menyimpan bulk data: ${result.message}`);
      }
    } catch (err) {
      alert(`Gagal menghubungi server: ${err.message}`);
    }
    loadTarifPembayaran();
    closeModal('modal-import-tp');
    resetImportUITP();
  };
  reader.onerror = function () {
    alert('Gagal membaca file CSV.');
    resetImportUITP();
  };
  reader.readAsText(file);
}

function resetImportUITP() {
  const btnStart = document.getElementById('btn-start-import-tp');
  const btnCancel = document.getElementById('btn-cancel-import-tp');
  const progressDiv = document.getElementById('import-progress-tp');
  const fileInput = document.getElementById('file-import-tp');

  if (btnStart) btnStart.disabled = false;
  if (btnCancel) btnCancel.disabled = false;
  if (progressDiv) progressDiv.style.display = 'none';
  if (fileInput) fileInput.value = '';
}
document.getElementById('form-ti')?.addEventListener('submit', function (e) {
  e.preventDefault();
  const btn = document.getElementById('btn-ti');
  btn.disabled = true; btn.textContent = 'Menyimpan...';

  const sheetRow = document.getElementById('ti_sheetRow').value;
  const session = JSON.parse(localStorage.getItem('userSession')) || {};

  fetch(scriptURL, {
    method: 'POST',
    body: JSON.stringify({
      action: sheetRow ? 'updateTransaksiInternal' : 'addTransaksiInternal',
      sheetRow: sheetRow,
      jenis: document.getElementById('ti_jenis').value,
      keterangan: document.getElementById('ti_keterangan').value,
      nominal: document.getElementById('ti_nominal').value,
      admin: session.nama
    })
  })
    .then(r => r.json())
    .then(res => {
      if (res.status === 'success') {
        alert(res.message || 'Berhasil disimpan!');
        closeModal('modal-transaksi-internal');
        loadTransaksiInternal();
      } else {
        alert(res.message || 'Gagal menyimpan transaksi.');
      }
    })
    .catch(err => alert('Gagal menyimpan: ' + err.message))
    .finally(() => { btn.disabled = false; btn.textContent = 'Simpan'; });
});

document.getElementById('form-tp')?.addEventListener('submit', function (e) {
  e.preventDefault();
  const btn = document.getElementById('btn-tp');
  btn.disabled = true; btn.textContent = 'Menyimpan...';

  const sheetRow = document.getElementById('tp_sheetRow').value;
  fetch(scriptURL, {
    method: 'POST',
    body: JSON.stringify({
      action: sheetRow ? 'updateTarifPembayaran' : 'addTarifPembayaran',
      sheetRow: sheetRow,
      namaPembayaran: document.getElementById('tp_nama').value,
      targetKelas: document.getElementById('tp_kelas').value,
      nominalTarif: document.getElementById('tp_nominal').value
    })
  })
    .then(r => r.json())
    .then(res => {
      if (res.status === 'success') {
        alert(res.message || 'Berhasil disimpan!');
        closeModal('modal-jenis-pembayaran');
        loadTarifPembayaran();
      } else {
        alert(res.message || 'Gagal menyimpan tarif.');
      }
    })
    .catch(err => alert('Gagal menyimpan: ' + err.message))
    .finally(() => { btn.disabled = false; btn.textContent = 'Simpan'; });
});

document.getElementById('form-akun')?.addEventListener('submit', function (e) {
  e.preventDefault();
  const btn = document.getElementById('btn-akun');
  btn.disabled = true; btn.textContent = 'Menyimpan...';

  const sheetRow = document.getElementById('akun_sheetRow').value;
  fetch(scriptURL, {
    method: 'POST',
    body: JSON.stringify({
      action: sheetRow ? 'updateAccount' : 'addAccount',
      sheetRow: sheetRow,
      role: document.getElementById('akun_role').value,
      idLogin: document.getElementById('akun_idLogin').value,
      nama: document.getElementById('akun_nama').value,
      kelas: document.getElementById('akun_kelas').value,
      password: document.getElementById('akun_password').value
    })
  })
    .then(r => r.json())
    .then(res => {
      if (res.status === 'success') {
        alert(res.message || 'Berhasil disimpan!');
        closeModal('modal-akun');
        loadAkun();
      } else {
        alert('Error: ' + res.message);
      }
    })
    .catch(err => alert('Gagal menyimpan: ' + err.message))
    .finally(() => { btn.disabled = false; btn.textContent = 'Simpan'; });
});

// ===================================================
// LOGIKA HALAMAN WALI KELAS
// ===================================================
const pageTitleWkElem = document.getElementById('pageTitleWk');
if (pageTitleWkElem) {
  const session = JSON.parse(localStorage.getItem('userSession'));
  if (!session || String(session.role || '').trim().toLowerCase() !== 'walikelas') {
    alert('Sesi habis atau akses ditolak.');
    window.location.href = 'index.html';
  } else {
    const wkLabel = document.getElementById('wkNameLabel');
    if (wkLabel) wkLabel.textContent = `Halo, ${session.nama}`;
    document.getElementById('label-kelas-tagihan').textContent = session.kelas || '-';
    document.getElementById('label-kelas-laporan').textContent = session.kelas || '-';
  }
}

const navItemsWk = document.querySelectorAll('.nav-item-wk');
navItemsWk.forEach(item => {
  item.addEventListener('click', function (e) {
    e.preventDefault();
    navItemsWk.forEach(nav => nav.classList.remove('active'));
    this.classList.add('active');
    document.querySelectorAll('.tab-content-wk').forEach(section => {
      section.classList.remove('active');
      section.style.display = 'none';
    });
    const targetId = this.getAttribute('data-target');
    const targetElem = document.getElementById(targetId);
    if (targetElem) {
      targetElem.classList.add('active');
      targetElem.style.display = 'block';
    }
    if (pageTitleWkElem) pageTitleWkElem.textContent = this.textContent.replace(/[^a-zA-Z0-9 &]/g, '').trim();
    if (targetId === 'tagihan-kelas') loadTagihanWalikelas();
    if (targetId === 'tabungan-kelas') loadTabunganWalikelas();
    if (targetId === 'laporan-kelas') loadLaporanWalikelas();
  });
});

let rawTagihanWk = [], filteredTagihanWk = [];
function loadTagihanWalikelas() {
  const session = JSON.parse(localStorage.getItem('userSession')) || {};
  const kelas = session.kelas;
  const tbody = document.getElementById('tbody-wk-tagihan');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">â³ Memuat data...</td></tr>';

  Promise.all([
    fetch(scriptURL + '?t=' + new Date().getTime() + '&action=getAccounts').then(r => r.json()),
    fetch(scriptURL + '?t=' + new Date().getTime() + '&action=getTarifPembayaran').then(r => r.json()),
    fetch(scriptURL + '?t=' + new Date().getTime() + '&action=getTransaksiSiswa').then(r => r.json())
  ]).then(([resAkun, resTarif, resTransaksi]) => {
    const listSiswa = (resAkun.status === 'success') ? resAkun.data.filter(a => String(a.role).toLowerCase() === 'siswa' && a.kelas === kelas) : [];
    const listTarif = (resTarif.status === 'success') ? resTarif.data.filter(t => {
      const target = String(t.targetKelas || '').toLowerCase();
      const k = String(kelas || '').trim().toLowerCase();
      return target.includes('semua') || (k !== '' && target.includes(k));
    }) : [];
    const listTransaksi = (resTransaksi.status === 'success') ? resTransaksi.data : [];

    rawTagihanWk = [];
    listSiswa.forEach(siswa => {
      listTarif.forEach(tarif => {
        let terbayar = 0;
        let isBeasiswa = false;
        listTransaksi.forEach(trx => {
          if (String(trx.nisn).trim() === String(siswa.idLogin).trim()) {
            let tPembayaran = String(trx.pembayaran || '').trim().toLowerCase();
            let tTarif = String(tarif.namaPembayaran || '').trim().toLowerCase();
            if (tPembayaran === tTarif) {
              terbayar += parseFloat(trx.nominal) || 0;
            } else if (tPembayaran.includes('(beasiswa)') && tPembayaran.replace('(beasiswa)', '').trim() === tTarif) {
              isBeasiswa = true;
              terbayar += parseFloat(trx.nominal) || 0;
            }
          }
        });
        let tagihan = 0;
        let status = '';
        if (isBeasiswa) {
          tagihan = 0;
          status = 'Beasiswa';
        } else {
          tagihan = (parseFloat(tarif.nominalTarif) || 0) - terbayar;
          status = tagihan <= 0 ? 'Lunas' : 'Belum Lunas';
        }
        rawTagihanWk.push({
          nisn: siswa.idLogin,
          nama: siswa.nama,
          pembayaran: tarif.namaPembayaran,
          tarif: parseFloat(tarif.nominalTarif) || 0,
          terbayar: terbayar,
          sisaTagihan: tagihan,
          status: status
        });
      });
    });
    renderTagihanWalikelas();
  }).catch(() => { tbody.innerHTML = '<tr><td colspan="7" class="empty-state">Gagal memuat data.</td></tr>'; });
}

function renderTagihanWalikelas(resetPage = true) {
  if (resetPage === true) pageWkTagihan = 1;
  const tbody = document.getElementById('tbody-wk-tagihan');
  if (!tbody) return;
  const q = (document.getElementById('search-wk-tagihan')?.value || '').toLowerCase().trim();
  filteredTagihanWk = rawTagihanWk.filter(r => !q || [r.nama, r.nisn, r.pembayaran].some(v => String(v || '').toLowerCase().includes(q)));
  
  const start = (pageWkTagihan - 1) * PAGE_LIMIT;
  const paginated = filteredTagihanWk.slice(start, start + PAGE_LIMIT);
  const end = Math.min(start + PAGE_LIMIT, filteredTagihanWk.length);

  document.getElementById('count-wk-tagihan').textContent = `Menampilkan ${filteredTagihanWk.length > 0 ? start + 1 : 0}-${end} dari ${filteredTagihanWk.length} baris`;
  renderPagination(filteredTagihanWk.length, PAGE_LIMIT, pageWkTagihan, 'pg-wk-tagihan', (p) => { pageWkTagihan = p; renderTagihanWalikelas(false); });

  if (paginated.length > 0) {
    tbody.innerHTML = paginated.map(r => `
      <tr>
        <td>${escapeHtml(r.nisn)}</td>
        <td><strong>${escapeHtml(r.nama)}</strong></td>
        <td>${escapeHtml(r.pembayaran)}</td>
        <td>${formatRp(r.tarif)}</td>
        <td style="color:green;">${formatRp(r.terbayar)}</td>
        <td style="color:red; font-weight:bold;">${formatRp(r.sisaTagihan)}</td>
        <td><span style="padding:4px 8px; border-radius:4px; font-size:12px; color:#fff; background:${r.status === 'Lunas' ? '#198754' : (r.status === 'Beasiswa' ? '#0d6efd' : '#dc3545')};">${r.status}</span></td>
      </tr>
    `).join('');
  } else {
    tbody.innerHTML = '<tr><td colspan="7" class="empty-state">Tidak ada tagihan yang cocok.</td></tr>';
  }
}

let rawLaporanWk = [], filteredLaporanWk = [];
function loadLaporanWalikelas() {
  const session = JSON.parse(localStorage.getItem('userSession')) || {};
  const kelas = session.kelas;
  const tbody = document.getElementById('tbody-wk-laporan');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">â³ Memuat data...</td></tr>';

  fetch(scriptURL + '?t=' + new Date().getTime() + '&action=getTransaksiSiswa')
    .then(r => r.json())
    .then(res => {
      rawLaporanWk = (res.status === 'success') ? res.data.filter(t => t.kelas === kelas) : [];
      renderLaporanWalikelas();
    })
    .catch(() => { tbody.innerHTML = '<tr><td colspan="5" class="empty-state">Gagal memuat data.</td></tr>'; });
}

function renderLaporanWalikelas(resetPage = true) {
  if (resetPage === true) pageWkLaporan = 1;
  const tbody = document.getElementById('tbody-wk-laporan');
  if (!tbody) return;
  const q = (document.getElementById('search-wk-laporan')?.value || '').toLowerCase().trim();
  filteredLaporanWk = rawLaporanWk.filter(r => {
    const matchesSearch = !q || [r.nama, r.nisn, r.pembayaran].some(v => String(v || '').toLowerCase().includes(q));
    const matchesDate = inDateRange(r.tanggal, 'from-wk-laporan', 'to-wk-laporan');
    return matchesSearch && matchesDate;
  });
  
  const start = (pageWkLaporan - 1) * PAGE_LIMIT;
  const paginated = filteredLaporanWk.slice(start, start + PAGE_LIMIT);
  const end = Math.min(start + PAGE_LIMIT, filteredLaporanWk.length);

  document.getElementById('count-wk-laporan').textContent = `Menampilkan ${filteredLaporanWk.length > 0 ? start + 1 : 0}-${end} dari ${filteredLaporanWk.length} transaksi`;
  renderPagination(filteredLaporanWk.length, PAGE_LIMIT, pageWkLaporan, 'pg-wk-laporan', (p) => { pageWkLaporan = p; renderLaporanWalikelas(false); });

  if (paginated.length > 0) {
    tbody.innerHTML = paginated.map(r => `
      <tr>
        <td>${escapeHtml(r.tanggal)}</td>
        <td><strong>${escapeHtml(r.nama)}</strong><br><small style="color:gray;">${escapeHtml(r.nisn)}</small></td>
        <td>${escapeHtml(r.pembayaran)}</td>
        <td style="color:green; font-weight:bold;">${formatRp(r.nominal)}</td>
        <td>${escapeHtml(r.admin) || '-'}</td>
      </tr>
    `).join('');
  } else {
    tbody.innerHTML = '<tr><td colspan="5" class="empty-state">Tidak ada riwayat transaksi.</td></tr>';
  }
}

// ===================================================
// LOGIKA HALAMAN SISWA
// ===================================================
const pageTitleSiswaElem = document.getElementById('pageTitleSiswa');
if (pageTitleSiswaElem) {
  const session = JSON.parse(localStorage.getItem('userSession'));
  if (!session || String(session.role || '').trim().toLowerCase() !== 'siswa') {
    alert('Sesi habis atau akses ditolak.');
    window.location.href = 'index.html';
  } else {
    const siswaLabel = document.getElementById('siswaNameLabel');
    if (siswaLabel) siswaLabel.textContent = `Halo, ${session.nama}`;
    document.getElementById('label-nama-tagihan').textContent = session.nama;
    document.getElementById('label-nama-riwayat').textContent = session.nama;
  }
}

const navItemsSiswa = document.querySelectorAll('.nav-item-siswa');
navItemsSiswa.forEach(item => {
  item.addEventListener('click', function (e) {
    e.preventDefault();
    navItemsSiswa.forEach(nav => nav.classList.remove('active'));
    this.classList.add('active');
    document.querySelectorAll('.tab-content-siswa').forEach(section => {
      section.classList.remove('active');
      section.style.display = 'none';
    });
    const targetId = this.getAttribute('data-target');
    const targetElem = document.getElementById(targetId);
    if (targetElem) {
      targetElem.classList.add('active');
      targetElem.style.display = 'block';
    }
    if (pageTitleSiswaElem) pageTitleSiswaElem.textContent = this.textContent.replace(/[^a-zA-Z0-9 &]/g, '').trim();
    if (targetId === 'tagihan-siswa') loadTagihanSiswa();
    if (targetId === 'tabungan-saya') loadTabunganSiswa();
    if (targetId === 'riwayat-siswa') loadRiwayatSiswa();
  });
});

let rawTagihanSiswa = [], filteredTagihanSiswa = [];
function loadTagihanSiswa() {
  const session = JSON.parse(localStorage.getItem('userSession')) || {};
  const tbody = document.getElementById('tbody-siswa-tagihan');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">â³ Memuat data...</td></tr>';

  Promise.all([
    fetch(scriptURL + '?t=' + new Date().getTime() + '&action=getAccounts').then(r => r.json()),
    fetch(scriptURL + '?t=' + new Date().getTime() + '&action=getTarifPembayaran').then(r => r.json()),
    fetch(scriptURL + '?t=' + new Date().getTime() + '&action=getTransaksiSiswa').then(r => r.json())
  ]).then(([resAkun, resTarif, resTransaksi]) => {
    let siswaServer = null;
    if (resAkun.status === 'success') {
      siswaServer = resAkun.data.find(a => 
        String(a.role).toLowerCase() === 'siswa' && 
        (String(a.idLogin).trim() === String(session.idLogin).trim() || 
         String(a.nama).trim().toLowerCase() === String(session.nama).trim().toLowerCase())
      );
    }
    const nisnAktif = siswaServer ? siswaServer.idLogin : session.idLogin;
    const kelasAktif = siswaServer ? siswaServer.kelas : session.kelas;

    const listTarif = (resTarif.status === 'success') ? resTarif.data.filter(t => {
      const target = String(t.targetKelas || '').toLowerCase();
      const k = String(kelasAktif || '').trim().toLowerCase();
      return target.includes('semua') || (k !== '' && target.includes(k));
    }) : [];
    const listTransaksi = (resTransaksi.status === 'success') ? resTransaksi.data : [];

    rawTagihanSiswa = [];
    listTarif.forEach(tarif => {
      let terbayar = 0;
      let isBeasiswa = false;
      listTransaksi.forEach(trx => {
        if (String(trx.nisn).trim() === String(nisnAktif).trim()) {
          let tPembayaran = String(trx.pembayaran || '').trim().toLowerCase();
          let tTarif = String(tarif.namaPembayaran || '').trim().toLowerCase();
          if (tPembayaran === tTarif) {
            terbayar += parseFloat(trx.nominal) || 0;
          } else if (tPembayaran.includes('(beasiswa)') && tPembayaran.replace('(beasiswa)', '').trim() === tTarif) {
            isBeasiswa = true;
            terbayar += parseFloat(trx.nominal) || 0;
          }
        }
      });
      let tagihan = 0;
      let status = '';
      if (isBeasiswa) {
        tagihan = 0;
        status = 'Beasiswa';
      } else {
        tagihan = (parseFloat(tarif.nominalTarif) || 0) - terbayar;
        status = tagihan <= 0 ? 'Lunas' : 'Belum Lunas';
      }
      rawTagihanSiswa.push({
        pembayaran: tarif.namaPembayaran,
        tarif: parseFloat(tarif.nominalTarif) || 0,
        terbayar: terbayar,
        sisaTagihan: tagihan,
        status: status
      });
    });
    renderTagihanSiswa();
  }).catch(() => { tbody.innerHTML = '<tr><td colspan="5" class="empty-state">Gagal memuat data.</td></tr>'; });
}

function renderTagihanSiswa(resetPage = true) {
  if (resetPage === true) pageSiswaTagihan = 1;
  const tbody = document.getElementById('tbody-siswa-tagihan');
  if (!tbody) return;
  const q = (document.getElementById('search-siswa-tagihan')?.value || '').toLowerCase().trim();
  filteredTagihanSiswa = rawTagihanSiswa.filter(r => !q || String(r.pembayaran || '').toLowerCase().includes(q));
  
  const start = (pageSiswaTagihan - 1) * PAGE_LIMIT;
  const paginated = filteredTagihanSiswa.slice(start, start + PAGE_LIMIT);
  const end = Math.min(start + PAGE_LIMIT, filteredTagihanSiswa.length);

  document.getElementById('count-siswa-tagihan').textContent = `Menampilkan ${filteredTagihanSiswa.length > 0 ? start + 1 : 0}-${end} dari ${filteredTagihanSiswa.length} tagihan`;
  renderPagination(filteredTagihanSiswa.length, PAGE_LIMIT, pageSiswaTagihan, 'pg-siswa-tagihan', (p) => { pageSiswaTagihan = p; renderTagihanSiswa(false); });

  if (paginated.length > 0) {
    tbody.innerHTML = paginated.map(r => `
      <tr>
        <td><strong>${escapeHtml(r.pembayaran)}</strong></td>
        <td>${formatRp(r.tarif)}</td>
        <td style="color:green;">${formatRp(r.terbayar)}</td>
        <td style="color:red; font-weight:bold;">${formatRp(r.sisaTagihan)}</td>
        <td><span style="padding:4px 8px; border-radius:4px; font-size:12px; color:#fff; background:${r.status === 'Lunas' ? '#198754' : (r.status === 'Beasiswa' ? '#0d6efd' : '#dc3545')};">${r.status}</span></td>
      </tr>
    `).join('');
  } else {
    tbody.innerHTML = '<tr><td colspan="5" class="empty-state">Tidak ada tagihan.</td></tr>';
  }
}

let rawRiwayatSiswa = [], filteredRiwayatSiswa = [];
function loadRiwayatSiswa() {
  const session = JSON.parse(localStorage.getItem('userSession')) || {};
  const tbody = document.getElementById('tbody-siswa-riwayat');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">â³ Memuat data...</td></tr>';

  Promise.all([
    fetch(scriptURL + '?t=' + new Date().getTime() + '&action=getAccounts').then(r => r.json()),
    fetch(scriptURL + '?t=' + new Date().getTime() + '&action=getTransaksiSiswa').then(r => r.json())
  ]).then(([resAkun, resTransaksi]) => {
    let siswaServer = null;
    if (resAkun.status === 'success') {
      siswaServer = resAkun.data.find(a => 
        String(a.role).toLowerCase() === 'siswa' && 
        (String(a.idLogin).trim() === String(session.idLogin).trim() || 
         String(a.nama).trim().toLowerCase() === String(session.nama).trim().toLowerCase())
      );
    }
    const nisnAktif = siswaServer ? siswaServer.idLogin : session.idLogin;

    rawRiwayatSiswa = (resTransaksi.status === 'success') ? resTransaksi.data.filter(t => String(t.nisn).trim() === String(nisnAktif).trim()) : [];
    renderRiwayatSiswa();
  }).catch(() => { tbody.innerHTML = '<tr><td colspan="4" class="empty-state">Gagal memuat data.</td></tr>'; });
}

function renderRiwayatSiswa(resetPage = true) {
  if (resetPage === true) pageSiswaRiwayat = 1;
  const tbody = document.getElementById('tbody-siswa-riwayat');
  if (!tbody) return;
  const q = (document.getElementById('search-siswa-riwayat')?.value || '').toLowerCase().trim();
  filteredRiwayatSiswa = rawRiwayatSiswa.filter(r => {
    const matchesSearch = !q || String(r.pembayaran || '').toLowerCase().includes(q);
    const matchesDate = inDateRange(r.tanggal, 'from-siswa-riwayat', 'to-siswa-riwayat');
    return matchesSearch && matchesDate;
  });
  
  const start = (pageSiswaRiwayat - 1) * PAGE_LIMIT;
  const paginated = filteredRiwayatSiswa.slice(start, start + PAGE_LIMIT);
  const end = Math.min(start + PAGE_LIMIT, filteredRiwayatSiswa.length);

  document.getElementById('count-siswa-riwayat').textContent = `Menampilkan ${filteredRiwayatSiswa.length > 0 ? start + 1 : 0}-${end} dari ${filteredRiwayatSiswa.length} transaksi`;
  renderPagination(filteredRiwayatSiswa.length, PAGE_LIMIT, pageSiswaRiwayat, 'pg-siswa-riwayat', (p) => { pageSiswaRiwayat = p; renderRiwayatSiswa(false); });

  if (paginated.length > 0) {
    tbody.innerHTML = paginated.map(r => `
      <tr>
        <td>${escapeHtml(r.tanggal)}</td>
        <td><strong>${escapeHtml(r.pembayaran)}</strong></td>
        <td style="color:green; font-weight:bold;">${formatRp(r.nominal)}</td>
        <td>${escapeHtml(r.admin) || '-'}</td>
      </tr>
    `).join('');
  } else {
    tbody.innerHTML = '<tr><td colspan="4" class="empty-state">Tidak ada riwayat transaksi.</td></tr>';
  }
}

// Pemuatan Awal Data saat Halaman Loaded
document.addEventListener('DOMContentLoaded', function () {
  if (document.getElementById('tbody-transaksi-siswa')) {
    loadTransaksiSiswa();
  }
  if (document.getElementById('tbody-wk-tagihan')) {
    loadTagihanWalikelas();
  }
  if (document.getElementById('tbody-siswa-tagihan')) {
    loadTagihanSiswa();
  }
});

// ===================================================
// TOGGLE PASSWORD VISIBILITY
// ===================================================
function togglePasswordVisibility(inputId, iconElement) {
  const input = document.getElementById(inputId);
  if (input) {
    if (input.type === 'password') {
      input.type = 'text';
      iconElement.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7 7 0 0 0-2.79.588l.77.771A6 6 0 0 1 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13 13 0 0 1 14.828 8q-.086.13-.195.288c-.335.48-.83 1.12-1.465 1.755q-.247.248-.517.486z"/><path d="M11.297 9.176a3.5 3.5 0 0 0-4.474-4.474l.823.823a2.5 2.5 0 0 1 2.829 2.829zm-2.943 1.299.822.822a3.5 3.5 0 0 1-4.474-4.474l.823.823a2.5 2.5 0 0 0 2.829 2.829"/><path d="M3.35 5.47q-.27.24-.518.487A13 13 0 0 0 1.172 8l.195.288c.335.48.83 1.12 1.465 1.755C4.121 11.332 5.881 12.5 8 12.5c.716 0 1.39-.133 2.02-.36l.77.772A7 7 0 0 1 8 13.5C3 13.5 0 8 0 8s.939-1.721 2.641-3.238l.708.709zm10.296 8.884-12-12 .708-.708 12 12z"/></svg>';
    } else {
      input.type = 'password';
      iconElement.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8M1.173 8a13 13 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5s3.879 1.168 5.168 2.457A13 13 0 0 1 14.828 8q-.086.13-.195.288c-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5s-3.879-1.168-5.168-2.457A13 13 0 0 1 1.172 8z"/><path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5M4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0"/></svg>';
    }
  }
}

// ===================================================
// Saldo Digital Siswa (ADMIN)
// ===================================================
let rawTabungan = [], filteredTabungan = [];
let pageTabungan = 1;

function loadTabunganAdmin() {
  const tbody = document.getElementById('tbody-tabungan-siswa');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="8" style="text-align: center;">â³ Memuat data...</td></tr>';
  fetch(scriptURL + '?t=' + new Date().getTime() + '&action=getTabungan')
    .then(r => r.json())
    .then(res => { 
      rawTabungan = (res.status === 'success') ? res.data : []; 
      renderTabunganAdmin(); 
    })
    .catch(() => { tbody.innerHTML = '<tr><td colspan="8" class="empty-state">Gagal memuat data.</td></tr>'; });
}

function renderTabunganAdmin(resetPage = true) {
  if (resetPage === true) pageTabungan = 1;
  const tbody = document.getElementById('tbody-tabungan-siswa');
  if (!tbody) return;
  const q = (document.getElementById('search-tabungan')?.value || '').toLowerCase().trim();
  const jenisFilter = document.getElementById('jenis-tabungan')?.value;

  filteredTabungan = rawTabungan.filter(r => {
    const matchesSearch = !q || [r.nama, r.nisn, r.kelas].some(v => String(v || '').toLowerCase().includes(q));
    const matchesJenis = !jenisFilter || r.jenis === jenisFilter;
    const matchesDate = inDateRange(r.tanggal, 'from-tabungan', 'to-tabungan');
    return matchesSearch && matchesJenis && matchesDate;
  });

  let totalSaldo = 0;
  rawTabungan.forEach(r => {
    if (r.jenis === 'Setor') totalSaldo += parseFloat(r.nominal);
    else if (r.jenis === 'Tarik') totalSaldo -= parseFloat(r.nominal);
  });
  const saldoElem = document.getElementById('total-saldo-tabungan');
  if (saldoElem) saldoElem.textContent = formatRp(totalSaldo);

  const start = (pageTabungan - 1) * PAGE_LIMIT;
  const paginated = filteredTabungan.slice(start, start + PAGE_LIMIT);
  const end = Math.min(start + PAGE_LIMIT, filteredTabungan.length);

  document.getElementById('count-tabungan').textContent = `Menampilkan ${filteredTabungan.length > 0 ? start + 1 : 0}-${end} dari ${filteredTabungan.length} transaksi`;
  renderPagination(filteredTabungan.length, PAGE_LIMIT, pageTabungan, 'pg-tabungan', (p) => { pageTabungan = p; renderTabunganAdmin(false); });

  if (paginated.length > 0) {
    tbody.innerHTML = paginated.map(r => {
      let badge = r.jenis === 'Setor' ? '<span style="color:green;font-weight:bold;">Setor</span>' : '<span style="color:red;font-weight:bold;">Tarik</span>';
      return `
        <tr>
          <td>${escapeHtml(r.tanggal)}</td>
          <td><strong>${escapeHtml(r.nama)}</strong><br><small style="color:gray;">${escapeHtml(r.nisn)}</small></td>
          <td><span style="padding:2px 6px; border-radius:4px; font-size:12px; background:#e2e3e5; font-weight:bold;">${escapeHtml(r.kelas || '-')}</span></td>
          <td>${badge}</td>
          <td style="font-weight:bold;">${formatRp(r.nominal)}</td>
          <td>${escapeHtml(r.keterangan || '-')}</td>
          <td>${escapeHtml(r.admin) || '-'}</td>
          <td>
            <div class="row-actions">
              <button class="btn-icon btn-delete" onclick="deleteTabungan(${r.sheetRow})">ðŸ—‘ï¸ Hapus</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  } else {
    tbody.innerHTML = '<tr><td colspan="8" class="empty-state">Tidak ada data yang cocok.</td></tr>';
  }
}

function deleteTabungan(sheetRow) {
  if (!confirm('Apakah Anda yakin ingin menghapus transaksi tabungan ini?')) return;
  fetch(scriptURL, { method: 'POST', body: JSON.stringify({ action: 'deleteTabungan', sheetRow: sheetRow }) })
    .then(r => r.json())
    .then(res => { alert(res.message || 'Transaksi berhasil dihapus.'); loadTabunganAdmin(); })
    .catch(err => alert('Gagal menghapus: ' + err.message));
}

let tbgModalSiswaList = [];
function openAddTabunganModal() {
  fetch(scriptURL + '?t=' + new Date().getTime() + '&action=getAccounts')
    .then(r => r.json())
    .then(res => {
      if (res.status === 'success') tbgModalSiswaList = res.data.filter(a => String(a.role).toLowerCase() === 'siswa');
      
      const selectSiswa = document.getElementById('tbg_siswaSelect');
      selectSiswa.innerHTML = '<option value="">-- Pilih Siswa --</option>' +
        tbgModalSiswaList.map(s => `<option value="${escapeHtml(s.idLogin)}|${escapeHtml(s.nama)}|${escapeHtml(s.kelas)}">${escapeHtml(s.idLogin)} - ${escapeHtml(s.nama)} (Kelas ${escapeHtml(s.kelas)})</option>`).join('');

      const searchSiswa = document.getElementById('tbg_searchSiswa');
      if (searchSiswa) searchSiswa.value = '';
      
      document.getElementById('form-tabungan').reset();
      openModal('modal-tabungan-siswa');
    }).catch(err => alert('Gagal memuat data siswa: ' + err.message));
}

document.getElementById('tbg_searchSiswa')?.addEventListener('input', function () {
  const keyword = this.value.toLowerCase().trim();
  const selectSiswa = document.getElementById('tbg_siswaSelect');
  
  if (!keyword) {
    selectSiswa.innerHTML = '<option value="">-- Pilih Siswa --</option>' +
      tbgModalSiswaList.map(s => `<option value="${escapeHtml(s.idLogin)}|${escapeHtml(s.nama)}|${escapeHtml(s.kelas)}">${escapeHtml(s.idLogin)} - ${escapeHtml(s.nama)} (Kelas ${escapeHtml(s.kelas)})</option>`).join('');
    selectSiswa.selectedIndex = 0;
    return;
  }
  const filteredSiswa = tbgModalSiswaList.filter(s => 
    String(s.nama).toLowerCase().includes(keyword) || 
    String(s.idLogin).toLowerCase().includes(keyword)
  );
  selectSiswa.innerHTML = '<option value="">-- Pilih Siswa --</option>' +
    filteredSiswa.map(s => `<option value="${escapeHtml(s.idLogin)}|${escapeHtml(s.nama)}|${escapeHtml(s.kelas)}">${escapeHtml(s.idLogin)} - ${escapeHtml(s.nama)} (Kelas ${escapeHtml(s.kelas)})</option>`).join('');
  const exactMatch = filteredSiswa.find(s => String(s.idLogin).toLowerCase() === keyword || String(s.nama).toLowerCase() === keyword);
  if (exactMatch) {
    selectSiswa.value = `${exactMatch.idLogin}|${exactMatch.nama}|${exactMatch.kelas}`;
  } else if (filteredSiswa.length === 1) {
    selectSiswa.selectedIndex = 1;
  } else {
    selectSiswa.selectedIndex = 0;
  }
});

document.getElementById('form-tabungan')?.addEventListener('submit', function (e) {
  e.preventDefault();
  const btn = document.getElementById('btn-tbg');
  btn.disabled = true;
  btn.textContent = 'Menyimpan...';

  const siswaVal = document.getElementById('tbg_siswaSelect').value;
  if (!siswaVal) {
    alert('Pilih siswa terlebih dahulu.');
    btn.disabled = false;
    btn.textContent = 'Simpan';
    return;
  }
  const parts = siswaVal.split('|');
  const session = JSON.parse(localStorage.getItem('userSession'));
  
  const payload = {
    action: 'addTabungan',
    nisn: parts[0],
    namaSiswa: parts[1],
    kelas: parts[2] || '',
    jenis: document.getElementById('tbg_jenis').value,
    nominal: document.getElementById('tbg_nominal').value,
    keterangan: document.getElementById('tbg_keterangan').value,
    admin: session.nama
  };

  fetch(scriptURL, {
    method: 'POST',
    body: JSON.stringify(payload),
    redirect: 'follow'
  })
    .then(r => r.json())
    .then(res => {
      btn.disabled = false;
      btn.textContent = 'Simpan';
      if (res.status === 'success') {
        alert('Berhasil: ' + res.message);
        closeModal('modal-tabungan-siswa');
        loadTabunganAdmin();
      } else {
        alert('Error: ' + res.message);
      }
    }).catch(err => {
      btn.disabled = false;
      btn.textContent = 'Simpan';
      alert('Gagal: ' + err.message);
    });
});

// ===================================================
// Saldo Digital Siswa (WALI KELAS)
// ===================================================
let rawTabunganWk = [], filteredTabunganWk = [];
let pageWkTabungan = 1;

function loadTabunganWalikelas() {
  const session = JSON.parse(localStorage.getItem('userSession')) || {};
  const kelas = session.kelas;
  const tbody = document.getElementById('tbody-wk-tabungan');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">â³ Memuat data...</td></tr>';
  
  const labelKelas = document.getElementById('label-kelas-tabungan');
  if (labelKelas) labelKelas.textContent = kelas;

  Promise.all([
    fetch(scriptURL + '?t=' + new Date().getTime() + '&action=getAccounts').then(r => r.json()),
    fetch(scriptURL + '?t=' + new Date().getTime() + '&action=getTabungan').then(r => r.json())
  ]).then(([resAkun, resTabungan]) => {
    const listSiswa = (resAkun.status === 'success') ? resAkun.data.filter(a => String(a.role).toLowerCase() === 'siswa' && a.kelas === kelas) : [];
    const listTbg = (resTabungan.status === 'success') ? resTabungan.data : [];

    rawTabunganWk = [];
    listSiswa.forEach(siswa => {
      let tSetor = 0, tTarik = 0;
      listTbg.forEach(trx => {
        if (String(trx.nisn).trim() === String(siswa.idLogin).trim()) {
          if (trx.jenis === 'Setor') tSetor += parseFloat(trx.nominal);
          else if (trx.jenis === 'Tarik') tTarik += parseFloat(trx.nominal);
        }
      });
      rawTabunganWk.push({
        nisn: siswa.idLogin,
        nama: siswa.nama,
        setor: tSetor,
        tarik: tTarik,
        saldo: tSetor - tTarik
      });
    });
    
    // Sort by name
    rawTabunganWk.sort((a,b) => a.nama.localeCompare(b.nama));
    renderTabunganWalikelas();
  }).catch(() => { tbody.innerHTML = '<tr><td colspan="5" class="empty-state">Gagal memuat data.</td></tr>'; });
}

function renderTabunganWalikelas(resetPage = true) {
  if (resetPage === true) pageWkTabungan = 1;
  const tbody = document.getElementById('tbody-wk-tabungan');
  if (!tbody) return;
  const q = (document.getElementById('search-wk-tabungan')?.value || '').toLowerCase().trim();

  filteredTabunganWk = rawTabunganWk.filter(r => !q || [r.nama, r.nisn].some(v => String(v || '').toLowerCase().includes(q)));
  
  const start = (pageWkTabungan - 1) * PAGE_LIMIT;
  const paginated = filteredTabunganWk.slice(start, start + PAGE_LIMIT);
  const end = Math.min(start + PAGE_LIMIT, filteredTabunganWk.length);

  document.getElementById('count-wk-tabungan').textContent = `Menampilkan ${filteredTabunganWk.length > 0 ? start + 1 : 0}-${end} dari ${filteredTabunganWk.length} siswa`;
  renderPagination(filteredTabunganWk.length, PAGE_LIMIT, pageWkTabungan, 'pg-wk-tabungan', (p) => { pageWkTabungan = p; renderTabunganWalikelas(false); });

  if (paginated.length > 0) {
    tbody.innerHTML = paginated.map(r => `
      <tr>
        <td>${escapeHtml(r.nisn)}</td>
        <td><strong>${escapeHtml(r.nama)}</strong></td>
        <td style="color:green;">${formatRp(r.setor)}</td>
        <td style="color:red;">${formatRp(r.tarik)}</td>
        <td style="font-weight:bold; font-size: 15px;">${formatRp(r.saldo)}</td>
      </tr>
    `).join('');
  } else {
    tbody.innerHTML = '<tr><td colspan="5" class="empty-state">Tidak ada data yang cocok.</td></tr>';
  }
}

// ===================================================
// Saldo Digital Siswa (SISWA PORTAL)
// ===================================================
let rawTabunganSiswa = [], filteredTabunganSiswa = [];
let pageSiswaTabungan = 1;

function loadTabunganSiswa() {
  const session = JSON.parse(localStorage.getItem('userSession')) || {};
  const tbody = document.getElementById('tbody-siswa-tabungan');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">â³ Memuat data...</td></tr>';
  
  const labelNama = document.getElementById('label-nama-tabungan');
  if (labelNama) labelNama.textContent = session.nama;

  Promise.all([
    fetch(scriptURL + '?t=' + new Date().getTime() + '&action=getAccounts').then(r => r.json()),
    fetch(scriptURL + '?t=' + new Date().getTime() + '&action=getTabungan').then(r => r.json())
  ]).then(([resAkun, resTabungan]) => {
    let siswaServer = null;
    if (resAkun.status === 'success') {
      siswaServer = resAkun.data.find(a => 
        String(a.role).toLowerCase() === 'siswa' && 
        (String(a.idLogin).trim() === String(session.idLogin).trim() || 
         String(a.nama).trim().toLowerCase() === String(session.nama).trim().toLowerCase())
      );
    }
    const nisnAktif = siswaServer ? siswaServer.idLogin : session.idLogin;

    rawTabunganSiswa = (resTabungan.status === 'success') ? resTabungan.data.filter(t => String(t.nisn).trim() === String(nisnAktif).trim()) : [];
    
    let totalSaldo = 0;
    rawTabunganSiswa.forEach(r => {
      if (r.jenis === 'Setor') totalSaldo += parseFloat(r.nominal);
      else if (r.jenis === 'Tarik') totalSaldo -= parseFloat(r.nominal);
    });
    const saldoElem = document.getElementById('siswa-saldo-tabungan');
    if (saldoElem) saldoElem.textContent = formatRp(totalSaldo);

    renderTabunganSiswa();
  }).catch(() => { tbody.innerHTML = '<tr><td colspan="5" class="empty-state">Gagal memuat data.</td></tr>'; });
}

function renderTabunganSiswa(resetPage = true) {
  if (resetPage === true) pageSiswaTabungan = 1;
  const tbody = document.getElementById('tbody-siswa-tabungan');
  if (!tbody) return;
  const jenisFilter = document.getElementById('jenis-siswa-tabungan')?.value;

  filteredTabunganSiswa = rawTabunganSiswa.filter(r => {
    const matchesJenis = !jenisFilter || r.jenis === jenisFilter;
    const matchesDate = inDateRange(r.tanggal, 'from-siswa-tabungan', 'to-siswa-tabungan');
    return matchesJenis && matchesDate;
  });

  const start = (pageSiswaTabungan - 1) * PAGE_LIMIT;
  const paginated = filteredTabunganSiswa.slice(start, start + PAGE_LIMIT);
  const end = Math.min(start + PAGE_LIMIT, filteredTabunganSiswa.length);

  document.getElementById('count-siswa-tabungan').textContent = `Menampilkan ${filteredTabunganSiswa.length > 0 ? start + 1 : 0}-${end} dari ${filteredTabunganSiswa.length} transaksi`;
  renderPagination(filteredTabunganSiswa.length, PAGE_LIMIT, pageSiswaTabungan, 'pg-siswa-tabungan', (p) => { pageSiswaTabungan = p; renderTabunganSiswa(false); });

  if (paginated.length > 0) {
    tbody.innerHTML = paginated.map(r => {
      let badge = r.jenis === 'Setor' ? '<span style="color:green;font-weight:bold;">Setor</span>' : '<span style="color:red;font-weight:bold;">Tarik</span>';
      return `
        <tr>
          <td>${escapeHtml(r.tanggal)}</td>
          <td>${badge}</td>
          <td style="font-weight:bold;">${formatRp(r.nominal)}</td>
          <td>${escapeHtml(r.keterangan || '-')}</td>
          <td>${escapeHtml(r.admin) || '-'}</td>
        </tr>
      `;
    }).join('');
  } else {
    tbody.innerHTML = '<tr><td colspan="5" class="empty-state">Tidak ada transaksi.</td></tr>';
  }
}

// ===================================================
// E-KANTIN DASHBOARD
// ===================================================
let kantinDataSiswa = [];
let rawRiwayatKantin = [], filteredRiwayatKantin = [];
let pageKantinRiwayat = 1;
let currentScannedSiswa = null;

const qrInput = document.getElementById('qrInput');
if (qrInput) {
  // Initialize Kantin Dashboard
  const session = JSON.parse(localStorage.getItem('userSession'));
  if (!session || String(session.role || '').trim().toLowerCase() !== 'kantin') {
    alert('Sesi habis atau akses ditolak.');
    window.location.href = 'index.html';
  } else {
    document.getElementById('kantinNameLabel').textContent = `Petugas: ${session.nama}`;
    loadDataKantin();
    loadRiwayatKantin();
  }

  // Barcode Scanner Listener
  qrInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleQRScan(this.value.trim().toLowerCase());
      this.value = '';
    }
  });

  // Handle Form Pembayaran
  document.getElementById('form-jajan')?.addEventListener('submit', function(e) {
    e.preventDefault();
    processJajanKantin();
  });
  
  // Realtime Nominal Validation
  document.getElementById('co_nominal')?.addEventListener('input', function() {
    const nom = parseFloat(this.value) || 0;
    const max = parseFloat(document.getElementById('co_max_saldo').value) || 0;
    const err = document.getElementById('co_error');
    const btn = document.getElementById('btn-bayar');
    
    if (nom > max) {
      err.style.display = 'block';
      btn.disabled = true;
    } else {
      err.style.display = 'none';
      btn.disabled = false;
    }
  });
}

function loadDataKantin() {
  const msg = document.getElementById('scanMessage');
  msg.textContent = 'Memuat database siswa...';
  fetch(scriptURL + '?t=' + new Date().getTime() + '&action=getAccounts')
    .then(r => r.json())
    .then(res => {
      if (res.status === 'success') {
        kantinDataSiswa = res.data.filter(a => String(a.role).toLowerCase() === 'siswa');
        msg.textContent = 'Siap menerima scan.';
        msg.style.color = '#198754';
      } else {
        msg.textContent = 'Gagal memuat data siswa.';
      }
    }).catch(() => { msg.textContent = 'Koneksi error.'; });
}

function handleQRScan(qrText) {
  const msg = document.getElementById('scanMessage');
  msg.style.color = '#dc3545';
  
  if (!qrText) {
    msg.textContent = 'Barcode kosong.';
    return;
  }

  // Format: nama-nisn (budi-12345)
  const parts = qrText.split('-');
  if (parts.length < 2) {
    msg.textContent = 'Format QR tidak dikenali: ' + qrText;
    return;
  }
  
  const nisnScanned = parts[parts.length - 1]; // Assume the last part is NISN
  const siswa = kantinDataSiswa.find(s => String(s.idLogin).toLowerCase() === nisnScanned);
  
  if (!siswa) {
    msg.textContent = 'Siswa dengan NISN ' + nisnScanned + ' tidak terdaftar.';
    return;
  }

  msg.style.color = '#0d6efd';
  msg.textContent = 'Mengecek saldo ' + escapeHtml(siswa.nama) + '...';
  
  // Fetch latest saldo
  fetch(scriptURL + '?t=' + new Date().getTime() + '&action=getTabungan')
    .then(r => r.json())
    .then(res => {
      if (res.status !== 'success') {
        msg.style.color = '#dc3545';
        msg.textContent = 'Gagal mengecek saldo.';
        return;
      }
      const listTbg = res.data.filter(t => String(t.nisn).trim() === String(siswa.idLogin).trim());
      let saldo = 0;
      listTbg.forEach(r => {
        if (r.jenis === 'Setor') saldo += parseFloat(r.nominal);
        else if (r.jenis === 'Tarik') saldo -= parseFloat(r.nominal);
      });
      
      showCheckoutForm(siswa, saldo);
      msg.textContent = 'Scan berhasil.';
      msg.style.color = '#198754';
      setTimeout(() => { msg.textContent = ''; }, 2000);
    })
    .catch(() => {
      msg.style.color = '#dc3545';
      msg.textContent = 'Koneksi gagal saat mengecek saldo.';
    });
}

function showCheckoutForm(siswa, saldo) {
  currentScannedSiswa = siswa;
  document.getElementById('checkoutSection').style.display = 'block';
  document.getElementById('co_nama').textContent = siswa.nama;
  document.getElementById('co_nisn').textContent = siswa.idLogin;
  document.getElementById('co_kelas').textContent = siswa.kelas || '-';
  document.getElementById('co_saldo').textContent = formatRp(saldo);
  
  document.getElementById('co_nisn_val').value = siswa.idLogin;
  document.getElementById('co_nama_val').value = siswa.nama;
  document.getElementById('co_kelas_val').value = siswa.kelas || '';
  document.getElementById('co_max_saldo').value = saldo;
  
  document.getElementById('co_nominal').value = '';
  document.getElementById('co_error').style.display = 'none';
  document.getElementById('btn-bayar').disabled = false;
  
  document.getElementById('co_nominal').focus();
}

function resetScanner() {
  document.getElementById('checkoutSection').style.display = 'none';
  currentScannedSiswa = null;
  const qri = document.getElementById('qrInput');
  if (qri) {
    qri.value = '';
    qri.focus();
  }
}

function processJajanKantin() {
  const nominal = parseFloat(document.getElementById('co_nominal').value) || 0;
  const maxSaldo = parseFloat(document.getElementById('co_max_saldo').value) || 0;
  
  if (nominal < 500) return alert('Minimal jajan Rp500');
  if (nominal > maxSaldo) return alert('Saldo tidak mencukupi!');

  const btn = document.getElementById('btn-bayar');
  btn.disabled = true;
  btn.textContent = 'Memproses...';
  
  const session = JSON.parse(localStorage.getItem('userSession'));
  
  const payload = {
    action: 'addTabungan',
    nisn: document.getElementById('co_nisn_val').value,
    namaSiswa: document.getElementById('co_nama_val').value,
    kelas: document.getElementById('co_kelas_val').value,
    jenis: 'Tarik',
    nominal: nominal,
    keterangan: 'E-Kantin',
    admin: session.nama
  };

  fetch(scriptURL, {
    method: 'POST',
    body: JSON.stringify(payload),
    redirect: 'follow'
  })
    .then(r => r.json())
    .then(res => {
      btn.disabled = false;
      btn.textContent = '💰 Bayar Transaksi';
      if (res.status === 'success') {
        resetScanner();
        loadRiwayatKantin();
        const msg = document.getElementById('scanMessage');
        msg.style.color = '#198754';
        msg.textContent = 'Pembayaran Rp' + nominal + ' sukses!';
        setTimeout(() => { msg.textContent = 'Siap menerima scan.'; }, 3000);
      } else {
        alert('Gagal: ' + res.message);
      }
    })
    .catch(err => {
      btn.disabled = false;
      btn.textContent = '💰 Bayar Transaksi';
      alert('Error: ' + err.message);
    });
}

function loadRiwayatKantin() {
  const tbody = document.getElementById('tbody-kantin-riwayat');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="3" style="text-align: center;">⏳ Memuat riwayat...</td></tr>';
  
  const session = JSON.parse(localStorage.getItem('userSession'));
  
  fetch(scriptURL + '?t=' + new Date().getTime() + '&action=getTabungan')
    .then(r => r.json())
    .then(res => {
      if (res.status === 'success') {
        const d = new Date();
        const today = String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear();
        
        rawRiwayatKantin = res.data.filter(t => 
          t.jenis === 'Tarik' && 
          String(t.keterangan).toLowerCase() === 'e-kantin' &&
          String(t.admin) === String(session.nama) &&
          String(t.tanggal).startsWith(today)
        );
        rawRiwayatKantin.reverse();
        renderRiwayatKantin();
      }
    })
    .catch(() => { tbody.innerHTML = '<tr><td colspan="3" class="empty-state">Gagal memuat.</td></tr>'; });
}

function renderRiwayatKantin(resetPage = true) {
  if (resetPage === true) pageKantinRiwayat = 1;
  const tbody = document.getElementById('tbody-kantin-riwayat');
  if (!tbody) return;

  const start = (pageKantinRiwayat - 1) * PAGE_LIMIT;
  const paginated = rawRiwayatKantin.slice(start, start + PAGE_LIMIT);
  const end = Math.min(start + PAGE_LIMIT, rawRiwayatKantin.length);

  const countElem = document.getElementById('count-kantin-riwayat');
  if(countElem) countElem.textContent = `Menampilkan ${rawRiwayatKantin.length > 0 ? start + 1 : 0}-${end} dari ${rawRiwayatKantin.length} transaksi`;
  renderPagination(rawRiwayatKantin.length, PAGE_LIMIT, pageKantinRiwayat, 'pg-kantin-riwayat', (p) => { pageKantinRiwayat = p; renderRiwayatKantin(false); });

  if (paginated.length > 0) {
    tbody.innerHTML = paginated.map(r => {
      const wkt = String(r.tanggal).split(' ')[1] || r.tanggal;
      return `
        <tr>
          <td style="font-size:13px; color:gray;">${escapeHtml(wkt)}</td>
          <td><strong>${escapeHtml(r.nama)}</strong></td>
          <td style="color:red; font-weight:bold;">${formatRp(r.nominal)}</td>
        </tr>
      `;
    }).join('');
  } else {
    tbody.innerHTML = '<tr><td colspan="3" class="empty-state">Belum ada transaksi hari ini.</td></tr>';
  }
}
