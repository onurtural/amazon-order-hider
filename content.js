// Amazon Order Hider – Content Script
// (i18n label detection + Optimized DOM scanning + Lazy-Load Fix + Auto-Reload CSS + Auto-Hide Rules)

(() => {
  'use strict';
const api = typeof browser !== 'undefined' ? browser : chrome;

  // ==== Helpers ==============================================================
  const norm = (s) => (s || '').replace(/[\u200e\u200f\u202a-\u202e]/g, '').replace(/\s+/g, '').trim();
  const variants = (s) => { const n = norm(s); return [n, n.replace(/-/g, '')]; };
  const buildHiddenSet = (list) => { const set = new Set(); (list || []).forEach(o => variants(o).forEach(v => set.add(v))); return set; };

  // ==== i18n – Labels für "Bestellnummer" ===================================
  const ORDER_LABELS = {
    en: ['Order #', 'Order number'],
    de: ['Bestellnr.', 'Bestellnummer', 'Bestell-Nr', 'Bestell-Nr.'],
    fr: ['N° de commande', 'Numéro de commande', 'Commande n°'],
    it: ['Numero ordine', 'N. ordine'],
    es: ['N.º de pedido', 'Número de pedido', 'Pedido n.º'],
    nl: ['Bestelnummer', 'Bestelnr.'],
    sv: ['Ordernummer'],
    pl: ['Numer zamówienia'],
    tr: ['Sipariş No', 'Sipariş Numarası'],
    pt: ['Nº do pedido', 'Número do pedido'],
    ar: ['رقم الطلب'],
    ja: ['注文番号'],
    zh: ['订单编号']
  };

  const DOMAIN_LOCALE = {
    'amazon.de': 'de', 'amazon.at': 'de',
    'amazon.com': 'en', 'amazon.co.uk': 'en', 'amazon.ca': 'en', 'amazon.com.au': 'en', 'amazon.sg': 'en', 'amazon.in': 'en',
    'amazon.fr': 'fr', 'amazon.it': 'it', 'amazon.es': 'es', 'amazon.nl': 'nl',
    'amazon.se': 'sv', 'amazon.pl': 'pl', 'amazon.com.tr': 'tr', 'amazon.be': 'nl', 'amazon.com.be': 'nl',
    'amazon.com.mx': 'es', 'amazon.com.br': 'pt',
    'amazon.ae': 'ar', 'amazon.sa': 'ar', 'amazon.eg': 'ar',
    'amazon.co.jp': 'ja', 'amazon.cn': 'zh'
  };

  function detectLocale() {
    const dl = (document.documentElement.getAttribute('lang') || '').slice(0, 2).toLowerCase();
    if (dl && ORDER_LABELS[dl]) return dl;
    const host = location.hostname;
    const key = Object.keys(DOMAIN_LOCALE).find(d => host.endsWith(d));
    if (key) return DOMAIN_LOCALE[key];
    return 'en';
  }
  const LOCALE = detectLocale();
  const LABELS = new Set((ORDER_LABELS[LOCALE] || ORDER_LABELS.en).map(s => s.toLowerCase()));

  // ==== Selektoren (zentral) ================================================
  const ORDER_SELECTORS = [
    'li.order-card__list',
    '.order-card.js-order-card',
    '.order',
    '.a-box-group.a-spacing-base.order',
    '.a-box-group.order',
    '.js-order-card',
    '[class*="order-info"]',
    '.a-fixed-left-grid',
    '.a-box.a-color-offset-background.order-info',
    'div[data-order-id]',
    '.a-section.a-spacing-medium',
    '.a-section.order-info'
  ];
  const ORDER_SEL = ORDER_SELECTORS.join(',');

  function getOrderContainers(root = document) {
    if (root && root.nodeType === 1) {
      const list = [];
      if (root.matches?.(ORDER_SEL)) list.push(root);
      list.push(...root.querySelectorAll?.(ORDER_SEL) ?? []);
      return list;
    }
    return document.querySelectorAll(ORDER_SEL);
  }

  // ==== Style-Injector: robustes Verbergen ==================================
  (function injectStyleOnce() {
    if (document.getElementById('order-hider-style')) return;
    const st = document.createElement('style');
    st.id = 'order-hider-style';
    st.textContent = `
      [data-order-hider-hidden="1"] { display: none !important; }
    `;
    document.documentElement.appendChild(st);
  })();

  // ==== Hide-Marker ==========================================================
  function unhidePreviouslyHidden(scope = document) {
    (scope.querySelectorAll ? scope.querySelectorAll('[data-order-hider-hidden="1"]') : document.querySelectorAll('[data-order-hider-hidden="1"]'))
      .forEach((el) => { el.removeAttribute('data-order-hider-hidden'); });
  }
  function markAndHide(container) {
    if (!container || container.getAttribute('data-order-hider-hidden') === '1') return;
    container.setAttribute('data-order-hider-hidden', '1'); // CSS übernimmt das Verstecken
  }

  // ==== Order-Nummern- & Titel-Erkennung ====================================
  function extractOrderNumber(element) {
    // 1) Neueres Layout
    const idDiv = element.querySelector('.yohtmlc-order-id');
    if (idDiv) {
      const span = idDiv.querySelector('span[dir="ltr"]') || idDiv.querySelector('.a-color-secondary:last-child');
      if (span) {
        const raw = (span.textContent || '').trim();
        if (/\d{3}-\d{7}-\d{7}/.test(raw)) return raw;
      }
    }
    // 2) Mehrsprachige Label-Erkennung
    const labels = element.querySelectorAll('.a-color-secondary.a-text-caps, .a-color-secondary');
    for (const lbl of labels) {
      const t = (lbl.textContent || '').trim().toLowerCase();
      if ([...LABELS].some(x => t.includes(x))) {
        let val = lbl.nextElementSibling;
        if (!val && lbl.parentElement) {
          val = lbl.parentElement.querySelector('span[dir="ltr"]') || lbl.parentElement.querySelector('.a-color-secondary:last-child');
        }
        const raw = (val?.textContent || '').trim();
        if (/\d{3}-\d{7}-\d{7}/.test(raw)) return raw;
      }
    }
    // 3) bdi Fallback
    for (const bdi of element.querySelectorAll('bdi')) {
      const raw = (bdi.textContent || '').trim();
      if (/\d{3}-\d{7}-\d{7}/.test(raw)) return raw;
    }
    // 4) data-order-id
    const attr = element.getAttribute('data-order-id');
    if (attr && /\d{3}-\d{7}-\d{7}/.test(attr)) return attr;
    return null;
  }

  function extractFirstTitle(element) {
    const selectors = [
      '.yohtmlc-product-title',
      'a.a-link-normal[href*="/gp/product/"]',
      'a.a-link-normal[href*="/dp/"]',
      'a.a-link-normal[href*="/gp/aw/d"]',
      'span.a-truncate-full',
      'span.a-text-bold',
      '.a-link-normal .a-size-base',
      '.a-size-medium.a-color-base',
      '.a-row .a-link-normal'
    ];
    for (const sel of selectors) {
      const el = element.querySelector(sel);
      if (!el) continue;
      const txt = (el.textContent || '').trim();
      if (txt && txt.length > 2) return txt;
    }
    const anyA = element.querySelector('a');
    const t = (anyA?.textContent || '').trim();
    return t && t.length > 2 ? t : null;
  }

  // ==== Metadaten sammeln (orderNumber -> { title, updatedAt }) =============
  async function collectOrderMeta(root = document) {
    const meta = {};
    getOrderContainers(root).forEach((c) => {
      const orderNo = extractOrderNumber(c);
      if (!orderNo) return;
      const title = extractFirstTitle(c);
      if (title) meta[orderNo] = { title, updatedAt: Date.now() };
    });
    if (Object.keys(meta).length === 0) return;
    const res = await api.storage.local.get('hiddenMeta');
    await api.storage.local.set({ hiddenMeta: { ...(res.hiddenMeta || {}), ...meta } });
  }

  // ==== Auto-Hide-Regeln (Titel-Match) ======================================
  async function applyAutoHideRules() {
    const { hiddenMeta = {}, hiddenOrders = [], autoRules = [] } = await api.storage.local.get(['hiddenMeta', 'hiddenOrders', 'autoRules']);
    const activeRules = (autoRules || []).filter(r => r && r.enabled && r.pattern && (r.type === 'contains' || r.type === 'regex'));
    if (!activeRules.length) return;

    const orders = new Set(hiddenOrders || []);
    const compiled = activeRules.map(r => {
      if (r.type === 'regex') { try { return { type: 'regex', re: new RegExp(r.pattern, 'i') }; } catch { return null; } }
      return { type: 'contains', needle: r.pattern.toLowerCase() };
    }).filter(Boolean);

    for (const [orderNo, meta] of Object.entries(hiddenMeta)) {
      const title = (meta?.title || '').toLowerCase();
      if (!title) continue;
      for (const rule of compiled) {
        const match = rule.type === 'regex' ? rule.re.test(title) : title.includes(rule.needle);
        if (match) { orders.add(orderNo); break; }
      }
    }

    const merged = Array.from(orders);
    if (merged.length !== (hiddenOrders || []).length) {
      await api.storage.local.set({ hiddenOrders: merged });
      try { api.runtime?.sendMessage?.({ action: 'updateBadge' }); } catch {}
      await hideOrders(document, { full: false });
    }
  }

  // ==== Hide-Engine ==========================================================
  async function hideOrders(root = document, opts = { full: false }) {
    const { hiddenOrders = [] } = await api.storage.local.get(['hiddenOrders']);

    if (!hiddenOrders.length) {
      if (opts.full) unhidePreviouslyHidden(document);
      return;
    }

    const hiddenSet = buildHiddenSet(hiddenOrders);
    if (opts.full) unhidePreviouslyHidden(document);

    let hiddenCount = 0;
    getOrderContainers(root).forEach((element) => {
      const orderNo = extractOrderNumber(element);
      if (!orderNo) return;
      const a = norm(orderNo), b = a.replace(/-/g, '');
      if (hiddenSet.has(a) || hiddenSet.has(b)) {
        markAndHide(element);
        hiddenCount++;
      }
    });

    if (hiddenCount > 0) console.log('Hidden:', hiddenCount);
    // Metadaten sammeln (für Popup-Titelanzeige) – im selben Scope
    collectOrderMeta(root).catch(() => {});
  }

  // ==== MutationObserver (Lazy-Load-Fix) ====================================
  function observeOrders() {
    try {
      const observer = new MutationObserver((mutations) => {
        const changedTargets = new Set();

        for (const m of mutations) {
          // neu hinzugefügte Bereiche gezielt scannen
          m.addedNodes.forEach((node) => { if (node.nodeType === 1) hideOrders(node, { full: false }); });

          // Änderungen innerhalb bestehender Order-Container erneut scannen
          if (m.target && m.target.closest) {
            const container = m.target.closest(ORDER_SEL);
            if (container) changedTargets.add(container);
          }
        }

        changedTargets.forEach((container) => { hideOrders(container, { full: false }); });
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
        attributeFilter: ['style', 'class', 'dir']
      });
    } catch {}
  }

  // ==== Messages =============================================================
  api.runtime?.onMessage?.addListener((req, _sender, sendResponse) => {
    if (req.action === 'updateHiddenOrders') {
      hideOrders(document, { full: true }).then(() => sendResponse?.({ ok: true }));
      return true;
    }
    if (req.action === 'collectOrderMeta') {
      collectOrderMeta().then(() => sendResponse?.({ ok: true }));
      return true;
    }
    if (req.action === 'applyAutoRules') {
      applyAutoHideRules().then(() => sendResponse?.({ ok: true }));
      return true;
    }
    return false;
  });


  // --- Auto-run rules on DOM updates (debounced) ---
  (function(){
    try {
      if (typeof collectOrderMeta === 'function' && typeof applyAutoHideRules === 'function' && typeof hideOrders === 'function') {
        function debounce(fn, ms){ let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a), ms); }; }
        const runAuto = () => Promise.resolve()
          .then(()=>collectOrderMeta(document))
          .then(()=>applyAutoHideRules())
          .then(()=>hideOrders(document, { full: false }))
          .catch(()=>{});
        const runAutoDebounced = debounce(runAuto, 350);
        // Observe DOM changes for new/changed orders
        const _autoObserver = new MutationObserver(()=> runAutoDebounced());
        _autoObserver.observe(document.body, { childList: true, subtree: true });
        // Initial kick & pageshow safety
        if (document.visibilityState !== 'hidden') setTimeout(runAutoDebounced, 600);
        window.addEventListener('pageshow', runAutoDebounced, { passive: true });
      }
    } catch(e){ /* noop */ }
  })();

  // ==== Init =================================================================
  function init() {
    hideOrders(document, { full: true });
    observeOrders();
    // kleine Nachläufe für Lazy-Loads
    setTimeout(() => hideOrders(document, { full: true }), 800);
    setTimeout(() => hideOrders(document, { full: true }), 2500);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();