# Design Document

## Overview

Multilang Manager, vanilla HTML, CSS ve JavaScript kullanarak geliştirilecek bir single-page web uygulamasıdır. Uygulama, client-side olarak çalışacak ve herhangi bir backend sunucuya ihtiyaç duymayacaktır. File API kullanarak JSON dosyalarını okuyacak, DOM manipulation ile dinamik arayüz oluşturacak ve AI çeviri için external API entegrasyonu sağlayacaktır.

## Architecture

### Client-Side Architecture
```
┌─────────────────────────────────────┐
│           HTML Structure            │
├─────────────────────────────────────┤
│  • File Upload Area                 │
│  • Translation Table                │
│  • Control Panel                    │
│  • Status Messages                  │
└─────────────────────────────────────┘
                  │
┌─────────────────────────────────────┐
│         JavaScript Modules          │
├─────────────────────────────────────┤
│  • FileManager (JSON I/O)          │
│  • TranslationManager (Data Logic)  │
│  • UIManager (DOM Updates)          │
│  • AITranslator (API Integration)   │
└─────────────────────────────────────┘
                  │
┌─────────────────────────────────────┐
│           CSS Styling               │
├─────────────────────────────────────┤
│  • Responsive Grid Layout          │
│  • Component Styling               │
│  • State Indicators                │
│  • Animation & Transitions         │
└─────────────────────────────────────┘
```

## Components and Interfaces

### 1. FileManager
**Sorumluluk:** JSON dosya okuma/yazma işlemleri
```javascript
class FileManager {
  loadFile(file) // File API ile JSON okuma
  validateJSON(data) // JSON format doğrulama
  exportJSON(data) // Güncellenmiş JSON indirme
}
```

### 2. TranslationManager
**Sorumluluk:** Çeviri verilerini yönetme ve analiz etme
```javascript
class TranslationManager {
  parseTranslations(jsonData) // JSON'u çeviri yapısına dönüştürme
  findMissingTranslations() // Eksik çevirileri tespit etme
  addLanguage(langCode) // Yeni dil ekleme
  updateTranslation(key, lang, value) // Çeviri güncelleme
  searchTranslations(query) // Arama ve filtreleme
}
```

### 3. UIManager
**Sorumluluk:** DOM manipülasyonu ve kullanıcı arayüzü
```javascript
class UIManager {
  renderTranslationTable(data) // Çeviri tablosunu oluşturma
  highlightMissingTranslations() // Eksik çevirileri vurgulama
  showLoadingState() // Yükleme durumu gösterme
  displayErrorMessage(error) // Hata mesajları
  updateProgressBar(progress) // İlerleme çubuğu
}
```

### 4. AITranslator
**Sorumluluk:** AI çeviri API entegrasyonu
```javascript
class AITranslator {
  translateText(text, fromLang, toLang) // Tekil çeviri
  translateBatch(translations) // Toplu çeviri
  detectLanguage(text) // Dil tespiti
}
```

## Data Models

### Translation Data Structure
```javascript
{
  "languages": ["tr", "en", "ce", "cz"],
  "translations": {
    "alert_delete_title": {
      "tr": "Silme Uyarısı",
      "en": "Delete Warning",
      "ce": "删除警告",
      "cz": "" // Eksik çeviri
    },
    "button_save": {
      "tr": "Kaydet",
      "en": "Save",
      "ce": "",
      "cz": ""
    }
  }
}
```

### UI State Management
```javascript
const appState = {
  currentFile: null,
  translations: {},
  languages: [],
  missingTranslations: [],
  searchQuery: "",
  selectedLanguages: [],
  isLoading: false
}
```

## Error Handling

### File Upload Errors
- Geçersiz JSON formatı → Kullanıcıya açık hata mesajı
- Dosya okuma hatası → Retry seçeneği sunma
- Büyük dosya uyarısı → Performance uyarısı

### API Errors
- Çeviri API hatası → Fallback mekanizması
- Network timeout → Retry logic
- Rate limiting → Kullanıcıyı bilgilendirme

### Validation Errors
- Boş anahtar değerleri → Uyarı mesajı
- Geçersiz dil kodları → Format kontrolü
- Duplicate keys → Otomatik birleştirme

## Testing Strategy

### Unit Testing (Jest ile)
- FileManager JSON parsing testleri
- TranslationManager veri manipülasyon testleri
- Utility fonksiyonları testleri

### Integration Testing
- File upload → parse → display flow
- AI translation → update → export flow
- Search/filter functionality

### Manual Testing
- Farklı JSON formatları ile test
- Büyük dosyalarla performance testi
- Responsive design testi
- Cross-browser compatibility

## Implementation Details

### HTML Structure
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Multilang Manager</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="container">
    <header class="upload-section">
      <input type="file" id="fileInput" accept=".json">
      <button id="loadBtn">Dosya Yükle</button>
    </header>
    
    <main class="content">
      <div class="controls">
        <input type="text" id="searchInput" placeholder="Anahtar ara...">
        <button id="fillMissingBtn">Eksikleri Doldur</button>
        <button id="addLanguageBtn">Yeni Dil Ekle</button>
        <button id="exportBtn">İndir</button>
      </div>
      
      <div class="translation-table-container">
        <table id="translationTable"></table>
      </div>
    </main>
  </div>
  
  <script src="script.js"></script>
</body>
</html>
```

### CSS Approach
- CSS Grid için modern layout
- CSS Custom Properties için tema desteği
- Responsive breakpoints
- Loading states için CSS animations
- Missing translations için visual indicators

### JavaScript Architecture
- ES6 modules kullanımı
- Event-driven architecture
- Promise-based async operations
- Local storage için state persistence