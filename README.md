# CCTV Live Denpasar

Website statis viewer multi-kamera lalu lintas Kota Denpasar.

Sumber video: [ATCS Kota Denpasar](https://atcs.denpasarkota.go.id/)

## Disclaimer

- Proyek pribadi, **tidak berafiliasi dengan ATCS Kota Denpasar** maupun Pemkot Denpasar.
- Video diambil langsung dari server ATCS oleh browser pengunjung. Tidak disimpan atau disiarkan ulang. Hak atas video milik ATCS.
- Jika ATCS membatasi atau mematikan stream, tampilan ini tidak akan berfungsi.
- **Vibe code project**: kode dibuat dengan bantuan AI.

## Fitur

- Grid 100+ kamera, pencarian jalan/simpang, dan pilih beberapa kamera
- Ketuk kamera untuk memperbesar
- Hemat kuota: hanya kamera yang terlihat dimuat, maksimal 9 diputar bersamaan, dijeda saat tab tidak aktif
- Pemulihan otomatis saat koneksi macet
- Tema terang/gelap, jam WITA

## Pengaturan

Di `app.js`: ubah `maxLive` di `CONFIG` untuk jumlah kamera bersamaan, atau edit array `CAMS` untuk daftar kamera.

Semakin banyak pengunjung, semakin besar beban server ATCS. Turunkan `maxLive` dan cantumkan sumber jika menghosting sendiri.
