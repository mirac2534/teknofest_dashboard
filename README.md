# Synapse Flight Integrity Dashboard

Synapse Dijital Kara Kutu Sistemi icin yerel, frontend odakli demo paneli.

Bu uygulama; ucus telemetrisi uretimi, paket hashleme, local buffer, off-chain DB simülasyonu, blokzincir ledger simülasyonu, butunluk dogrulama, kritik kanit paketi ve canli log konsolu akisini gosterir. Gercek backend veya gercek blokzincir agi kullanmaz.

## Tech Stack

- React
- TypeScript
- Vite
- Material UI
- Apache ECharts / echarts-for-react
- Browser Crypto API ile SHA-256
- Local/session storage tabanli demo oturum ve tema kaliciligi

## Installation

```bash
npm install
```

## Run

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Demo Login

- Username: `Synapse`
- Password: `1516`

## Pages Overview

- **Anasayfa:** Ucus, baglanti, blokzincir, buffer, kritik olay ve dogrulama KPI ozeti.
- **Operasyon Akisi:** Sensor verisi uretiminden blokzincir commit ve dogrulamaya kadar interaktif pipeline.
- **Telemetri:** Canli log tablosu, ham telemetri paketleri, paket detay drawer'i, sensor tutarlilik kontrolleri ve grafikler.
- **Profil:** Demo operator profili, yetkiler, guvenlik ve oturum aksiyonlari.
- **Yardim:** Sistem mimarisi, hash dogrulamasi, buffer, kritik kanit paketi ve SSS dokumantasyonu.

## Demo Flow

1. Login.
2. Go to **Operasyon Akisi**.
3. Start simulation.
4. Trigger connection loss.
5. Trigger critical altitude drop.
6. Restore connection.
7. Trigger tamper.
8. Verify packet.
9. Review logs in **Telemetri**.

## Notes

- Tum veriler tarayici icinde uretilir ve bellekte tutulur.
- Blokzincir kayitlari simule edilir; ham telemetri zincire yazilmaz.
- Global canli log konsolu tum authenticated sayfalarda gorunur.
- Tema tercihi tarayicida saklanir.
