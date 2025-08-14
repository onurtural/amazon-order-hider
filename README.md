# 🛒 Amazon Order Hider
[![Version](https://img.shields.io/badge/version-2.0.2-blue.svg)](https://github.com/yourusername/amazon-order-hider)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Firefox](https://img.shields.io/badge/Firefox-Compatible-orange.svg)](https://www.mozilla.org/firefox/)
[![Chrome](https://img.shields.io/badge/Chrome-Compatible-yellow.svg)](https://www.google.com/chrome/)
[![Manifest](https://img.shields.io/badge/Manifest-v3-purple.svg)](manifest.json)

> 🔒 Hide Amazon orders from your order history - Cross-browser extension with multi-language support

## ✨ Features

### 🌍 Multi-Language Support (14 Languages)
Automatic detection based on Amazon domain:
- 🇩🇪 German (amazon.de)
- 🇬🇧 English (amazon.com, .co.uk)
- 🇫🇷 French (amazon.fr)
- 🇮🇹 Italian (amazon.it)
- 🇪🇸 Spanish (amazon.es)
- 🇳🇱 Dutch (amazon.nl)
- 🇸🇪 Swedish (amazon.se)
- 🇵🇱 Polish (amazon.pl)
- 🇹🇷 Turkish (amazon.com.tr)
- 🇵🇹 Portuguese (amazon.com.br)
- 🇸🇦 Arabic (amazon.ae, .sa)
- 🇯🇵 Japanese (amazon.co.jp)
- 🇨🇳 Chinese (amazon.cn)

### 🤖 Auto-Hide Rules
- Create rules to automatically hide orders based on product titles
- Support for text matching and RegEx patterns
- Enable/disable rules individually

### 📋 Smart Import/Export
- Export your hidden orders and rules as JSON
- Import via clipboard (Cmd/Ctrl+V)
- Privacy-focused: metadata automatically cleaned

### 🎯 Advanced Features
- **Smart Detection**: Multi-pattern matching with normalization
- **Metadata System**: Shows product titles instead of just order numbers
- **Lazy Loading Support**: Detects dynamically loaded orders
- **Cross-Browser**: One codebase for Firefox & Chrome
- **Privacy First**: All data stored locally, no external connections

## 📦 Installation

### Firefox
1. Download the latest release from [Releases](https://github.com/yourusername/amazon-order-hider/releases)
2. Open Firefox and navigate to `about:debugging`
3. Click "This Firefox" → "Load Temporary Add-on"
4. Select the `manifest.json` file

### Chrome
1. Download the latest release
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (top right)
4. Click "Load unpacked"
5. Select the extension folder

### From Source
```bash
# Clone the repository
git clone https://github.com/yourusername/amazon-order-hider.git
cd amazon-order-hider

# For Firefox
# Load via about:debugging

# For Chrome
# Load via chrome://extensions/ in developer mode
```

## 🚀 Usage

### Basic Usage
1. Navigate to your Amazon order history
2. Click the extension icon
3. Enter an order number to hide
4. The order disappears from your history (locally only)

### Auto-Hide Rules
1. Click "Auto-Hide rules" in the popup
2. Enter a text pattern (e.g., "gift", "subscription")
3. Optional: Enable RegEx for advanced patterns
4. Orders matching your rules will be automatically hidden

### Import/Export
- **Export**: Click "Export" to save your hidden orders and rules
- **Import**: Click "Import" then press Cmd/Ctrl+V to paste JSON data

## 🔧 Technical Details

### File Structure
```
amazon-order-hider/
├── manifest.json       # Extension configuration
├── background.js       # Service Worker (MV3)
├── content.js         # Order detection & hiding logic
├── popup.html         # Extension popup UI
├── popup.js           # Popup functionality
├── popup.css          # Popup styling
└── icons/
    ├── icon-16.png
    ├── icon-48.png
    └── icon-128.png
```

### Cross-Browser Compatibility
The extension uses a unified codebase with automatic API detection:
```javascript
const api = typeof browser !== 'undefined' ? browser : chrome;
```

### Supported Amazon Domains
- 🌍 All major Amazon marketplaces
- 🔄 Automatic locale detection
- 📍 Works on `/gp/your-account/order-history`
- 📍 Works on `/gp/css/order-history`
- 📍 Works on `/your-orders/orders`

## 🛠️ Development

### Prerequisites
- Firefox Developer Edition or Chrome
- Basic knowledge of browser extensions
- Text editor (VS Code recommended)

### Building from Source
```bash
# No build process required - pure JavaScript
# Simply load the extension in developer mode
```

### Testing
1. Load the extension in developer mode
2. Navigate to Amazon order history
3. Open browser console (F12) for debug logs
4. Test hiding/showing orders

## 📊 Version History

### v29 (2025-01-14) - Current
- ✨ Cross-browser unified codebase
- 🔧 Automatic API detection (browser/chrome)
- 🎨 Centered import note UI improvement

### v24 (2025-01-13) - Production Release
- ✨ Multi-language support (14 languages)
- ✨ Auto-hide rules with RegEx
- ✨ Clipboard import without file dialog
- ✨ Metadata system for product titles
- ⚡ Manifest V3 upgrade
- 🔧 Improved order detection
- 🔧 Robust MutationObserver
- 🔒 Privacy-focused metadata cleaning

### v23 (2025-01-13)
- 🔧 Fixed content.js errors
- 🔧 Debug mode in popup
- ❌ Removed info banner

### v22 (2025-01-13)
- 🎉 Initial Firefox version
- ✨ Basic hide/show functionality
- ✨ JSON export/import
- ✨ Badge counter

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔒 Privacy

- **No data collection**: The extension never sends data to external servers
- **Local storage only**: All hidden orders are stored locally in your browser
- **No tracking**: No analytics or tracking of any kind
- **Open source**: Full code transparency

## 🐛 Known Issues

- Amazon layout changes may occasionally break order detection
- Some special order types might not be detected
- Import feature requires clipboard API permission

## 📮 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/amazon-order-hider/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/amazon-order-hider/discussions)
- **Email**: your.email@example.com

## 🙏 Acknowledgments

- Thanks to all contributors
- Inspired by privacy-focused browser extensions
- Built with ❤️ for the open-source community

## 📸 Screenshots

### Main Popup
![Main Interface](https://via.placeholder.com/400x500/667eea/ffffff?text=Main+Interface)

### Auto-Hide Rules
![Auto-Hide Rules](https://via.placeholder.com/400x300/764ba2/ffffff?text=Auto-Hide+Rules)

### Multi-Language Support
![Language Support](https://via.placeholder.com/400x200/667eea/ffffff?text=14+Languages)

---

<div align="center">

**[Download](https://github.com/yourusername/amazon-order-hider/releases) • [Report Bug](https://github.com/yourusername/amazon-order-hider/issues) • [Request Feature](https://github.com/yourusername/amazon-order-hider/issues)**

Made with ❤️ by the Open Source Community

</div>
