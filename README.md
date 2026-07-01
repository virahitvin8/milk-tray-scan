<![CDATA[<div align="center">

# 🥛 Milk Tray Scan

### AI-Powered Real-Time Milk Packet Counter

[![Build & Release](https://github.com/virahitvin8/milk-tray-scan/actions/workflows/build-release.yml/badge.svg)](https://github.com/virahitvin8/milk-tray-scan/actions)
[![Release](https://img.shields.io/github/v/release/virahitvin8/milk-tray-scan?color=blue&label=Download%20APK)](https://github.com/virahitvin8/milk-tray-scan/releases/latest)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Flutter](https://img.shields.io/badge/Flutter-3.27-blue?logo=flutter)](https://flutter.dev)

**Count milk packets instantly using your phone camera with on-device AI detection.**  
No internet required. No server costs. Completely free and offline.

[📲 Download APK](https://github.com/virahitvin8/milk-tray-scan/releases/latest) · [🐛 Report Bug](https://github.com/virahitvin8/milk-tray-scan/issues) · [✨ Request Feature](https://github.com/virahitvin8/milk-tray-scan/issues)

</div>

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 📸 **Real-Time Detection** | Live camera feed with instant object detection |
| 🤖 **On-Device AI** | Google ML Kit runs entirely on your phone — zero server costs |
| 📊 **Live Bounding Boxes** | Visual overlays showing detected packets with count |
| 💾 **Save & Capture** | Take photos and save counting sessions |
| 📋 **History Tracking** | View past sessions with total packet statistics |
| 🔄 **Camera Switching** | Toggle between front and rear cameras |
| 🌙 **Dark Mode** | Automatic dark/light theme based on system settings |
| 🆓 **100% Free & Offline** | No subscriptions, no ads, no internet needed |

## 🏗️ Tech Stack

- **Framework**: [Flutter](https://flutter.dev) (Dart)
- **AI/ML Engine**: [Google ML Kit Object Detection](https://developers.google.com/ml-kit/vision/object-detection)
- **Detection Mode**: Real-time stream processing (on-device)
- **Storage**: SharedPreferences (local)
- **Camera**: Flutter Camera Plugin with NV21 image format
- **CI/CD**: GitHub Actions (automated APK build & release)

## 📲 Installation

### Download APK (Recommended)
1. Go to [**Releases**](https://github.com/virahitvin8/milk-tray-scan/releases/latest)
2. Download `MilkTrayScan-v1.0.0.apk`
3. Enable **"Install from unknown sources"** in Android Settings
4. Install and open the app
5. Grant **camera permission** when prompted
6. Point at milk packets and start counting!

### Build from Source
```bash
# Clone the repository
git clone https://github.com/virahitvin8/milk-tray-scan.git
cd milk-tray-scan

# Install dependencies
flutter pub get

# Build release APK
flutter build apk --release

# APK will be at: build/app/outputs/flutter-apk/app-release.apk
```

## 🎯 How It Works

```
Camera Feed → NV21 Frame → Google ML Kit → Object Detection → Bounding Boxes → Count Display
     ↓              ↓              ↓              ↓              ↓              ↓
  Live View    Raw Bytes     On-Device AI    Filter by      Draw Boxes      Real-time
  Preview      Stream        Processing      Size (>1.5%)   & Labels        Counter
```

1. **Camera captures** live video frames in NV21 format
2. **ML Kit processes** each frame for object detection on-device
3. **Filtering** removes noise (objects smaller than 1.5% of frame)
4. **Bounding boxes** are drawn with corner markers and labels
5. **Count is displayed** in real-time with a "LIVE" indicator
6. **Capture & Save** preserves the count with a photo to history

## 📱 Requirements

- Android 5.0 (Lollipop, API 21) or higher
- Camera hardware
- ~30 MB storage space

## 📁 Project Structure

```
lib/
├── main.dart                    # App entry point & routing
├── models/
│   └── count_record.dart        # Data model for counting sessions
├── screens/
│   ├── home_screen.dart         # Landing page with navigation
│   ├── camera_screen.dart       # Real-time detection & counting
│   └── history_screen.dart      # Past counting sessions
└── services/
    └── storage_service.dart     # Local persistence (SharedPreferences)
```

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Made with ❤️ for dairy businesses across India**

*Powered by Flutter & Google ML Kit*

</div>
]]>
