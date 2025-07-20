// FileManager Class
class FileManager {
    constructor() {
        this.currentFile = null;
        this.originalData = null;
    }

    // File API kullanarak JSON dosya okuma
    async loadFile(file) {
        return new Promise((resolve, reject) => {
            if (!file) {
                reject(new Error('Dosya seçilmedi'));
                return;
            }

            if (!file.name.toLowerCase().endsWith('.json')) {
                reject(new Error('Sadece JSON dosyaları desteklenir'));
                return;
            }

            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const jsonData = JSON.parse(e.target.result);
                    this.currentFile = file;
                    this.originalData = jsonData;
                    resolve(jsonData);
                } catch (error) {
                    reject(new Error('Geçersiz JSON formatı: ' + error.message));
                }
            };

            reader.onerror = () => {
                reject(new Error('Dosya okuma hatası'));
            };

            reader.readAsText(file);
        });
    }

    // JSON format validation
    validateJSON(data) {
        const errors = [];

        if (!data || typeof data !== 'object') {
            errors.push('JSON root object olmalı');
            return { isValid: false, errors };
        }

        // Check different supported formats
        const hasTranslationsKey = data.translations && typeof data.translations === 'object';
        const isDirectFormat = this.isDirectTranslationFormat(data);
        const isLanguageFirstFormat = this.isLanguageFirstFormat(data);

        if (!hasTranslationsKey && !isDirectFormat && !isLanguageFirstFormat) {
            errors.push('Desteklenmeyen JSON formatı. Desteklenen formatlar:\n' +
                '1. { key: { lang: value } }\n' +
                '2. { lang: { key: value } }\n' +
                '3. { translations: { key: { lang: value } } }');
        }

        // Basic structure validation
        if (Object.keys(data).length === 0) {
            errors.push('JSON dosyası boş');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // Check if data is in direct translation format (key -> {lang: value})
    isDirectTranslationFormat(data) {
        const keys = Object.keys(data);
        if (keys.length === 0) return false;

        // Check first few keys to see if they contain language mappings
        const sampleKeys = keys.slice(0, 3);
        return sampleKeys.every(key => {
            const value = data[key];
            return value && typeof value === 'object' && !Array.isArray(value);
        });
    }

    // Check if data is in language-first format (lang -> {key: value})
    isLanguageFirstFormat(data) {
        const keys = Object.keys(data);
        if (keys.length === 0) return false;

        // Check if top-level keys look like language codes (2-5 chars)
        const languageLikeKeys = keys.filter(key =>
            typeof key === 'string' &&
            key.length >= 2 &&
            key.length <= 5 &&
            key.toLowerCase() === key
        );

        if (languageLikeKeys.length === 0) return false;

        // Check if values are objects with string keys
        return languageLikeKeys.every(langKey => {
            const langData = data[langKey];
            return langData &&
                typeof langData === 'object' &&
                !Array.isArray(langData) &&
                Object.keys(langData).length > 0 &&
                Object.values(langData).every(val => typeof val === 'string');
        });
    }

    // Export/download functionality
    exportJSON(data, filename = null) {
        try {
            const jsonString = JSON.stringify(data, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = filename || (this.currentFile ? this.currentFile.name : 'translations.json');
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            return true;
        } catch (error) {
            console.error('Export error:', error);
            return false;
        }
    }

    // Get current file info
    getCurrentFileInfo() {
        return {
            name: this.currentFile?.name || null,
            size: this.currentFile?.size || 0,
            lastModified: this.currentFile?.lastModified || null
        };
    }
}

// TranslationManager Class
class TranslationManager {
    constructor() {
        this.translations = {};
        this.languages = [];
        this.translationKeys = [];
    }

    // JSON'u çeviri yapısına dönüştürme
    parseTranslations(jsonData) {
        console.log('Parsing translations, input format detection...');

        // Handle different JSON structures
        if (jsonData.translations) {
            // Format: { translations: { key: { lang: value } } }
            console.log('Format detected: Nested translations object');
            this.translations = jsonData.translations;
        } else if (this.isDirectTranslationFormat(jsonData)) {
            // Format: { key: { lang: value } }
            console.log('Format detected: Direct translation format');
            this.translations = jsonData;
        } else if (this.isLanguageFirstFormat(jsonData)) {
            // Format: { lang: { key: value } } - Convert to { key: { lang: value } }
            console.log('Format detected: Language-first format, converting...');
            this.translations = this.convertLanguageFirstFormat(jsonData);
        } else {
            console.error('Unknown JSON format:', Object.keys(jsonData));
            throw new Error('Desteklenmeyen JSON formatı. Desteklenen formatlar:\n1. { key: { lang: value } }\n2. { lang: { key: value } }\n3. { translations: { key: { lang: value } } }');
        }

        // Extract languages and keys
        this.extractLanguagesAndKeys();

        return {
            translations: this.translations,
            languages: this.languages,
            keys: this.translationKeys
        };
    }

    // Check if data is direct translation format
    isDirectTranslationFormat(data) {
        const keys = Object.keys(data);
        if (keys.length === 0) return false;

        return keys.some(key => {
            const value = data[key];
            return value && typeof value === 'object' && !Array.isArray(value);
        });
    }

    // Extract languages and keys from translations
    extractLanguagesAndKeys() {
        const languageSet = new Set();
        this.translationKeys = Object.keys(this.translations);

        // Collect all languages
        this.translationKeys.forEach(key => {
            const translations = this.translations[key];
            if (translations && typeof translations === 'object') {
                Object.keys(translations).forEach(lang => {
                    languageSet.add(lang);
                });
            }
        });

        this.languages = Array.from(languageSet).sort();
    }

    // Eksik çevirileri tespit etme
    findMissingTranslations() {
        const missing = [];

        this.translationKeys.forEach(key => {
            const translations = this.translations[key] || {};

            this.languages.forEach(lang => {
                const value = translations[lang];
                if (!value || value.toString().trim() === '') {
                    missing.push({
                        key,
                        language: lang,
                        value: value || ''
                    });
                }
            });
        });

        return missing;
    }

    // Yeni dil ekleme
    addLanguage(langCode) {
        if (!langCode || langCode.trim() === '') {
            throw new Error('Dil kodu boş olamaz');
        }

        langCode = langCode.trim().toLowerCase();

        if (this.languages.includes(langCode)) {
            throw new Error('Bu dil zaten mevcut');
        }

        // Add language to all existing keys
        this.translationKeys.forEach(key => {
            if (!this.translations[key]) {
                this.translations[key] = {};
            }
            this.translations[key][langCode] = '';
        });

        this.languages.push(langCode);
        this.languages.sort();

        return langCode;
    }

    // Çeviri güncelleme
    updateTranslation(key, lang, value) {
        if (!this.translations[key]) {
            this.translations[key] = {};
        }

        this.translations[key][lang] = value;
    }

    // Arama ve filtreleme
    searchTranslations(query, selectedLanguages = []) {
        if (!query && selectedLanguages.length === 0) {
            return this.translationKeys;
        }

        const queryLower = query.toLowerCase();
        const filteredKeys = [];

        this.translationKeys.forEach(key => {
            let matchesQuery = false;
            let matchesLanguage = selectedLanguages.length === 0;

            // Check if key matches query
            if (!query || key.toLowerCase().includes(queryLower)) {
                matchesQuery = true;
            }

            // Check if any translation value matches query
            if (!matchesQuery && query) {
                const translations = this.translations[key] || {};
                matchesQuery = Object.values(translations).some(value =>
                    value && value.toString().toLowerCase().includes(queryLower)
                );
            }

            // Check language filter
            if (selectedLanguages.length > 0) {
                const translations = this.translations[key] || {};
                matchesLanguage = selectedLanguages.some(lang =>
                    translations[lang] && translations[lang].toString().trim() !== ''
                );
            }

            if (matchesQuery && matchesLanguage) {
                filteredKeys.push(key);
            }
        });

        return filteredKeys;
    }

    // Get statistics
    getStatistics() {
        const totalKeys = this.translationKeys.length;
        const totalLanguages = this.languages.length;
        const missingTranslations = this.findMissingTranslations();
        const totalPossibleTranslations = totalKeys * totalLanguages;
        const completedTranslations = totalPossibleTranslations - missingTranslations.length;
        const completionRate = totalPossibleTranslations > 0
            ? Math.round((completedTranslations / totalPossibleTranslations) * 100)
            : 0;

        return {
            totalKeys,
            totalLanguages,
            missingCount: missingTranslations.length,
            completionRate: completionRate + '%',
            missingTranslations
        };
    }

    // Export data in original format
    exportData() {
        return this.translations;
    }

    // Check if data is in language-first format (lang -> {key: value})
    isLanguageFirstFormat(data) {
        const keys = Object.keys(data);
        if (keys.length === 0) return false;

        // Check if top-level keys look like language codes (2-5 chars)
        const languageLikeKeys = keys.filter(key =>
            typeof key === 'string' &&
            key.length >= 2 &&
            key.length <= 5 &&
            key.toLowerCase() === key
        );

        if (languageLikeKeys.length === 0) return false;

        // Check if values are objects with string keys
        return languageLikeKeys.every(langKey => {
            const langData = data[langKey];
            return langData &&
                typeof langData === 'object' &&
                !Array.isArray(langData) &&
                Object.keys(langData).length > 0 &&
                Object.values(langData).every(val => typeof val === 'string');
        });
    }

    // Convert language-first format to key-first format
    convertLanguageFirstFormat(data) {
        const converted = {};
        const languages = Object.keys(data);

        console.log('Converting from language-first format. Languages found:', languages);

        // Get all unique keys from all languages
        const allKeys = new Set();
        languages.forEach(lang => {
            if (data[lang] && typeof data[lang] === 'object') {
                Object.keys(data[lang]).forEach(key => allKeys.add(key));
            }
        });

        console.log('Total unique keys found:', allKeys.size);

        // Convert structure
        allKeys.forEach(key => {
            converted[key] = {};
            languages.forEach(lang => {
                const value = data[lang] && data[lang][key] ? data[lang][key] : '';
                converted[key][lang] = value;
            });
        });

        return converted;
    }
}

// UIManager Class
class UIManager {
    constructor() {
        this.currentFilter = 'all'; // 'all', 'missing'
        this.currentSearch = '';
        this.selectedLanguages = [];
    }

    // Çeviri tablosunu oluşturma
    renderTranslationTable(translationManager, filteredKeys = null) {
        const keys = filteredKeys || translationManager.translationKeys;
        const languages = translationManager.languages;
        const translations = translationManager.translations;

        // Create table header
        const headerHtml = `
            <tr>
                <th class="translation-key">Anahtar</th>
                ${languages.map(lang => `<th class="translation-lang">${lang.toUpperCase()}</th>`).join('')}
            </tr>
        `;

        // Create table body
        const bodyHtml = keys.map(key => {
            const keyTranslations = translations[key] || {};

            return `
                <tr data-key="${key}">
                    <td class="translation-key">${key}</td>
                    ${languages.map(lang => {
                const value = keyTranslations[lang] || '';
                const isMissing = !value || value.toString().trim() === '';

                return `
                            <td class="translation-value ${isMissing ? 'missing-translation' : ''}">
                                <input 
                                    type="text" 
                                    value="${this.escapeHtml(value)}" 
                                    data-key="${key}" 
                                    data-lang="${lang}"
                                    placeholder="Çeviri girin..."
                                    ${isMissing ? 'class="missing-translation"' : ''}
                                >
                            </td>
                        `;
            }).join('')}
                </tr>
            `;
        }).join('');

        // Update DOM
        const tableHeader = document.getElementById('tableHeader');
        const tableBody = document.getElementById('tableBody');

        if (tableHeader) tableHeader.innerHTML = headerHtml;
        if (tableBody) tableBody.innerHTML = bodyHtml;

        this.attachInputEventListeners();
    }

    // Attach event listeners to translation inputs
    attachInputEventListeners() {
        const inputs = document.querySelectorAll('.translation-value input');
        inputs.forEach(input => {
            input.addEventListener('input', (e) => {
                const key = e.target.dataset.key;
                const lang = e.target.dataset.lang;
                const value = e.target.value;

                // Update translation manager
                if (window.translationManager) {


                    window.translationManager.updateTranslation(key, lang, value);

                    // Update missing class
                    const isMissing = !value || value.trim() === '';
                    e.target.classList.toggle('missing-translation', isMissing);
                    e.target.closest('.translation-value').classList.toggle('missing-translation', isMissing);

                    // Update statistics
                    this.updateStatistics(window.translationManager);


                }
            });
        });
    }

    // Update statistics display
    updateStatistics(translationManager) {
        const stats = translationManager.getStatistics();

        const totalKeysEl = document.getElementById('totalKeys');
        const totalLanguagesEl = document.getElementById('totalLanguages');
        const missingCountEl = document.getElementById('missingCount');
        const completionRateEl = document.getElementById('completionRate');

        if (totalKeysEl) totalKeysEl.textContent = stats.totalKeys;
        if (totalLanguagesEl) totalLanguagesEl.textContent = stats.totalLanguages;
        if (missingCountEl) missingCountEl.textContent = stats.missingCount;
        if (completionRateEl) completionRateEl.textContent = stats.completionRate;
    }

    // Show/hide loading state
    showLoadingState(message = 'Yükleniyor...', showProgress = false) {
        const loadingText = document.getElementById('loadingText');
        const loadingOverlay = document.getElementById('loadingOverlay');

        if (loadingText) loadingText.textContent = message;
        if (loadingOverlay) loadingOverlay.style.display = 'flex';

        // Add progress bar if needed
        if (showProgress && !document.querySelector('.progress-bar')) {
            const loadingContent = document.querySelector('.loading-content');
            if (loadingContent) {
                const progressBar = document.createElement('div');
                progressBar.className = 'progress-bar';
                progressBar.innerHTML = '<div class="progress-fill" style="width: 0%"></div>';
                loadingContent.appendChild(progressBar);
            }
        }
    }

    hideLoadingState() {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) loadingOverlay.style.display = 'none';

        // Remove progress bar if exists
        const progressBar = document.querySelector('.progress-bar');
        if (progressBar) {
            progressBar.remove();
        }
    }

    // Update progress bar
    updateProgress(percentage) {
        const progressFill = document.querySelector('.progress-fill');
        if (progressFill) {
            progressFill.style.width = percentage + '%';
        }
    }

    // Display error message
    displayErrorMessage(error) {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--danger-color);
            color: white;
            padding: 1rem 1.5rem;
            border-radius: var(--border-radius);
            box-shadow: var(--shadow-lg);
            z-index: 1001;
            max-width: 400px;
            animation: slideIn 0.3s ease;
        `;

        const message = error.message || error.toString();
        errorDiv.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div>
                    <strong>❌ Hata</strong><br>
                    ${this.escapeHtml(message)}
                </div>
                <button onclick="this.parentElement.parentElement.remove()" 
                        style="background: none; border: none; color: white; font-size: 1.2rem; cursor: pointer; margin-left: 1rem;">
                    ×
                </button>
            </div>
        `;

        document.body.appendChild(errorDiv);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (errorDiv.parentElement) {
                errorDiv.remove();
            }
        }, 5000);
    }

    // Display success message
    displaySuccessMessage(message) {
        const successDiv = document.createElement('div');
        successDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--success-color);
            color: white;
            padding: 1rem 1.5rem;
            border-radius: var(--border-radius);
            box-shadow: var(--shadow-lg);
            z-index: 1001;
            max-width: 400px;
            animation: slideIn 0.3s ease;
        `;

        successDiv.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div>
                    <strong>✅ Başarılı</strong><br>
                    ${this.escapeHtml(message)}
                </div>
                <button onclick="this.parentElement.parentElement.remove()" 
                        style="background: none; border: none; color: white; font-size: 1.2rem; cursor: pointer; margin-left: 1rem;">
                    ×
                </button>
            </div>
        `;

        document.body.appendChild(successDiv);

        // Auto remove after 3 seconds
        setTimeout(() => {
            if (successDiv.parentElement) {
                successDiv.remove();
            }
        }, 3000);
    }

    // Show/hide main content
    showMainContent() {
        const mainContent = document.getElementById('mainContent');
        if (mainContent) mainContent.style.display = 'block';
    }

    hideMainContent() {
        const mainContent = document.getElementById('mainContent');
        if (mainContent) mainContent.style.display = 'none';
    }

    // Escape HTML for safe rendering
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Filter translations (show only missing)
    filterMissingTranslations(translationManager) {
        const missingTranslations = translationManager.findMissingTranslations();
        
        this.currentFilter = 'missing';
        
        // Hide table and show missing view
        const tableContainer = document.getElementById('tableContainer');
        const missingContainer = document.getElementById('missingContainer');
        
        if (tableContainer) tableContainer.style.display = 'none';
        if (missingContainer) missingContainer.style.display = 'block';
        
        // Render missing translations list
        this.renderMissingTranslations(missingTranslations);

        // Update button state
        const btn = document.getElementById('showMissingBtn');
        if (btn) {
            btn.textContent = '📋 Tümünü Göster';
            btn.classList.add('btn-warning');
            btn.classList.remove('btn-secondary');
        }
    }

    // Show all translations
    showAllTranslations(translationManager) {
        this.currentFilter = 'all';
        
        // Show table and hide missing view
        const tableContainer = document.getElementById('tableContainer');
        const missingContainer = document.getElementById('missingContainer');
        
        if (tableContainer) tableContainer.style.display = 'block';
        if (missingContainer) missingContainer.style.display = 'none';
        
        this.renderTranslationTable(translationManager);

        // Update button state
        const btn = document.getElementById('showMissingBtn');
        if (btn) {
            btn.innerHTML = '<span class="btn-icon">⚠️</span>Eksikleri Göster';
            btn.classList.add('btn-secondary');
            btn.classList.remove('btn-warning');
        }
    }

    // Render missing translations in vertical list with JSON
    renderMissingTranslations(missingTranslations) {
        const missingList = document.getElementById('missingList');
        const jsonOutput = document.getElementById('missingJsonOutput');
        
        if (!missingList || !jsonOutput) return;

        // Group missing translations by key
        const groupedMissing = {};
        missingTranslations.forEach(item => {
            if (!groupedMissing[item.key]) {
                groupedMissing[item.key] = [];
            }
            groupedMissing[item.key].push(item.language);
        });

        // Render missing items list
        const listHtml = Object.entries(groupedMissing).map(([key, languages]) => {
            return `
                <div class="missing-item">
                    <div class="missing-item-key">${key}</div>
                    <div class="missing-item-langs">
                        ${languages.map(lang => `<span class="missing-item-lang">${lang}</span>`).join(' ')}
                    </div>
                </div>
            `;
        }).join('');

        missingList.innerHTML = listHtml;

        // Create JSON for missing translations
        const missingJson = {};
        Object.entries(groupedMissing).forEach(([key, languages]) => {
            missingJson[key] = {};
            languages.forEach(lang => {
                missingJson[key][lang] = "";
            });
        });

        // Display formatted JSON
        jsonOutput.textContent = JSON.stringify(missingJson, null, 2);
    }
}

// AITranslator Class
class AITranslator {
    constructor() {
        this.isOnline = navigator.onLine;
        this.supportedLanguages = {
            'tr': 'Turkish',
            'en': 'English',
            'fr': 'French',
            'de': 'German',
            'es': 'Spanish'
        };

        // Check online status
        window.addEventListener('online', () => this.isOnline = true);
        window.addEventListener('offline', () => this.isOnline = false);
    }

    // Get language name from code
    getLanguageName(langCode) {
        return this.supportedLanguages[langCode.toLowerCase()] || langCode.toUpperCase();
    }

    // Detect source language from existing translations
    detectSourceLanguage(translations) {
        const languageCounts = {};

        Object.values(translations).forEach(translationObj => {
            Object.keys(translationObj).forEach(lang => {
                const value = translationObj[lang];
                if (value && value.toString().trim() !== '') {
                    languageCounts[lang] = (languageCounts[lang] || 0) + 1;
                }
            });
        });

        // Return the language with most translations
        return Object.keys(languageCounts).reduce((a, b) =>
            languageCounts[a] > languageCounts[b] ? a : b, 'en'
        );
    }

    // Fallback translation using simple rules
    generateFallbackTranslation(text, fromLang, toLang) {
        // Simple fallback - just add language prefix
        const langName = this.getLanguageName(toLang);
        return `[${langName}] ${text}`;
    }

    // Main translate function with fallback
    async translateText(text, fromLang, toLang) {
        if (!text || text.trim() === '') {
            return '';
        }

        if (fromLang === toLang) {
            return text;
        }

        // Use fallback translation for now
        return this.generateFallbackTranslation(text, fromLang, toLang);
    }

    // Translate batch with progress tracking
    async translateBatch(translations, onProgress = null) {
        const results = [];
        const total = translations.length;

        for (let i = 0; i < translations.length; i++) {
            const item = translations[i];

            try {
                // Add small delay to avoid rate limiting
                if (i > 0) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }

                const translatedText = await this.translateText(
                    item.text,
                    item.fromLang,
                    item.toLang
                );

                results.push({
                    ...item,
                    translatedText,
                    success: true
                });

                // Report progress
                if (onProgress) {
                    onProgress({
                        completed: i + 1,
                        total,
                        percentage: Math.round(((i + 1) / total) * 100),
                        currentItem: item
                    });
                }

            } catch (error) {
                console.error('Translation failed for:', item, error);

                results.push({
                    ...item,
                    translatedText: this.generateFallbackTranslation(item.text, item.fromLang, item.toLang),
                    error: error.message,
                    success: false
                });
            }
        }

        return results;
    }

    // Prepare missing translations for batch processing
    prepareMissingTranslations(translationManager) {
        const missingTranslations = translationManager.findMissingTranslations();
        const sourceLanguage = this.detectSourceLanguage(translationManager.translations);

        const translationTasks = [];

        missingTranslations.forEach(missing => {
            const translations = translationManager.translations[missing.key];

            // Find a source text to translate from
            let sourceText = null;
            let sourceLang = sourceLanguage;

            // Try to find existing translation in source language
            if (translations[sourceLanguage] && translations[sourceLanguage].trim() !== '') {
                sourceText = translations[sourceLanguage];
            } else {
                // Find any existing translation to use as source
                for (const [lang, text] of Object.entries(translations)) {
                    if (text && text.trim() !== '') {
                        sourceText = text;
                        sourceLang = lang;
                        break;
                    }
                }
            }

            // If no source text found, use the key itself
            if (!sourceText) {
                sourceText = missing.key;
                sourceLang = 'en'; // Assume key is in English
            }

            translationTasks.push({
                key: missing.key,
                text: sourceText,
                fromLang: sourceLang,
                toLang: missing.language,
                originalMissing: missing
            });
        });

        return translationTasks;
    }

    // Get translation statistics
    getTranslationStats(translationManager) {
        const missing = translationManager.findMissingTranslations();
        const sourceLanguage = this.detectSourceLanguage(translationManager.translations);

        return {
            totalMissing: missing.length,
            sourceLanguage: sourceLanguage,
            sourceName: this.getLanguageName(sourceLanguage),
            isOnline: this.isOnline,
            canTranslate: this.isOnline || missing.length > 0
        };
    }
}

// Global instances
let fileManager;
let translationManager;
let uiManager;
let aiTranslator;

// Initialize application
function initializeApp() {
    console.log('Initializing Multilang Manager...');

    fileManager = new FileManager();
    translationManager = new TranslationManager();
    uiManager = new UIManager();
    aiTranslator = new AITranslator();

    // Make instances globally accessible
    window.translationManager = translationManager;
    window.fileManager = fileManager;
    window.uiManager = uiManager;
    window.aiTranslator = aiTranslator;

    setupEventListeners();

    console.log('Multilang Manager initialized successfully');
}



// Setup event listeners
function setupEventListeners() {
    console.log('Setting up event listeners...');

    // File input
    const fileInput = document.getElementById('fileInput');
    const selectFileBtn = document.getElementById('selectFileBtn');
    const uploadArea = document.getElementById('uploadArea');

    if (selectFileBtn) {
        selectFileBtn.addEventListener('click', () => {
            console.log('Select file button clicked');
            if (fileInput) {
                fileInput.click();
            }
        });
    }

    if (fileInput) {
        fileInput.addEventListener('change', handleFileSelect);
    }

    // Drag and drop
    if (uploadArea) {
        uploadArea.addEventListener('dragover', handleDragOver);
        uploadArea.addEventListener('dragleave', handleDragLeave);
        uploadArea.addEventListener('drop', handleFileDrop);
        uploadArea.addEventListener('click', () => {
            console.log('Upload area clicked');
            if (fileInput) {
                fileInput.click();
            }
        });
    }

    // Search
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }

    // Buttons
    const showMissingBtn = document.getElementById('showMissingBtn');
    const addLanguageBtn = document.getElementById('addLanguageBtn');
    const exportBtn = document.getElementById('exportBtn');

    if (showMissingBtn) {
        showMissingBtn.addEventListener('click', toggleMissingFilter);
    }
    if (addLanguageBtn) {
        addLanguageBtn.addEventListener('click', showAddLanguageModal);
    }
    if (exportBtn) {
        exportBtn.addEventListener('click', exportTranslations);
    }

    // Modal
    const closeModal = document.getElementById('closeModal');
    const cancelAddLanguage = document.getElementById('cancelAddLanguage');
    const confirmAddLanguage = document.getElementById('confirmAddLanguage');

    if (closeModal) {
        closeModal.addEventListener('click', hideAddLanguageModal);
    }
    if (cancelAddLanguage) {
        cancelAddLanguage.addEventListener('click', hideAddLanguageModal);
    }
    if (confirmAddLanguage) {
        confirmAddLanguage.addEventListener('click', confirmAddLanguage);
    }

    // Copy JSON button
    const copyJsonBtn = document.getElementById('copyJsonBtn');
    if (copyJsonBtn) {
        copyJsonBtn.addEventListener('click', copyMissingJson);
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);

    console.log('Event listeners setup completed');
}

// Event handlers
async function handleFileSelect(event) {
    console.log('File selected:', event.target.files[0]);
    const file = event.target.files[0];
    if (file) {
        await loadTranslationFile(file);
    }
}

function handleDragOver(event) {
    event.preventDefault();
    event.currentTarget.classList.add('dragover');
}

function handleDragLeave(event) {
    event.currentTarget.classList.remove('dragover');
}

async function handleFileDrop(event) {
    event.preventDefault();
    event.currentTarget.classList.remove('dragover');

    const files = event.dataTransfer.files;
    console.log('Files dropped:', files);
    if (files.length > 0) {
        await loadTranslationFile(files[0]);
    }
}

function handleSearch(event) {
    const query = event.target.value;
    uiManager.currentSearch = query;

    if (translationManager.translationKeys.length > 0) {
        const filteredKeys = translationManager.searchTranslations(query);
        uiManager.renderTranslationTable(translationManager, filteredKeys);
    }
}

function toggleMissingFilter() {
    if (uiManager.currentFilter === 'all') {
        uiManager.filterMissingTranslations(translationManager);
    } else {
        uiManager.showAllTranslations(translationManager);
    }
}



function showAddLanguageModal() {
    const modal = document.getElementById('addLanguageModal');
    if (modal) {
        modal.style.display = 'flex';
        const langCodeInput = document.getElementById('languageCode');
        if (langCodeInput) {
            langCodeInput.focus();
        }
    }
}

function hideAddLanguageModal() {
    const modal = document.getElementById('addLanguageModal');
    if (modal) {
        modal.style.display = 'none';
    }

    const langCodeInput = document.getElementById('languageCode');
    const langNameInput = document.getElementById('languageName');

    if (langCodeInput) langCodeInput.value = '';
    if (langNameInput) langNameInput.value = '';
}

function confirmAddLanguage() {
    const langCodeInput = document.getElementById('languageCode');
    if (!langCodeInput) return;

    const langCode = langCodeInput.value.trim();

    if (!langCode) {
        alert('Dil kodu gerekli!');
        return;
    }

    try {
        translationManager.addLanguage(langCode);
        uiManager.renderTranslationTable(translationManager);
        uiManager.updateStatistics(translationManager);
        uiManager.displaySuccessMessage(`${langCode.toUpperCase()} dili eklendi!`);
        hideAddLanguageModal();
    } catch (error) {
        uiManager.displayErrorMessage(error);
    }
}

function exportTranslations() {
    try {
        const data = translationManager.exportData();
        const success = fileManager.exportJSON(data);

        if (success) {
            uiManager.displaySuccessMessage('Dosya başarıyla indirildi!');
        } else {
            throw new Error('Export işlemi başarısız');
        }
    } catch (error) {
        uiManager.displayErrorMessage(error);
    }
}

// Main file loading function
async function loadTranslationFile(file) {
    console.log('Loading translation file:', file.name, 'Size:', file.size, 'Type:', file.type);

    // Prevent multiple simultaneous loads
    if (window.isLoadingFile) {
        console.log('File loading already in progress, skipping...');
        return;
    }

    window.isLoadingFile = true;
    uiManager.showLoadingState('Dosya yükleniyor...');

    try {
        // Load and validate file
        console.log('Step 1: Loading file...');
        const jsonData = await fileManager.loadFile(file);
        console.log('Step 2: File loaded, data keys:', Object.keys(jsonData).slice(0, 5));

        console.log('Step 3: Validating JSON...');
        const validation = fileManager.validateJSON(jsonData);
        console.log('Step 4: Validation result:', validation);

        if (!validation.isValid) {
            throw new Error('Dosya doğrulama hatası:\n' + validation.errors.join('\n'));
        }

        // Parse translations
        console.log('Step 5: Parsing translations...');
        const parsedData = translationManager.parseTranslations(jsonData);
        console.log('Step 6: Parsed data:', {
            keys: parsedData.keys.length,
            languages: parsedData.languages,
            sampleTranslations: Object.keys(parsedData.translations).slice(0, 3)
        });

        console.log('Step 7: File processing completed...');

        // Update UI
        console.log('Step 8: Updating UI...');
        uiManager.renderTranslationTable(translationManager);
        uiManager.updateStatistics(translationManager);
        uiManager.showMainContent();

        console.log('Step 9: File processing completed...');

        console.log('Step 10: File loading completed successfully');
        uiManager.displaySuccessMessage(`Dosya başarıyla yüklendi! ${parsedData.keys.length} anahtar, ${parsedData.languages.length} dil bulundu.`);

    } catch (error) {
        console.error('File loading error at step:', error);
        uiManager.displayErrorMessage(error);
    } finally {
        window.isLoadingFile = false;
        uiManager.hideLoadingState();
    }
}

// Handle keyboard shortcuts
function handleKeyboardShortcuts(event) {
    // Cache functionality has been removed - no undo/redo available

    // Ctrl+S for save/export
    if (event.ctrlKey && event.key === 's') {
        event.preventDefault();
        if (translationManager && translationManager.translationKeys.length > 0) {
            exportTranslations();
        }
    }

    // Ctrl+F for search focus
    if (event.ctrlKey && event.key === 'f') {
        event.preventDefault();
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.focus();
        }
    }
}

// Error boundary for better error handling
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    if (window.uiManager) {
        window.uiManager.displayErrorMessage(new Error('Beklenmeyen bir hata oluştu: ' + event.error.message));
    }
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    if (window.uiManager) {
        window.uiManager.displayErrorMessage(new Error('İşlem başarısız: ' + event.reason));
    }
});

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing app...');
    initializeApp();
});
function copyMissingJson() {
    const jsonOutput = document.getElementById('missingJsonOutput');
    if (!jsonOutput) return;

    const jsonText = jsonOutput.textContent;
    
    // Modern clipboard API
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(jsonText).then(() => {
            uiManager.displaySuccessMessage('JSON panoya kopyalandı!');
        }).catch(err => {
            console.error('Clipboard copy failed:', err);
            fallbackCopyToClipboard(jsonText);
        });
    } else {
        // Fallback for older browsers
        fallbackCopyToClipboard(jsonText);
    }
}

// Fallback copy method
function fallbackCopyToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        document.execCommand('copy');
        uiManager.displaySuccessMessage('JSON panoya kopyalandı!');
    } catch (err) {
        console.error('Fallback copy failed:', err);
        uiManager.displayErrorMessage(new Error('Kopyalama başarısız. JSON\'u manuel olarak seçip kopyalayın.'));
    }
    
    document.body.removeChild(textArea);
}