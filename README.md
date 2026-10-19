# CCTV Live Bali

Website statis open source untuk memantau CCTV publik di seluruh kabupaten/kota di Bali (280+ kamera, 9 wilayah).  
Site: https://cctv-bali.satnar.my.id

## Disclaimer

- Proyek pribadi, **tidak berafiliasi dengan Pemprov Bali, pemerintah kabupaten/kota, maupun penyedia stream**.
- Video diambil dari server sumber, sebagian besar langsung oleh browser pengunjung. Stream yang servernya membatasi akses (saat ini Desa Punggul) diteruskan lewat proxy Cloudflare Worker hanya untuk menambahkan header yang diperlukan. Video tidak disimpan. Hak atas video milik masing-masing sumber.
- Jika sumber membatasi atau mematikan stream, kamera terkait tidak akan tampil.
- **Vibe code project**: kode dibuat dengan bantuan AI.

Sumber video: [ATCS Kota Denpasar](https://atcs.denpasarkota.go.id/), [Bali Satu Data](https://balisatudata.baliprov.go.id/), [Bina Marga](https://binamarga.pu.go.id/), [Badilag Mahkamah Agung](https://badilag.mahkamahagung.go.id/) (CCTV Pengadilan Agama dan PTA Bali), dan Pemkab Buleleng, serta [CCTV Desa Punggul](https://cctv.punggul.desa.id/) (Kecamatan Abiansemal, Kabupaten Badung). Cuaca dari [Open-Meteo](https://open-meteo.com/).

## Fitur

- **Peta Bali**: pilih kabupaten/kota di peta untuk melihat jumlah kamera dan cuaca, lalu buka kameranya
- **Halaman per wilayah**: grid kamera, pencarian, filter jenis lokasi (jalan, simpang, pantai, pura, dll), favorit, hanya online
- **Pencarian** lokasi/kamera di beranda, plus **Terakhir dilihat**
- **Auto mode** (`/auto/`): kamera berganti otomatis (10 detik sampai 2 menit) dari wilayah pilihan, layar penuh, pintasan keyboard
- **Multi-kamera** (`/multi/`): putar semua kamera favorit sekaligus dalam grid 2x2 / 3x3
- **PWA**: bisa dipasang di HP/desktop
- Tema terang/gelap, Indonesia dan Inggris, jam WITA, responsif untuk HP
- Hemat kuota: hanya kamera yang terlihat diputar, dijeda saat tab tidak aktif, sambung ulang otomatis
- Preferensi (tema, bahasa, favorit, filter) tersimpan di browser

## Struktur file

| File | Fungsi |
| --- | --- |
| `index.html`, `assets/home.*`, `assets/bali-map.js` | Beranda dan peta |
| `<kabupaten>/index.html`, `assets/app.js`, `assets/style.css` | Halaman kamera per wilayah |
| `auto/`, `assets/auto.*` | Auto mode |
| `multi/`, `assets/multi.*` | Multi-kamera favorit |
| `assets/cameras.js` | Daftar wilayah dan kamera |
| `assets/common.js` | Konfigurasi, terjemahan, penyimpanan lokal, cuaca, tema |
| `assets/player.js` | Pemutar HLS (hls.js dari CDN) |
| `worker.js` | Proxy (Cloudflare Worker): CORS dan sesi untuk host tertentu, termasuk stream Desa Punggul |
| `sw.js`, `manifest.json` | PWA |
| `tools/build-map.mjs` | Membuat `bali-map.js` dari GeoJSON batas wilayah |

## Pengaturan

- `cameras.js`: tambah/ubah kamera di daftar tiap wilayah. Kamera Desa Punggul ditulis di `PGL` dengan format `["Lokasi | Nama CCTV", nomorKamera]`; lokasi otomatis diformat sebagai nama jalan standar dan nama CCTV otomatis huruf kapital. Nama semua kamera ditampilkan dengan huruf kapital.
- `cameras.js` (`PROXY`): isi dengan URL Worker. Wajib untuk kamera Desa Punggul, dan opsional untuk stream lain yang terblokir CORS.
- `worker.js`: daftar host yang diizinkan ada di `ALLOW`, dan header Origin/Referer per host di `HOSTH`. Deploy ke Cloudflare Workers.
- `common.js`: `maxLive` untuk jumlah kamera diputar bersamaan, `T` untuk teks/terjemahan.
- `auto.js`: `INTERVALS` untuk pilihan lama tampil per kamera.
- `sw.js`: naikkan `VERSION` setiap kali file situs berubah.

Semakin banyak pengunjung, semakin besar beban server sumber. Turunkan `maxLive` dan cantumkan sumber jika menghosting sendiri.

## Privasi

Preferensi hanya disimpan di browser (`localStorage`, awalan `cctv.`) dan tidak dikirim ke mana pun. Permintaan eksternal hanya ke server video sumber, proxy Cloudflare Worker (untuk stream tertentu), CDN hls.js, Google Fonts, dan Open-Meteo.
