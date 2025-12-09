# Visualisasi Interaktif Kualitas Udara Kota (3D Heatmap) - SDGs 11 & 13

![Project Screenshot](/Hasil%20Program/hasil_program2.jpg)

## 📖 Deskripsi Proyek

Proyek ini adalah simulasi grafika komputer berbasis web yang memvisualisasikan dampak polusi udara terhadap lingkungan perkotaan secara *real-time*. Menggunakan teknologi **WebGL** dan pustaka **Three.js**, aplikasi ini menampilkan kota 3D prosedural yang dilengkapi dengan sistem lalu lintas otomatis, emisi pabrik, dan visualisasi data kualitas udara (*Air Quality Index*) melalui perubahan atmosfer dan warna tanah (*heatmap*).

Tujuan utama proyek ini adalah sebagai media edukasi interaktif untuk mendukung **Sustainable Development Goals (SDGs)**:
* **SDG 11 (Sustainable Cities and Communities):** Memvisualisasikan dampak tata kota dan transportasi terhadap kelayakan huni.
* **SDG 13 (Climate Action):** Memvisualisasikan penyebaran polusi udara (PM2.5) dan urgensi penanganan emisi karbon.

## ✨ Fitur Utama

1.  **Simulasi Polusi Dinamis:**
    * **Slider Interaktif:** Mengubah tingkat polusi dari 0% (Bersih) hingga 100% (Berbahaya).
    * **Atmosfer Real-time:** Perubahan warna langit dan ketebalan kabut (*fog*) menyesuaikan dengan tingkat polusi.
    * **Dashboard Info:** Menampilkan status AQI dan rekomendasi kesehatan.
2.  **Sistem Lalu Lintas Cerdas:**
    * Mobil bergerak otomatis di jalur terpisah tanpa tabrakan.
    * Logika *Fade Out & Respawn* untuk menjaga performa memori.
    * Efek partikel asap (*smoke particles*) pada knalpot mobil dan cerobong pabrik.
3.  **Visualisasi 3D Heatmap:**
    * Tanah diwarnai menggunakan algoritma gradien (*Inverse Distance Weighting*) berdasarkan jarak dari sumber polusi (Pabrik).
    * Area dekat pabrik berwarna merah (kotor), area jauh berwarna abu-abu (aman).
4.  **Eksplorasi Kamera Bebas:**
    * Mode navigasi mirip *game* (WASD + Terbang) dan Orbit Control.

## 🎮 Kontrol (Keyboard & Mouse)

| Tombol | Fungsi |
| :--- | :--- |
| **W, A, S, D** | Bergerak (Maju, Kiri, Mundur, Kanan) |
| **SPACE** | Terbang Naik (Elevasi) |
| **SHIFT** | Turun (Elevasi) |
| **Klik Kiri + Drag** | Rotasi Pandangan Kamera |
| **Klik Kanan + Drag** | Geser Kamera |
| **Scroll Mouse** | Zoom In / Out |

## 🛠️ Tech Stack

* **Bahasa:** HTML5, CSS3, JavaScript (ES6 Modules)
* **Library Grafis:** [Three.js](https://threejs.org/) (via CDN)
* **Rendering:** WebGL
* **Aset 3D:** Format `.obj` (Low Poly)

## 📂 Struktur Folder

Pastikan susunan file Anda seperti berikut agar *path* aset terbaca dengan benar:

```text
/nama-proyek
│
├── object/           # Folder penyimpanan aset 3D
│   ├── car.obj
│   ├── factory.obj
│   └── house.obj
├── Hasil Program/
│   ├── hasil_program1.jpg
│   ├── hasil_program2.jpg
│   ├── hasil_program3.jpg
│   ├── hasil_program4.jpg
├── index.html        # File utama & UI
├── style.css         # Styling Dashboard
├── main.js           # Logika Three.js
└── README.md         # Dokumentasi
```

## 🚀 Cara Menjalankan (Installation)
Karena proyek ini memuat file eksternal (model .obj dan tekstur), browser akan memblokirnya jika dibuka langsung dengan cara klik dua kali (file:// protocol) karena kebijakan keamanan CORS Policy.

Anda harus menjalankannya menggunakan Local Server. Pilih salah satu cara di bawah ini:

Cara 1: Menggunakan VS Code (Disarankan)
1. Install ekstensi Live Server (by Ritwick Dey) di Visual Studio Code.
2. Buka folder proyek ini di VS Code.
3. Buka file index.html.
4. Klik kanan pada area kode, lalu pilih "Open with Live Server".
5. Browser akan otomatis terbuka (biasanya di http://127.0.0.1:5500).

Cara 2: Menggunakan Python (Alternatif)
Jika Anda sudah menginstall Python di komputer, Anda bisa membuat server instan melalui Terminal/CMD.
1. Buka Terminal atau Command Prompt.
2. Arahkan direktori ke folder proyek Anda (cd path/ke/folder/proyek).
3. Jalankan perintah berikut:
```
python -m http.server
```
4. Buka browser dan kunjungi: http://localhost:8000

## 🤝 Credits
Library: Three.js

Models: Free Low Poly Assets

Developer: Hafizh Fadhl Muhammad - 140810230070
