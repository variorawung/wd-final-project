// tiny inline SVG logo (data URL)
const APP_LOGO_SVG = 'data:image/svg+xml;utf8,' + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 24 24" fill="none" stroke="%23347" stroke-width="1.2">
<rect x="2" y="3" width="20" height="18" rx="2" ry="2" fill="%23fff" stroke="%23347"/>
<path d="M7 8h10M7 12h6" stroke="%23347" stroke-linecap="round"/>
</svg>`);

// inject minimal CSS for shake animation (only inject once)
(function injectHelpersCSS(){
    if (document.getElementById('app-js-helper-css')) return;
    const css = `
    .shake { animation: shake-anim 0.5s; }
    @keyframes shake-anim {
    0% { transform: translateX(0); }
    20% { transform: translateX(-8px); }
    40% { transform: translateX(8px); }
    60% { transform: translateX(-6px); }
    80% { transform: translateX(6px); }
    100% { transform: translateX(0); }
    }
    `;
    const style = document.createElement('style');
    style.id = 'app-js-helper-css';
    style.appendChild(document.createTextNode(css));
    document.head.appendChild(style);
})();

// small sound cues using WebAudio API
function playSound(type = 'success') {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g);
        g.connect(ctx.destination);

        if (type === 'success') {
            o.frequency.value = 880; // A5
            g.gain.value = 0.02;
        } else if (type === 'error') {
            o.frequency.value = 220;
            g.gain.value = 0.03;
        } else if (type === 'confirm') {
            o.frequency.value = 440;
            g.gain.value = 0.02;
        } else {
            o.frequency.value = 440;
            g.gain.value = 0.02;
        }

        o.type = 'sine';
        o.start();
        setTimeout(() => {
            o.stop();
            ctx.close();
        }, 150);
    } catch (e) {
        // audio might be blocked on some browsers until user interaction
        // ignore silently
        console.warn('playSound error', e);
    }
}

// convenience: small loading modal
function showLoadingSwal(message = 'Sedang Diproses') {
    if (typeof Swal === 'undefined') return; // SweetAlert2 not loaded
    Swal.fire({
        title: message,
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });
}

// database

function setupDatabase() {
    // Cek apakah data mahasiswa sudah ada
    if (!localStorage.getItem('mahasiswa')) {
        let dummyMahasiswa = [
            // buat 1 admin dan 2 mahasiswa
            { 
                nim: 'admin', 
                nama: 'Warek Kemahasiswaan', 
                password: 'admin', 
                role: 'admin' 
            },
            { 
                nim: '123456', 
                nama: 'Lionel Messi', 
                password: '1', 
                role: 'mahasiswa',
                jurusan: 'Teknik Informatika'
            },
            { 
                nim: '654321', 
                nama: 'Cristiano Ronaldo', 
                password: '1', 
                role: 'mahasiswa',
                jurusan: 'Sistem Informasi'
            }
        ];
        localStorage.setItem('mahasiswa', JSON.stringify(dummyMahasiswa));
    }

    // Cek apakah data master pelanggaran sudah ada
    if (!localStorage.getItem('master_pelanggaran')) {
        let dummyPelanggaran = [
            { id: 1, nama: 'Sabbath', poin: 20 },
            { id: 2, nama: 'Mid Week Prayer', poin: 5 },
            { id: 3, nama: 'Vesper', poin: 10 },
            { id: 4, nama: 'PA', poin: 5 }
        ];
        localStorage.setItem('master_pelanggaran', JSON.stringify(dummyPelanggaran));
    }

    // Cek apakah data log pelanggaran sudah ada
    if (!localStorage.getItem('log_pelanggaran')) {
        let dummyLogs = [
            { 
                id_log: 1, 
                nim: '123456', 
                id_pelanggaran: 2, 
                tanggal: '2025-10-10', 
                keterangan: 'Tidak hadir Mid Week Prayer' 
            }
        ];
        localStorage.setItem('log_pelanggaran', JSON.stringify(dummyLogs));
    }

    // Cek apakah data log keluhan sudah ada
    if (!localStorage.getItem('log_keluhan')) {
        localStorage.setItem('log_keluhan', JSON.stringify([]));
    }
}
setupDatabase();

// -------------------- Auth helpers --------------------

function getCurrentUser() {
    return JSON.parse(sessionStorage.getItem('currentUser'));
}

// -------------------- Login (enhanced with Swal) --------------------
function handleLogin() {
    const nimEl = document.getElementById('nim');
    const passwordEl = document.getElementById('password');
    const errorEl = document.getElementById('error-message');

    // simple validation
    if (!nimEl || !passwordEl) {
        // fallback: if elements not found, inform developer
        alert('Elemen username/password tidak ditemukan pada HTML.');
        return;
    }

    const nim = nimEl.value.trim();
    const password = passwordEl.value;

    // validation: empty inputs
    if (nim === '' || password === '') {
        if (errorEl) {
            errorEl.textContent = '';
        }
        // shake container for feedback
        const loginBox = document.querySelector('.login-box') || document.body;
        loginBox.classList.add('shake');
        setTimeout(() => loginBox.classList.remove('shake'), 600);

        playSound('error');
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: 'error',
                title: 'Data Kosong',
                text: 'NIM dan Password wajib diisi.',
                timer: 2000,
                showConfirmButton: false,
                timerProgressBar: true
            });
        }
        return;
    }

    const users = JSON.parse(localStorage.getItem('mahasiswa')) || [];
    const user = users.find(u => u.nim === nim && u.password === password);

    // show loading
    if (typeof Swal !== 'undefined') showLoadingSwal('Mengecek...');

    setTimeout(() => { // small delay to simulate processing & allow loading modal to be visible
        if (typeof Swal !== 'undefined') Swal.close();

        if (user) {
            sessionStorage.setItem('currentUser', JSON.stringify(user));
            playSound('success');

            // success popup with logo + timer progress bar
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    title: 'Login Berhasil!',
                    text: `Selamat datang, ${user.nama}`,
                    imageUrl: APP_LOGO_SVG,
                    imageWidth: 80,
                    imageHeight: 80,
                    icon: 'success',
                    timer: 1400,
                    timerProgressBar: true,
                    showConfirmButton: false,
                    backdrop: true
                }).then(() => {
                    if (user.role === 'admin') {
                        window.location.href = 'admin.html';
                    } else {
                        window.location.href = 'dashboard.html';
                    }
                });
            } else {
                // fallback redirect
                if (user.role === 'admin') window.location.href = 'admin.html';
                else window.location.href = 'dashboard.html';
            }
        } else {
            playSound('error');

            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'error',
                    title: 'Login Gagal!',
                    text: 'NIM atau password salah.',
                    timer: 2000,
                    timerProgressBar: true,
                    showConfirmButton: false
                });
            } else {
                if (errorEl) errorEl.textContent = 'NIM atau Password salah!';
            }

            // shake effect
            const loginBox = document.querySelector('.login-box') || document.body;
            loginBox.classList.add('shake');
            setTimeout(() => loginBox.classList.remove('shake'), 600);
        }
    }, 700);
}

// -------------------- Logout (enhanced with Swal confirmation) --------------------
function handleLogout() {
    if (typeof Swal === 'undefined') {
        sessionStorage.removeItem('currentUser');
        window.location.href = 'index.html';
        return;
    }

    playSound('confirm');
    Swal.fire({
        title: 'Logout?',
        text: 'Anda akan keluar dari sesi ini.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Ya, logout',
        cancelButtonText: 'Batal'
    }).then((result) => {
        if (result.isConfirmed) {
            sessionStorage.removeItem('currentUser');
            Swal.fire({
                icon: 'success',
                title: 'Berhasil Logout',
                timer: 1000,
                showConfirmButton: false
            }).then(() => {
                window.location.href = 'index.html';
            });
        }
    });
}

// -------------------- Keluhan (enhanced with Swal) --------------------
function handleSimpanKeluhan() {
    const keluhanTextEl = document.getElementById('keluhan-text');
    const buktiInput = document.getElementById('keluhan-bukti');
    const successMsg = document.getElementById('keluhan-success');
    const user = getCurrentUser();

    if (!user) {
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: 'error',
                title: 'Tidak terautentikasi',
                text: 'Silakan login terlebih dahulu.',
            });
        }
        return;
    }

    const keluhanText = keluhanTextEl ? keluhanTextEl.value.trim() : '';

    if (keluhanText === '') {
        // shake & error
        const box = keluhanTextEl ? keluhanTextEl.parentElement : document.body;
        box && box.classList.add('shake');
        setTimeout(() => box && box.classList.remove('shake'), 600);
        playSound('error');
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: 'error',
                title: 'Keluhan kosong',
                text: 'Tulis keluhan terlebih dahulu.',
                timer: 1800,
                showConfirmButton: false,
                timerProgressBar: true
            });
        }
        return;
    }

    // ambil nama bukti file jika ada
    let namaFileBukti = '';
    if (buktiInput && buktiInput.files.length > 0) {
        namaFileBukti = buktiInput.files[0].name;
    }

    // ambil db
    const allKeluhan = JSON.parse(localStorage.getItem('log_keluhan')) || [];
    const newKeluhanId = allKeluhan.length + 1;
    const tanggalHariIni = new Date().toISOString().split('T')[0];

    const newKeluhan = {
        id_keluhan: newKeluhanId,
        nim: user.nim,
        nama: user.nama,
        tanggal: tanggalHariIni,
        keluhan: keluhanText,
        bukti: namaFileBukti,
        status: 'Baru'
    };

    allKeluhan.push(newKeluhan);
    localStorage.setItem('log_keluhan', JSON.stringify(allKeluhan));

    playSound('success');
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            title: 'Keluhan terkirim!',
            text: 'Terima kasih telah menyampaikan keluhan.',
            icon: 'success',
            timer: 1400,
            showConfirmButton: false,
            timerProgressBar: true
        });
    }

    // clear form
    if (keluhanTextEl) keluhanTextEl.value = '';
    if (buktiInput) buktiInput.value = '';
    if (successMsg) {
        successMsg.textContent = 'Keluhan berhasil terkirim!';
        setTimeout(()=> successMsg.textContent = '', 2000);
    }
}

// -------------------- Delete Poin (admin) --------------------
function handleDeletePoin(log_id_to_delete) {
    if (typeof Swal === 'undefined') {
        // fallback: confirm()
        if (!confirm('Anda yakin ingin menghapus poin ini secara permanen?')) return false;
        let allLogs = JSON.parse(localStorage.getItem('log_pelanggaran')) || [];
        const updatedLogs = allLogs.filter(log => log.id_log !== log_id_to_delete);
        localStorage.setItem('log_pelanggaran', JSON.stringify(updatedLogs));
        alert('Poin berhasil dihapus.');
        return true;
    }

    playSound('confirm');
    return Swal.fire({
        title: 'Hapus Poin?',
        text: 'Poin ini akan dihapus permanen.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Ya, hapus',
        cancelButtonText: 'Batal'
    }).then(result => {
        if (result.isConfirmed) {
            let allLogs = JSON.parse(localStorage.getItem('log_pelanggaran')) || [];
            const updatedLogs = allLogs.filter(log => log.id_log !== log_id_to_delete);
            localStorage.setItem('log_pelanggaran', JSON.stringify(updatedLogs));

            playSound('success');
            Swal.fire({
                icon: 'success',
                title: 'Poin berhasil dihapus',
                timer: 1200,
                showConfirmButton: false,
                timerProgressBar: true
            });
            return true;
        }
        return false;
    });
}

// -------------------- Delete Keluhan (admin) --------------------
function handleDeleteKeluhan(keluhan_id_to_delete) {
    if (typeof Swal === 'undefined') {
        if (!confirm('Anda yakin ingin menghapus keluhan ini?')) return false;
        let allKeluhan = JSON.parse(localStorage.getItem('log_keluhan')) || [];
        const updatedKeluhan = allKeluhan.filter(k => k.id_keluhan !== keluhan_id_to_delete);
        localStorage.setItem('log_keluhan', JSON.stringify(updatedKeluhan));
        alert('Keluhan berhasil dihapus.');
        return true;
    }

    playSound('confirm');
    return Swal.fire({
        title: 'Hapus Keluhan?',
        text: 'Keluhan ini akan dihapus.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Ya, hapus',
        cancelButtonText: 'Batal'
    }).then(result => {
        if (result.isConfirmed) {
            let allKeluhan = JSON.parse(localStorage.getItem('log_keluhan')) || [];
            const updatedKeluhan = allKeluhan.filter(k => k.id_keluhan !== keluhan_id_to_delete);
            localStorage.setItem('log_keluhan', JSON.stringify(updatedKeluhan));

            playSound('success');
            Swal.fire({
                icon: 'success',
                title: 'Keluhan berhasil dihapus',
                timer: 1200,
                showConfirmButton: false,
                timerProgressBar: true
            });
            return true;
        }
        return false;
    });
}

// -------------------- Exports / make them global for HTML onclick handlers --------------------
// If your HTML calls these functions via onclick attributes, they must be available on window
window.handleLogin = handleLogin;
window.handleLogout = handleLogout;
window.getCurrentUser = getCurrentUser;
window.handleSimpanKeluhan = handleSimpanKeluhan;
window.handleDeletePoin = handleDeletePoin;
window.handleDeleteKeluhan = handleDeleteKeluhan;
