# CCTV Live Denpasar

Website statis open source viewer multi-kamera lalu lintas Kota Denpasar.

Sumber video: [ATCS Kota Denpasar](https://atcs.denpasarkota.go.id/)

## Disclaimer

- Proyek pribadi, **tidak berafiliasi dengan ATCS Kota Denpasar** maupun Pemkot Denpasar.
- Video diambil langsung dari server ATCS oleh browser pengunjung. Tidak disimpan atau disiarkan ulang. Hak atas video milik ATCS.
- Jika ATCS membatasi atau mematikan stream, tampilan ini tidak akan berfungsi.
- Data cuaca berasal dari [Open-Meteo](https://open-meteo.com/) dan diminta langsung oleh browser pengunjung.
- **Vibe code project**: kode dibuat dengan bantuan AI.

## Fitur

**Menonton**
- Grid 100+ kamera, pencarian jalan/simpang, dan pilih beberapa kamera
- Ketuk kamera untuk memperbesar
- Auto mode (`auto.html`): kamera berganti otomatis tiap 10 detik sampai 2 menit, cocok untuk layar TV atau pos jaga. Ada tombol sebelumnya/berikutnya/jeda, layar penuh, pintasan keyboard (←, →, spasi, F), dan kamera offline dilewati otomatis

**Menyaring**
- Chip jalan utama (Gatot Subroto, Imam Bonjol, Teuku Umar, dan lainnya) dibuat otomatis dari data lokasi
- Favorit (ikon bintang di tiap kamera), hanya online, dan online duluan
- Tombol coba lagi di tiap kamera

**Preferensi dan berbagi**
- Tema, bahasa, favorit, pilihan kamera, dan filter tersimpan di browser
- Link bagikan: `index.html#cams=A001,A002` membuka daftar kamera tertentu. Buat lewat tombol "Salin link" di panel pilih kamera
- Bahasa Indonesia dan Inggris
- Cuaca Denpasar di header (Open-Meteo, tanpa API key)

**Performa**
- Hemat kuota: hanya kamera yang terlihat dimuat, maksimal 9 diputar bersamaan, dijeda saat tab tidak aktif
- Pemulihan otomatis saat koneksi macet
- Tema terang/gelap, jam WITA, tampilan responsif untuk HP

## Struktur file

| File | Fungsi |
| --- | --- |
| `index.html`, `style.css`, `app.js` | Halaman utama (grid kamera) |
| `auto.html`, `auto.css`, `auto.js` | Halaman Auto mode |
| `cameras.js` | Daftar kamera dan ID-nya |
| `common.js` | Konfigurasi, terjemahan, penyimpanan lokal, jam, dan cuaca |
| `player.js` | Pemutar HLS (memakai hls.js dari CDN) |

Tanpa proses build. Unggah semua file ke hosting statis apa pun (Vercel, GitHub Pages, dan sebagainya).

## Pengaturan

- `common.js`: ubah `maxLive` di `CONFIG` untuk jumlah kamera bersamaan, dan `T` untuk teks/terjemahan. Koordinat cuaca ada di URL dalam `startWeather`.
- `cameras.js`: edit array `RAW_CAMS` (nama, lokasi, URL stream) untuk daftar kamera. ID (misalnya `A001`) diambil dari kode di URL stream, jadi tetap stabil walau urutan berubah. Jika satu kode stream dipakai dua kali, ID kedua mendapat akhiran `b`.
- `auto.js`: ubah `INTERVALS` untuk pilihan lama tampil per kamera di Auto mode.

Semakin banyak pengunjung, semakin besar beban server ATCS. Turunkan `maxLive` dan cantumkan sumber jika menghosting sendiri.

## Privasi

Preferensi disimpan hanya di browser pengunjung (`localStorage`, awalan `cctv.`) dan tidak dikirim ke mana pun. Satu-satunya permintaan selain ke ATCS dan CDN hls.js adalah ke Open-Meteo untuk cuaca.
