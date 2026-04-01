/**
 * pwa-install.js
 * Handles the "Install App" experience for both Android/Chrome (beforeinstallprompt)
 * and iOS/Safari (manual Add to Home Screen instructions).
 *
 * Expected markup on any page that wants an install button:
 *   <button id="btn-pwa-install" style="display:none">Install App</button>
 *
 * The script will reveal and wire up that button automatically.
 */

(function () {
    'use strict';

    // Don't show install UI when already running as a standalone PWA
    if (window.matchMedia('(display-mode: standalone)').matches || navigator.standalone) {
        return;
    }

    var deferredPrompt = null;

    var isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;

    // ── iOS: show instructions modal ────────────────────────────────────────
    function showIOSModal() {
        var overlay = document.createElement('div');
        overlay.id = 'pwa-ios-modal';
        overlay.style.cssText = [
            'position:fixed', 'inset:0', 'z-index:9999',
            'display:flex', 'align-items:flex-end', 'justify-content:center',
            'background:rgba(0,0,0,0.7)', 'backdrop-filter:blur(6px)',
            '-webkit-backdrop-filter:blur(6px)', 'padding:1rem'
        ].join(';');

        overlay.innerHTML = [
            '<div style="',
                'background:#0d1117;',
                'border:1px solid rgba(0,229,255,0.25);',
                'border-radius:20px;',
                'padding:1.5rem;',
                'max-width:360px;',
                'width:100%;',
                'text-align:center;',
                'color:#fff;',
                'font-family:Inter,sans-serif;',
                'box-shadow:0 0 40px rgba(0,229,255,0.15)',
            '">',
                '<img src="/icons/icon-192x192.png" width="64" height="64" ',
                    'style="border-radius:14px;margin:0 auto 1rem;display:block" alt="NexNet">',
                '<p style="font-family:Orbitron,sans-serif;font-weight:900;font-size:1.1rem;',
                    'letter-spacing:.08em;color:#00e5ff;margin-bottom:.5rem">',
                    'INSTALL NEXNET',
                '</p>',
                '<p style="font-size:.8rem;line-height:1.6;color:#94a3b8;margin-bottom:1.25rem">',
                    'Tap the',
                    ' <svg style="display:inline;vertical-align:middle" width="18" height="18" viewBox="0 0 24 24"',
                        ' fill="none" stroke="#00e5ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">',
                        '<path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>',
                        '<polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>',
                    '</svg>',
                    ' <strong style="color:#fff">Share</strong> button below,',
                    ' then choose <strong style="color:#fff">Add to Home Screen</strong>.',
                '</p>',
                '<button id="pwa-ios-close" style="',
                    'background:linear-gradient(135deg,#00e5ff,#0097a7);',
                    'color:#050505;border:none;border-radius:10px;',
                    'padding:10px 28px;font-weight:700;font-size:.85rem;',
                    'cursor:pointer;letter-spacing:.05em',
                '">Got it</button>',
            '</div>'
        ].join('');

        document.body.appendChild(overlay);

        overlay.addEventListener('click', function (e) {
            if (e.target === overlay || e.target.id === 'pwa-ios-close') {
                overlay.remove();
            }
        });
    }

    // ── Wire up the install button once DOM is ready ────────────────────────
    function init() {
        var btn = document.getElementById('btn-pwa-install');
        if (!btn) return;

        if (isIOS) {
            // iOS: always show the button (opens instructions)
            btn.style.display = '';
            btn.addEventListener('click', showIOSModal);
            return;
        }

        // Android/Chrome: show button only after the browser defers the prompt
        window.addEventListener('beforeinstallprompt', function (e) {
            e.preventDefault();
            deferredPrompt = e;
            btn.style.display = '';

            btn.addEventListener('click', function () {
                deferredPrompt.prompt();
                deferredPrompt.userChoice.then(function () {
                    deferredPrompt = null;
                    btn.style.display = 'none';
                });
            });
        });

        // Hide button once app is installed
        window.addEventListener('appinstalled', function () {
            btn.style.display = 'none';
            deferredPrompt = null;
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
}());
