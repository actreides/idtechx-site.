/**
 * Language Selector Logic for IDTECHX
 * 
 * Features:
 * 1. IP-based Country Detection (Redirects to correct language on first visit)
 * 2. Cookie-based Preference Storage (Remember user choice)
 * 3. Manual override support
 */

var LanguageSelector = {
    settings: {
        cookieName: 'idtechx-lang',
        cookieExpires: 365,
        defaultLang: 'en',
        languages: ['en', 'pt', 'de', 'fr', 'es', 'it', 'nl', 'pl'],
        countryMaps: {
            'US': 'en', 'GB': 'en', 'CA': 'en', 'AU': 'en',
            'PT': 'pt', 'BR': 'pt',
            'DE': 'de', 'AT': 'de', 'CH': 'de',
            'FR': 'fr', 'BE': 'fr', 'LU': 'fr',
            'ES': 'es', 'MX': 'es', 'AR': 'es', 'CO': 'es',
            'IT': 'it',
            'NL': 'nl',
            'PL': 'pl'
        },
        languageUrls: {
            'en': { url: 'index.html' },
            'pt': { url: 'pt/index.html' },
            'de': { url: 'de/index.html' },
            'fr': { url: 'fr/index.html' },
            'es': { url: 'es/index.html' },
            'it': { url: 'it/index.html' },
            'nl': { url: 'nl/index.html' },
            'pl': { url: 'pl/index.html' }
        }
    },

    init: function () {
        var self = this;

        // Update UI to reflect current page language
        self.updateHeaderUI();

        // 1. Check if user already has a preferred language cookie
        var savedLang = $.cookie(self.settings.cookieName);

        // Helper function to determine the root path for redirection
        function getRootPath() {
            const path = window.location.pathname;
            // Check for known language subdirectories
            for (const langCode of self.settings.languages) {
                if (path.includes('/' + langCode + '/')) {
                    return '../'; // We are in a subdirectory, need to go up one level
                }
            }
            // Check for other common subdirectories (e.g., /products/, /company/)
            if (path.includes('/products/') || path.includes('/company/') ||
                path.includes('/technology/') || path.includes('/contact/')) {
                return '../'; // We are in a subdirectory, need to go up one level
            }
            return ''; // Assume we are at the root or a sibling directory
        }

        // Helper function to handle redirection
        function redirect(targetLang) {
            if (self.settings.languageUrls[targetLang]) {
                self.setPreference(targetLang); // Set cookie before redirecting
                const root = getRootPath();
                window.location.href = root + self.settings.languageUrls[targetLang].url;
            }
        }

        // 2. Handle manual selection (clicks on dropdown)
        $('.header-nav-features-languages .list a, #headerTopLanguagesDropdown a').on('click', function (e) {
            // Prevent default only if we are handling redirect via JS
            // But the <a> tags have hardcoded hrefs now.
            // Let's ensure the cookie is set even on hardcoded clicks if they match our pattern.
            const href = $(this).attr('href');
            let selectedLang = self.settings.defaultLang; // Default to 'en'

            // Determine selected language based on href
            for (const code in self.settings.languageUrls) {
                if (href.includes(self.settings.languageUrls[code].url)) {
                    selectedLang = code;
                    break;
                }
            }

            // Special case for root index.html (which might not have a lang prefix)
            if (href.endsWith('index.html') && !href.includes('/')) {
                selectedLang = 'en';
            }

            self.setPreference(selectedLang);
            // If the link is a full path, the browser will navigate.
            // If it's a relative path that needs adjustment, we could call redirect(selectedLang)
            // but for now, we assume the hrefs are correct for direct navigation.
            // The primary goal here is to set the cookie.
        });

        // 3. If no cookie, try IP detection
        if (!savedLang) {
            self.detectAndRedirect();
        }
    },

    updateHeaderUI: function () {
        var self = this;
        var currentPath = window.location.pathname;
        var currentLang = 'en';

        self.settings.languages.forEach(function (l) {
            if (currentPath.indexOf('/' + l + '/') !== -1) {
                currentLang = l;
            }
        });

        var langDisplay = currentLang.toUpperCase();
        var flagClass = (currentLang === 'en') ? 'flag-us' : 'flag-' + currentLang;

        // Update the toggle button
        $('#currentLanguage').html('<i class="flag ' + flagClass + ' header-nav-top-icon"></i> ' + langDisplay);
    },

    detectAndRedirect: function () {
        var self = this;

        $.getJSON('https://ipapi.co/json/', function (data) {
            if (data && data.country_code) {
                var detectedLang = self.settings.countryMaps[data.country_code] || self.settings.defaultLang;

                // Only redirect if detected language is different from current
                var currentPath = window.location.pathname;
                var currentLang = 'en'; // default

                self.settings.languages.forEach(function (l) {
                    if (currentPath.indexOf('/' + l + '/') !== -1) {
                        currentLang = l;
                    }
                });

                if (detectedLang !== currentLang) {
                    $.cookie(self.settings.cookieName, detectedLang, { expires: self.settings.cookieExpires, path: '/' });
                    const root = (currentLang === 'en') ? '' : '../';
                    window.location.href = root + self.settings.languageUrls[detectedLang].url;
                } else {
                    self.setPreference(detectedLang);
                }
            }
        });
    },

    setPreference: function (lang) {
        $.cookie(this.settings.cookieName, lang, { expires: this.settings.cookieExpires, path: '/' });
    }
};

$(document).ready(function () {
    LanguageSelector.init();
});
