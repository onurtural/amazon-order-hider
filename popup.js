const api = typeof browser !== 'undefined' ? browser : chrome;
// Popup – i18n + Import/Export (privacy) + Notifications + Auto-Hide Rules
// Import-Button-Logik nach Wunsch:
// - Clipboard leer -> Meldung "Zwischenablage ist leer"
// - Clipboard NICHT leer -> Hinweis "Bitte ⌘/Strg+V drücken" + Fokus auf unsichtbares Paste-Ziel
// - Nach CMD/Strg+V: Datei kein JSON -> "Dateiformat ist falsch"; JSON (Datei/Text) -> Import
// Kein Dateipicker.

document.addEventListener('DOMContentLoaded', () => {
  applyI18n();
  loadHiddenOrders();
  loadRules();
  refreshMetaFromPage();

  // orders
  qs('#hide-order')?.addEventListener('click', hideOrder);
  qs('#clear-all')?.addEventListener('click', clearAllOrders);
  qs('#export-list')?.addEventListener('click', () => exportList().catch(() => {}));
  qs('#import-list')?.addEventListener('click', importList);
  qs('#order-number')?.addEventListener('keypress', (e) => { if (e.key === 'Enter') hideOrder(); });

  // rules
  qs('#add-rule')?.addEventListener('click', addRule);

  // Globaler Paste-Handler: reagiert nur auf JSON-Dateien oder eindeutig JSON-Text
  document.addEventListener('paste', handleGlobalPaste, true);
});

// ---- i18n ----
const DOMAIN_LOCALE = {
  'amazon.de': 'de', 'amazon.at': 'de',
  'amazon.com': 'en', 'amazon.co.uk': 'en', 'amazon.ca': 'en', 'amazon.com.au': 'en', 'amazon.sg': 'en',
  'amazon.fr': 'fr', 'amazon.it': 'it', 'amazon.es': 'es', 'amazon.nl': 'nl',
  'amazon.se': 'sv', 'amazon.pl': 'pl', 'amazon.com.tr': 'tr', 'amazon.be': 'nl', 'amazon.com.be': 'nl',
  'amazon.mx': 'es', 'amazon.br': 'pt', 'amazon.ae': 'ar', 'amazon.sa': 'ar', 'amazon.eg': 'ar',
  'amazon.jp': 'ja', 'amazon.in': 'en', 'amazon.cn': 'zh'
};

const I18N = {
  en: {
    title: '🛒 Amazon Order Hider',
    labelOrder: 'Enter order number:',
    placeholder: 'e.g. 123-4567890-1234567',
    btnHide: 'Hide',
    hiddenOrders: 'Hidden orders',
    empty: 'No hidden orders',
    btnShowAll: 'Show all',
    btnImport: 'Import',
    btnExport: 'Export',
    noteEnterOrder: 'Please enter order number',
    noteTooShort: 'Order number too short',
    noteAlready: 'Already hidden',
    noteHidden: 'Order hidden!',
    noteShown: 'Order visible again',
    noteAllShown: 'All orders visible again',
    confirmShowAll: 'Really show all orders again?',
    exportOk: 'List exported!',
    importOk: (n) => `Import successful: ${n} entries`,
    importFail: 'Import failed: invalid file',
    fileErr: 'File read error',
    showBtn: 'Show',
    // rules
    rulesTitle: 'Auto‑Hide rules',
    ruleLabel: 'Hide if product title contains:',
    ruleRegex: 'Use RegExp',
    ruleHelp: 'Example: ^gift.*prime$',
    ruleAdd: 'Add rule',
    rulesList: 'Rules',
    rulesEmpty: 'No rules yet',
    ruleEnabled: 'Enabled',
    ruleTypeContains: 'contains',
    ruleTypeRegex: 'regex',
    ruleDeleted: 'Rule deleted',
    ruleAdded: 'Rule added',
    ruleInvalid: 'Please enter a rule value',
    // neue Meldungen
    clipboardEmpty: 'Clipboard is empty',
    pastePrompt: 'Press ⌘/Ctrl+V to import JSON',
    invalidFormat: 'Import failed: invalid file format'
  ,
    importNote: 'Copy the JSON to your clipboard before importing.'},
  de: {
    title: '🛒 Amazon Bestellungen verbergen',
    labelOrder: 'Bestellnummer eingeben:',
    placeholder: 'z. B. 123-4567890-1234567',
    btnHide: 'Verbergen',
    hiddenOrders: 'Verborgene Bestellungen',
    empty: 'Keine verborgenen Bestellungen',
    btnShowAll: 'Alle anzeigen',
    btnImport: 'Import',
    btnExport: 'Export',
    noteEnterOrder: 'Bitte Bestellnummer eingeben',
    noteTooShort: 'Bestellnummer zu kurz',
    noteAlready: 'Bereits verborgen',
    noteHidden: 'Bestellung verborgen!',
    noteShown: 'Bestellung wieder sichtbar',
    noteAllShown: 'Alle Bestellungen wieder sichtbar',
    confirmShowAll: 'Alle Bestellungen wirklich wieder anzeigen?',
    exportOk: 'Liste exportiert!',
    importOk: (n) => `Import erfolgreich: ${n} Einträge`,
    importFail: 'Import fehlgeschlagen: ungültige Datei',
    fileErr: 'Dateilesefehler',
    showBtn: 'Anzeigen',
    // rules
    rulesTitle: 'Auto‑Hide‑Regeln',
    ruleLabel: 'Ausblenden, wenn Produkttitel enthält:',
    ruleRegex: 'RegExp verwenden',
    ruleHelp: 'Beispiel: ^geschenk.*prime$',
    ruleAdd: 'Regel hinzufügen',
    rulesList: 'Regeln',
    rulesEmpty: 'Noch keine Regeln',
    ruleEnabled: 'Aktiv',
    ruleTypeContains: 'enthält',
    ruleTypeRegex: 'regex',
    ruleDeleted: 'Regel gelöscht',
    ruleAdded: 'Regel hinzugefügt',
    ruleInvalid: 'Bitte einen Regelwert eingeben',
    // neue Meldungen
    clipboardEmpty: 'Zwischenablage ist leer',
    pastePrompt: '⌘/Strg+V drücken = JSON import',
    invalidFormat: 'Import fehlgeschlagen: ungültiges Dateiformat'
  ,
    importNote: 'Vor dem Import die JSON in die Zwischenablage kopieren.'},

  // ===== Ergänzte Sprachen für alle DOMAIN_LOCALE-Einträge =====
  fr: {
  title: '🛒 Masqueur de commandes Amazon',
  labelOrder: 'Saisir le numéro de commande :',
  placeholder: 'ex. 123-4567890-1234567',
  btnHide: 'Masquer',
  hiddenOrders: 'Commandes masquées',
  empty: 'Aucune commande masquée',
  btnShowAll: 'Tout afficher',
  btnImport: 'Importer',
  btnExport: 'Exporter',
  noteEnterOrder: 'Veuillez saisir le numéro de commande',
  noteTooShort: 'Numéro de commande trop court',
  noteAlready: 'Déjà masquée',
  noteHidden: 'Commande masquée !',
  noteShown: 'Commande à nouveau visible',
  noteAllShown: 'Toutes les commandes à nouveau visibles',
  confirmShowAll: 'Afficher toutes les commandes à nouveau ?',
  exportOk: 'Liste exportée !',
  importOk: (n) => `Import réussi : ${n} entrées`,
  importFail: 'Échec de l’import : fichier invalide',
  fileErr: 'Erreur de lecture du fichier',
  showBtn: 'Afficher',
  // Regeln
  rulesTitle: 'Règles de masquage automatique',
  ruleLabel: 'Masquer si le titre du produit contient :',
  ruleRegex: 'Utiliser RegExp',
  ruleHelp: 'Exemple : ^cadeau.*prime$',
  ruleAdd: 'Ajouter une règle',
  rulesList: 'Règles',
  rulesEmpty: 'Aucune règle',
  ruleEnabled: 'Activée',
  ruleTypeContains: 'contient',
  ruleTypeRegex: 'regex',
  ruleDeleted: 'Règle supprimée',
  ruleAdded: 'Règle ajoutée',
  ruleInvalid: 'Veuillez entrer une valeur de règle',
  // neue Keys
  clipboardEmpty: 'Presse-papiers vide',
  pastePrompt: 'Appuyez sur ⌘/Ctrl+V pour importer JSON',
  invalidFormat: 'Format de fichier invalide'
,
    importNote: 'Avant l’import, copiez le JSON dans le presse‑papiers, puis appuyez sur ⌘/Ctrl+V.'},
it: {
  title: '🛒 Nascondi ordini Amazon',
  labelOrder: 'Inserisci numero d’ordine:',
  placeholder: 'es. 123-4567890-1234567',
  btnHide: 'Nascondi',
  hiddenOrders: 'Ordini nascosti',
  empty: 'Nessun ordine nascosto',
  btnShowAll: 'Mostra tutti',
  btnImport: 'Importa',
  btnExport: 'Esporta',
  noteEnterOrder: 'Inserisci il numero d’ordine',
  noteTooShort: 'Numero d’ordine troppo corto',
  noteAlready: 'Già nascosto',
  noteHidden: 'Ordine nascosto!',
  noteShown: 'Ordine di nuovo visibile',
  noteAllShown: 'Tutti gli ordini di nuovo visibili',
  confirmShowAll: 'Mostrare di nuovo tutti gli ordini?',
  exportOk: 'Lista esportata!',
  importOk: (n) => `Import riuscito: ${n} voci`,
  importFail: 'Import non riuscito: file non valido',
  fileErr: 'Errore di lettura del file',
  showBtn: 'Mostra',
  rulesTitle: 'Regole di nascondimento automatiche',
  ruleLabel: 'Nascondi se il titolo del prodotto contiene:',
  ruleRegex: 'Usa RegExp',
  ruleHelp: 'Esempio: ^regalo.*prime$',
  ruleAdd: 'Aggiungi regola',
  rulesList: 'Regole',
  rulesEmpty: 'Nessuna regola',
  ruleEnabled: 'Attiva',
  ruleTypeContains: 'contiene',
  ruleTypeRegex: 'regex',
  ruleDeleted: 'Regola eliminata',
  ruleAdded: 'Regola aggiunta',
  ruleInvalid: 'Inserisci un valore per la regola',
  clipboardEmpty: 'Appunti vuoti',
  pastePrompt: 'Premi ⌘/Ctrl+V per importare JSON',
  invalidFormat: 'Formato file non valido'
,
    importNote: 'Prima di importare, copia il JSON negli appunti e poi premi ⌘/Ctrl+V.'},
es: {
  title: '🛒 Ocultador de pedidos de Amazon',
  labelOrder: 'Introduce el número de pedido:',
  placeholder: 'ej. 123-4567890-1234567',
  btnHide: 'Ocultar',
  hiddenOrders: 'Pedidos ocultos',
  empty: 'No hay pedidos ocultos',
  btnShowAll: 'Mostrar todos',
  btnImport: 'Importar',
  btnExport: 'Exportar',
  noteEnterOrder: 'Introduce el número de pedido',
  noteTooShort: 'Número de pedido demasiado corto',
  noteAlready: 'Ya oculto',
  noteHidden: '¡Pedido oculto!',
  noteShown: 'Pedido visible de nuevo',
  noteAllShown: 'Todos los pedidos visibles de nuevo',
  confirmShowAll: '¿Mostrar todos los pedidos de nuevo?',
  exportOk: 'Lista exportada',
  importOk: (n) => `Importación exitosa: ${n} entradas`,
  importFail: 'Error de importación: archivo no válido',
  fileErr: 'Error de lectura de archivo',
  showBtn: 'Mostrar',
  rulesTitle: 'Reglas de ocultación automática',
  ruleLabel: 'Ocultar si el título del producto contiene:',
  ruleRegex: 'Usar RegExp',
  ruleHelp: 'Ejemplo: ^regalo.*prime$',
  ruleAdd: 'Añadir regla',
  rulesList: 'Reglas',
  rulesEmpty: 'No hay reglas',
  ruleEnabled: 'Activada',
  ruleTypeContains: 'contiene',
  ruleTypeRegex: 'regex',
  ruleDeleted: 'Regla eliminada',
  ruleAdded: 'Regla añadida',
  ruleInvalid: 'Introduce un valor para la regla',
  clipboardEmpty: 'Portapapeles vacío',
  pastePrompt: 'Pulsa ⌘/Ctrl+V para importar JSON',
  invalidFormat: 'Formato de archivo no válido'
,
    importNote: 'Antes de importar, copia el JSON al portapapeles y luego pulsa ⌘/Ctrl+V.'},
nl: {
  title: '🛒 Amazon-bestellingen verbergen',
  labelOrder: 'Voer bestelnummer in:',
  placeholder: 'bijv. 123-4567890-1234567',
  btnHide: 'Verbergen',
  hiddenOrders: 'Verborgen bestellingen',
  empty: 'Geen verborgen bestellingen',
  btnShowAll: 'Alles tonen',
  btnImport: 'Importeren',
  btnExport: 'Exporteren',
  noteEnterOrder: 'Voer een bestelnummer in',
  noteTooShort: 'Bestelnummer te kort',
  noteAlready: 'Al verborgen',
  noteHidden: 'Bestelling verborgen!',
  noteShown: 'Bestelling weer zichtbaar',
  noteAllShown: 'Alle bestellingen weer zichtbaar',
  confirmShowAll: 'Alle bestellingen opnieuw tonen?',
  exportOk: 'Lijst geëxporteerd',
  importOk: (n) => `Import geslaagd: ${n} items`,
  importFail: 'Import mislukt: ongeldig bestand',
  fileErr: 'Fout bij lezen van bestand',
  showBtn: 'Tonen',
  rulesTitle: 'Automatische verbergregels',
  ruleLabel: 'Verberg als de producttitel het volgende bevat:',
  ruleRegex: 'RegExp gebruiken',
  ruleHelp: 'Voorbeeld: ^cadeau.*prime$',
  ruleAdd: 'Regel toevoegen',
  rulesList: 'Regels',
  rulesEmpty: 'Nog geen regels',
  ruleEnabled: 'Ingeschakeld',
  ruleTypeContains: 'bevat',
  ruleTypeRegex: 'regex',
  ruleDeleted: 'Regel verwijderd',
  ruleAdded: 'Regel toegevoegd',
  ruleInvalid: 'Voer een regelwaarde in',
  clipboardEmpty: 'Klembord is leeg',
  pastePrompt: 'Druk op ⌘/Ctrl+V om JSON te importeren',
  invalidFormat: 'Ongeldig bestandsformaat'
,
    importNote: 'Kopieer vóór het importeren de JSON naar je klembord. Druk daarna op ⌘/Ctrl+V.'},
sv: {
  title: '🛒 Dölj Amazon-beställningar',
  labelOrder: 'Ange ordernummer:',
  placeholder: 't.ex. 123-4567890-1234567',
  btnHide: 'Dölj',
  hiddenOrders: 'Dolda beställningar',
  empty: 'Inga dolda beställningar',
  btnShowAll: 'Visa alla',
  btnImport: 'Importera',
  btnExport: 'Exportera',
  noteEnterOrder: 'Ange ordernummer',
  noteTooShort: 'Ordernumret är för kort',
  noteAlready: 'Redan dold',
  noteHidden: 'Beställning dold!',
  noteShown: 'Beställning synlig igen',
  noteAllShown: 'Alla beställningar synliga igen',
  confirmShowAll: 'Visa alla beställningar igen?',
  exportOk: 'Lista exporterad',
  importOk: (n) => `Import lyckades: ${n} poster`,
  importFail: 'Import misslyckades: ogiltig fil',
  fileErr: 'Fel vid filläsning',
  showBtn: 'Visa',
  rulesTitle: 'Regler för automatisk döljning',
  ruleLabel: 'Dölj om produkttiteln innehåller:',
  ruleRegex: 'Använd RegExp',
  ruleHelp: 'Exempel: ^present.*prime$',
  ruleAdd: 'Lägg till regel',
  rulesList: 'Regler',
  rulesEmpty: 'Inga regler',
  ruleEnabled: 'Aktiverad',
  ruleTypeContains: 'innehåller',
  ruleTypeRegex: 'regex',
  ruleDeleted: 'Regel borttagen',
  ruleAdded: 'Regel tillagd',
  ruleInvalid: 'Ange ett regelvärde',
  clipboardEmpty: 'Urklipp är tomt',
  pastePrompt: 'Tryck ⌘/Ctrl+V för att importera JSON',
  invalidFormat: 'Ogiltigt filformat'
,
    importNote: 'Kopiera JSON till urklipp innan import. Tryck sedan ⌘/Ctrl+V.'},
pl: {
  title: '🛒 Ukrywanie zamówień Amazon',
  labelOrder: 'Wpisz numer zamówienia:',
  placeholder: 'np. 123-4567890-1234567',
  btnHide: 'Ukryj',
  hiddenOrders: 'Ukryte zamówienia',
  empty: 'Brak ukrytych zamówień',
  btnShowAll: 'Pokaż wszystkie',
  btnImport: 'Importuj',
  btnExport: 'Eksportuj',
  noteEnterOrder: 'Wpisz numer zamówienia',
  noteTooShort: 'Numer zamówienia jest za krótki',
  noteAlready: 'Już ukryte',
  noteHidden: 'Zamówienie ukryte!',
  noteShown: 'Zamówienie znów widoczne',
  noteAllShown: 'Wszystkie zamówienia znów widoczne',
  confirmShowAll: 'Pokazać wszystkie zamówienia ponownie?',
  exportOk: 'Listę wyeksportowano',
  importOk: (n) => `Import zakończony: ${n} pozycji`,
  importFail: 'Nieudany import: nieprawidłowy plik',
  fileErr: 'Błąd odczytu pliku',
  showBtn: 'Pokaż',
  rulesTitle: 'Reguły automatycznego ukrywania',
  ruleLabel: 'Ukryj, jeśli tytuł produktu zawiera:',
  ruleRegex: 'Użyj RegExp',
  ruleHelp: 'Przykład: ^prezent.*prime$',
  ruleAdd: 'Dodaj regułę',
  rulesList: 'Reguły',
  rulesEmpty: 'Brak reguł',
  ruleEnabled: 'Włączona',
  ruleTypeContains: 'zawiera',
  ruleTypeRegex: 'regex',
  ruleDeleted: 'Reguła usunięta',
  ruleAdded: 'Reguła dodana',
  ruleInvalid: 'Wpisz wartość reguły',
  clipboardEmpty: 'Schowek jest pusty',
  pastePrompt: 'Naciśnij ⌘/Ctrl+V, aby zaimportować JSON',
  invalidFormat: 'Nieprawidłowy format pliku'
,
    importNote: 'Przed importem skopiuj JSON do schowka. Następnie naciśnij ⌘/Ctrl+V.'},
tr: {
  title: '🛒 Amazon Sipariş Gizleyici',
  labelOrder: 'Sipariş numarasını girin:',
  placeholder: 'örn. 123-4567890-1234567',
  btnHide: 'Gizle',
  hiddenOrders: 'Gizlenen siparişler',
  empty: 'Gizlenen sipariş yok',
  btnShowAll: 'Tümünü göster',
  btnImport: 'İçe aktar',
  btnExport: 'Dışa aktar',
  noteEnterOrder: 'Lütfen sipariş numarası girin',
  noteTooShort: 'Sipariş numarası çok kısa',
  noteAlready: 'Zaten gizli',
  noteHidden: 'Sipariş gizlendi!',
  noteShown: 'Sipariş yeniden görünür',
  noteAllShown: 'Tüm siparişler yeniden görünür',
  confirmShowAll: 'Tüm siparişler yeniden gösterilsin mi?',
  exportOk: 'Liste dışa aktarıldı',
  importOk: (n) => `İçe aktarma başarılı: ${n} kayıt`,
  importFail: 'İçe aktarma başarısız: geçersiz dosya',
  fileErr: 'Dosya okuma hatası',
  showBtn: 'Göster',
  rulesTitle: 'Otomatik gizleme kuralları',
  ruleLabel: 'Ürün başlığı şunları içeriyorsa gizle:',
  ruleRegex: 'RegExp kullan',
  ruleHelp: 'Örnek: ^hediye.*prime$',
  ruleAdd: 'Kural ekle',
  rulesList: 'Kurallar',
  rulesEmpty: 'Henüz kural yok',
  ruleEnabled: 'Etkin',
  ruleTypeContains: 'içerir',
  ruleTypeRegex: 'regex',
  ruleDeleted: 'Kural silindi',
  ruleAdded: 'Kural eklendi',
  ruleInvalid: 'Lütfen bir kural değeri girin',
  clipboardEmpty: 'Pano boş',
  pastePrompt: 'JSON içe aktarmak için ⌘/Ctrl+V\'ye basın',
  invalidFormat: 'Dosya biçimi geçersiz'
,
    importNote: 'İçe aktarmadan önce JSON’u panoya kopyalayın. Ardından ⌘/Ctrl+V’ye basın.'},
pt: {
  title: '🛒 Ocultar pedidos da Amazon',
  labelOrder: 'Insira o número do pedido:',
  placeholder: 'ex. 123-4567890-1234567',
  btnHide: 'Ocultar',
  hiddenOrders: 'Pedidos ocultos',
  empty: 'Nenhum pedido oculto',
  btnShowAll: 'Mostrar todos',
  btnImport: 'Importar',
  btnExport: 'Exportar',
  noteEnterOrder: 'Insira o número do pedido',
  noteTooShort: 'Número do pedido muito curto',
  noteAlready: 'Já oculto',
  noteHidden: 'Pedido ocultado!',
  noteShown: 'Pedido visível novamente',
  noteAllShown: 'Todos os pedidos visíveis novamente',
  confirmShowAll: 'Mostrar todos os pedidos novamente?',
  exportOk: 'Lista exportada',
  importOk: (n) => `Importação concluída: ${n} itens`,
  importFail: 'Falha na importação: arquivo inválido',
  fileErr: 'Erro ao ler o arquivo',
  showBtn: 'Mostrar',
  rulesTitle: 'Regras de ocultação automática',
  ruleLabel: 'Ocultar se o título do produto contiver:',
  ruleRegex: 'Usar RegExp',
  ruleHelp: 'Exemplo: ^presente.*prime$',
  ruleAdd: 'Adicionar regra',
  rulesList: 'Regras',
  rulesEmpty: 'Nenhuma regra',
  ruleEnabled: 'Ativado',
  ruleTypeContains: 'contém',
  ruleTypeRegex: 'regex',
  ruleDeleted: 'Regra removida',
  ruleAdded: 'Regra adicionada',
  ruleInvalid: 'Insira um valor de regra',
  clipboardEmpty: 'Área de transferência vazia',
  pastePrompt: 'Pressione ⌘/Ctrl+V para importar JSON',
  invalidFormat: 'Formato de arquivo inválido'
,
    importNote: 'Antes de importar, copie o JSON para a área de transferência. Depois pressione ⌘/Ctrl+V.'},
ar: {
  title: '🛒 إخفاء طلبات أمازون',
  labelOrder: 'أدخل رقم الطلب:',
  placeholder: 'مثال: 123-4567890-1234567',
  btnHide: 'إخفاء',
  hiddenOrders: 'الطلبات المخفية',
  empty: 'لا توجد طلبات مخفية',
  btnShowAll: 'عرض الكل',
  btnImport: 'استيراد',
  btnExport: 'تصدير',
  noteEnterOrder: 'يرجى إدخال رقم الطلب',
  noteTooShort: 'رقم الطلب قصير جداً',
  noteAlready: 'مُخفى مسبقاً',
  noteHidden: 'تم إخفاء الطلب!',
  noteShown: 'أصبح الطلب مرئياً مجدداً',
  noteAllShown: 'جميع الطلبات مرئية مجدداً',
  confirmShowAll: 'عرض جميع الطلبات مجدداً؟',
  exportOk: 'تم تصدير القائمة',
  importOk: (n) => `تم الاستيراد بنجاح: ${n} عنصرًا`,
  importFail: 'فشل الاستيراد: ملف غير صالح',
  fileErr: 'خطأ في قراءة الملف',
  showBtn: 'عرض',
  rulesTitle: 'قواعد الإخفاء التلقائي',
  ruleLabel: 'أخفِ إذا كان عنوان المنتج يحتوي على:',
  ruleRegex: 'استخدام RegExp',
  ruleHelp: 'مثال: ^هدية.*prime$',
  ruleAdd: 'إضافة قاعدة',
  rulesList: 'القواعد',
  rulesEmpty: 'لا توجد قواعد',
  ruleEnabled: 'مفعّل',
  ruleTypeContains: 'يحتوي',
  ruleTypeRegex: 'regex',
  ruleDeleted: 'تم حذف القاعدة',
  ruleAdded: 'تمت إضافة القاعدة',
  ruleInvalid: 'يرجى إدخال قيمة للقاعدة',
  clipboardEmpty: 'الحافظة فارغة',
  pastePrompt: 'اضغط ⌘/Ctrl+V لاستيراد JSON',
  invalidFormat: 'تنسيق ملف غير صالح'
,
    importNote: 'قبل الاستيراد، انسخ JSON إلى الحافظة ثم اضغط ⌘/Ctrl+V.'},
ja: {
  title: '🛒 Amazon 注文を非表示',
  labelOrder: '注文番号を入力:',
  placeholder: '例: 123-4567890-1234567',
  btnHide: '非表示',
  hiddenOrders: '非表示の注文',
  empty: '非表示の注文はありません',
  btnShowAll: 'すべて表示',
  btnImport: 'インポート',
  btnExport: 'エクスポート',
  noteEnterOrder: '注文番号を入力してください',
  noteTooShort: '注文番号が短すぎます',
  noteAlready: 'すでに非表示です',
  noteHidden: '注文を非表示にしました！',
  noteShown: '注文を再表示しました',
  noteAllShown: 'すべての注文を再表示しました',
  confirmShowAll: 'すべての注文を再表示しますか？',
  exportOk: 'リストをエクスポートしました',
  importOk: (n) => `インポートに成功: ${n} 件`,
  importFail: 'インポートに失敗: 無効なファイル',
  fileErr: 'ファイルの読み取りエラー',
  showBtn: '表示',
  rulesTitle: '自動非表示ルール',
  ruleLabel: '商品タイトルに次が含まれる場合は非表示:',
  ruleRegex: 'RegExp を使用',
  ruleHelp: '例: ^gift.*prime$',
  ruleAdd: 'ルールを追加',
  rulesList: 'ルール',
  rulesEmpty: 'ルールはありません',
  ruleEnabled: '有効',
  ruleTypeContains: '含む',
  ruleTypeRegex: 'regex',
  ruleDeleted: 'ルールを削除しました',
  ruleAdded: 'ルールを追加しました',
  ruleInvalid: 'ルールの値を入力してください',
  clipboardEmpty: 'クリップボードは空です',
  pastePrompt: 'JSON をインポートするには ⌘/Ctrl+V を押してください',
  invalidFormat: '無効なファイル形式です'
,
    importNote: 'インポート前に JSON をクリップボードにコピーし、その後 ⌘/Ctrl+V を押してください。'},
zh: {
  title: '🛒 隐藏亚马逊订单',
  labelOrder: '输入订单号：',
  placeholder: '例如 123-4567890-1234567',
  btnHide: '隐藏',
  hiddenOrders: '已隐藏的订单',
  empty: '暂无隐藏订单',
  btnShowAll: '显示全部',
  btnImport: '导入',
  btnExport: '导出',
  noteEnterOrder: '请输入订单号',
  noteTooShort: '订单号过短',
  noteAlready: '已隐藏',
  noteHidden: '订单已隐藏！',
  noteShown: '订单已重新可见',
  noteAllShown: '所有订单已重新可见',
  confirmShowAll: '确定重新显示所有订单？',
  exportOk: '列表已导出',
  importOk: (n) => `导入成功：${n} 条`,
  importFail: '导入失败：无效文件',
  fileErr: '文件读取错误',
  showBtn: '显示',
  rulesTitle: '自动隐藏规则',
  ruleLabel: '当商品标题包含以下内容时隐藏：',
  ruleRegex: '使用 RegExp',
  ruleHelp: '示例：^gift.*prime$',
  ruleAdd: '添加规则',
  rulesList: '规则',
  rulesEmpty: '暂无规则',
  ruleEnabled: '已启用',
  ruleTypeContains: '包含',
  ruleTypeRegex: '正则',
  ruleDeleted: '规则已删除',
  ruleAdded: '规则已添加',
  ruleInvalid: '请输入规则值',
  clipboardEmpty: '剪贴板为空',
  pastePrompt: '按 ⌘/Ctrl+V 以导入 JSON',
  invalidFormat: '文件格式无效'
,
    importNote: '导入前先将 JSON 复制到剪贴板，然后按 ⌘/Ctrl+V。'}
};

let L = I18N.en;
const qs = (sel) => document.querySelector(sel);
function I18NText(key, ...args) { const v = L[key]; return typeof v === 'function' ? v(...args) : v; }

function detectLocaleFromActiveTab() {
  return api.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
    const url = tabs[0]?.url || '';
    try {
      const host = new URL(url).hostname;
      const key = Object.keys(DOMAIN_LOCALE).find(d => host.endsWith(d));
      return DOMAIN_LOCALE[key] || null;
    } catch { return null; }
  });
}

async function applyI18n() {
  const loc = await detectLocaleFromActiveTab();
  const nav = (navigator.language || 'en').slice(0,2).toLowerCase();
  const lang = (loc && I18N[loc]) ? loc : (I18N[nav] ? nav : 'en');
  L = I18N[lang];

  qs('#i18n-title').textContent = L.title;
  qs('#i18n-label-order').textContent = L.labelOrder;
  qs('#order-number').placeholder = L.placeholder;
  qs('#i18n-btn-hide').textContent = L.btnHide;
  qs('#i18n-hidden-orders').textContent = L.hiddenOrders;
  qs('#i18n-empty').textContent = L.empty;
  qs('#i18n-btn-showall').textContent = L.btnShowAll;
  qs('#i18n-btn-import').textContent = L.btnImport;
  qs('#i18n-btn-export').textContent = L.btnExport;

  // import note below the three buttons (no title)
  const noteEl = document.getElementById('i18n-import-note');
  if (noteEl && L.importNote) noteEl.textContent = L.importNote;


  // rules (falls UI vorhanden)
  const el = (id) => qs(id) || { textContent: '' };
  el('#i18n-rules-title').textContent = L.rulesTitle || 'Auto‑Hide rules';
  el('#i18n-rule-label').textContent = L.ruleLabel || 'Hide if product title contains:';
  el('#i18n-rule-regex').textContent = L.ruleRegex || 'Use RegExp';
  el('#i18n-rule-help').textContent = L.ruleHelp || 'Example: ^gift.*prime$';
  el('#i18n-rule-add').textContent = L.ruleAdd || 'Add rule';
  el('#i18n-rules-list').textContent = L.rulesList || 'Rules';
  el('#i18n-rules-empty').textContent = L.rulesEmpty || 'No rules yet';
}

// ---- Orders ----
function loadHiddenOrders() {
  api.storage.local.get(['hiddenOrders', 'hiddenMeta']).then((res) => {
    const hiddenOrders = res.hiddenOrders || [];
    const hiddenMeta = res.hiddenMeta || {};
    displayHiddenOrders(hiddenOrders, hiddenMeta);
    api.runtime.sendMessage({ action: 'updateBadge' }).catch(() => {});
  });
}

function displayHiddenOrders(orders, meta) {
  const list = document.getElementById('hidden-orders-list');
  list.innerHTML = '';
  if (!orders.length) {
    const p = document.createElement('p');
    p.className = 'empty-state';
    p.textContent = L.empty;
    list.appendChild(p);
    return;
  }
  orders.forEach((orderNo) => {
    const title = meta?.[orderNo]?.title || '';
    const display = title ? truncate(title, 70) : orderNo;

    const row = document.createElement('div');
    row.className = 'order-item';
    row.innerHTML = `
      <div class="order-title">${escapeHtml(display)}</div>
      <button class="remove-btn" data-order="${escapeHtml(orderNo)}">${escapeHtml(L.showBtn)}</button>
      ${title ? `<div class="order-sub">${escapeHtml(orderNo)}</div>` : ''}
    `;
    list.appendChild(row);
  });
  list.querySelectorAll('.remove-btn').forEach((btn) => {
    btn.addEventListener('click', function () { removeOrder(this.getAttribute('data-order')); });
  });
}

function refreshMetaFromPage() {
  api.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
    const tab = tabs[0];
    if (!tab) return;
    api.tabs.sendMessage(tab.id, { action: 'collectOrderMeta' }).catch(() => {});
    setTimeout(() => {
      api.tabs.sendMessage(tab.id, { action: 'applyAutoRules' }).catch(() => {});
      loadHiddenOrders();
    }, 500);
  });
}

function hideOrder() {
  const input = document.getElementById('order-number');
  const orderNumber = input.value.trim();
  if (!orderNumber) return showNotification(L.noteEnterOrder, 'error');
  if (orderNumber.length < 5) return showNotification(L.noteTooShort, 'error');

  api.storage.local.get('hiddenOrders').then((res) => {
    const hiddenOrders = res.hiddenOrders || [];
    if (hiddenOrders.includes(orderNumber)) return showNotification(L.noteAlready, 'warning');

    hiddenOrders.push(orderNumber);
    api.storage.local.set({ hiddenOrders }).then(() => {
      input.value = '';
      loadHiddenOrders();
      showNotification(L.noteHidden, 'success');

      api.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
        const tab = tabs[0]; if (!tab) return;
        api.tabs.sendMessage(tab.id, { action: 'updateHiddenOrders' }).catch(() => {});
        api.tabs.sendMessage(tab.id, { action: 'collectOrderMeta' }).catch(() => {});
        setTimeout(() => {
          api.tabs.sendMessage(tab.id, { action: 'applyAutoRules' }).catch(() => {});
          loadHiddenOrders();
        }, 500);
      });
    });
  });
}

function removeOrder(orderNumber) {
  api.storage.local.get(['hiddenOrders']).then((res) => {
    let hiddenOrders = res.hiddenOrders || [];
    hiddenOrders = hiddenOrders.filter((o) => o !== orderNumber);
    api.storage.local.set({ hiddenOrders }).then(async () => {
      await pruneHiddenMeta().catch(() => {});
      loadHiddenOrders();
      showNotification(L.noteShown, 'success');

      api.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
        const tab = tabs[0]; if (!tab) return;
        api.tabs.sendMessage(tab.id, { action: 'updateHiddenOrders' }).catch(() => {});
        setTimeout(loadHiddenOrders, 300);
      });
    });
  });
}

function clearAllOrders() {
  if (!confirm(L.confirmShowAll)) return;
  api.storage.local.set({ hiddenOrders: [] }).then(async () => {
    await api.storage.local.set({ hiddenMeta: {} }).catch(() => {}); // Privacy: Metadaten leeren
    loadHiddenOrders();
    showNotification(L.noteAllShown, 'success');
    api.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
      const tab = tabs[0]; if (!tab) return;
      api.tabs.sendMessage(tab.id, { action: 'updateHiddenOrders' }).catch(() => {});
      setTimeout(loadHiddenOrders, 300);
    });
  });
}

// --- Helper: nur Metadaten für aktuell verborgene Bestellungen behalten ---
async function pruneHiddenMeta() {
  const { hiddenOrders = [], hiddenMeta = {} } = await api.storage.local.get(['hiddenOrders', 'hiddenMeta']);
  if (!hiddenOrders.length) {
    if (Object.keys(hiddenMeta).length) {
      await api.storage.local.set({ hiddenMeta: {} });
    }
    return {};
  }
  const set = new Set(hiddenOrders);
  const filtered = {};
  for (const [orderNo, meta] of Object.entries(hiddenMeta)) {
    if (set.has(orderNo)) filtered[orderNo] = meta;
  }
  if (Object.keys(filtered).length !== Object.keys(hiddenMeta).length) {
    await api.storage.local.set({ hiddenMeta: filtered });
  }
  return filtered;
}

// ---- Export (Privacy: nur Meta der versteckten Bestellungen) ----
async function exportList() {
  const filteredMeta = await pruneHiddenMeta();
  const { hiddenOrders = [], autoRules = [] } = await api.storage.local.get(['hiddenOrders', 'autoRules']);

  const exportData = {
    exportDate: new Date().toISOString(),
    hiddenOrders: hiddenOrders || [],
    hiddenMeta: filteredMeta || {},
    autoRules: autoRules || []
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `amazon-hidden-orders-${Date.now()}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
  showNotification(L.exportOk, 'success');
}

// ======================= Import – nur Zwischenablage ========================

// Klick auf "Import": Wenn Clipboard leer -> Meldung leer,
// sonst -> Prompt "Bitte ⌘/Strg+V drücken" und Fokus auf verstecktes Paste-Ziel.
async function importList() {
  try {
    const hasItems = await clipboardHasAnyData();
    if (!hasItems) {
      showNotification(L.clipboardEmpty || 'Clipboard is empty', 'warning');
      return;
    }
    // Clipboard hat etwas -> Nutzer soll (wie gewünscht) CMD/Strg+V drücken
    showNotification(L.pastePrompt || 'Press ⌘/Ctrl+V to paste JSON…', 'warning');
    focusHiddenPasteTarget();
  } catch {
    // Wenn wir gar nicht prüfen können, verhalten wir uns wie "nicht leer" -> Prompt
    showNotification(L.pastePrompt || 'Press ⌘/Ctrl+V to paste JSON…', 'warning');
    focusHiddenPasteTarget();
  }
}

// Prüft, ob prinzipiell etwas in der Zwischenablage liegt (Blob oder Text)
async function clipboardHasAnyData() {
  // Versuch 1: ClipboardItem (kann auch bei Dateikopie Items liefern)
  if (navigator.clipboard?.read) {
    try {
      const items = await navigator.clipboard.read();
      if (Array.isArray(items) && items.length > 0) return true;
    } catch {/* still try text */}
  }
  // Versuch 2: Text
  if (navigator.clipboard?.readText) {
    try {
      const txt = await navigator.clipboard.readText();
      if (txt && txt.trim().length > 0) return true;
    } catch {/* ignore */}
  }
  return false;
}

// Globaler Paste-Handler: Datei-JSON oder JSON-Text importieren.
// - Datei vorhanden, aber NICHT JSON -> "Dateiformat ist falsch"
async function handleGlobalPaste(e) {
  try {
    const dt = e.clipboardData;
    if (!dt) return;

    // 1) Dateien?
    if (dt.files && dt.files.length) {
      const jsonFile = pickJsonFile(dt.files);
      if (jsonFile) {
        const text = await jsonFile.text();
        const data = parseJsonRelaxed(text);
        await processImportedData(data);
        e.preventDefault();
        return;
      } else {
        // Datei vorhanden, aber nicht JSON
        showNotification(L.invalidFormat || 'File format is invalid', 'error');
        e.preventDefault();
        return;
      }
    }

    // 2) Items (manche Browser liefern Dateien hier)
    const items = dt.items ? Array.from(dt.items) : [];
    const fileItems = items.filter(it => it.kind === 'file');
    if (fileItems.length) {
      // Gibt es eine JSON-Datei unter den Items?
      for (const it of fileItems) {
        const f = it.getAsFile();
        if (!f) continue;
        const jf = pickJsonFile([f]);
        if (jf) {
          const text = await jf.text();
          const data = parseJsonRelaxed(text);
          await processImportedData(data);
          e.preventDefault();
          return;
        }
      }
      // Nur Dateien, aber keine JSON-Datei
      showNotification(L.invalidFormat || 'File format is invalid', 'error');
      e.preventDefault();
      return;
    }

    // 3) Reiner Text?
    const txt = dt.getData('text/plain') || '';
    if (looksLikeJson(txt)) {
      try {
        const data = parseJsonRelaxed(txt);
        await processImportedData(data);
        e.preventDefault();
        return;
      } catch {
        showNotification(L.invalidFormat || 'File format is invalid', 'error');
        e.preventDefault();
        return;
      }
    }
    // Kein JSON -> normalen Paste nicht stören
  } catch (err) {
    console.error('paste import failed:', err);
    showNotification(L.importFail || 'Import failed: invalid file', 'error');
  }
}

// Unsichtbares, fokusierbares Ziel für CMD/Strg+V (kein Overlay)
function focusHiddenPasteTarget() {
  let el = document.getElementById('paste-capture');
  if (!el) {
    el = document.createElement('div');
    el.id = 'paste-capture';
    el.setAttribute('contenteditable', 'true');
    el.style.cssText = 'position:absolute;left:-9999px;top:0;width:1px;height:1px;opacity:0;pointer-events:none;';
    document.body.appendChild(el);
  }
  try { el.focus({ preventScroll: true }); } catch {}
}

// Datei-Erkennung
function pickJsonFile(fileList) {
  const arr = Array.from(fileList || []);
  return arr.find(f =>
    f && (
      f.type === 'application/json' ||
      f.type === 'text/json' ||
      f.type === 'application/x-json' ||
      /\.json$/i.test(f.name || '')
    )
  ) || null;
}

// ======================= Import-Pipeline ====================================
async function processImportedData(data) {
  // ---- Eingabedaten normalisieren ----
  let importedOrders = [];
  let importedMeta = {};
  let importedRules = [];

  if (Array.isArray(data)) {
    importedOrders = data;
  } else if (data && typeof data === 'object') {
    if (Array.isArray(data.hiddenOrders)) importedOrders = data.hiddenOrders;
    else if (Array.isArray(data.orders)) importedOrders = data.orders; // Fallback
    if (data.hiddenMeta && typeof data.hiddenMeta === 'object') importedMeta = data.hiddenMeta;
    if (Array.isArray(data.autoRules)) importedRules = data.autoRules;
  } else {
    throw new Error('Invalid format: root must be array or object');
  }

  importedOrders = (importedOrders || [])
    .filter(x => typeof x === 'string')
    .map(x => x.trim())
    .filter(Boolean);

  // ---- Aktuellen Speicher lesen ----
  const { hiddenOrders: curOrders = [], hiddenMeta: curMeta = {}, autoRules: curRules = [] } =
    await api.storage.local.get(['hiddenOrders','hiddenMeta','autoRules']);

  // ---- Mergen ----
  const mergedOrders = Array.from(new Set([...curOrders, ...importedOrders]));
  const orderSet = new Set(mergedOrders);

  // Metadaten nur für Bestellungen behalten, die auch in mergedOrders existieren
  const cleanedImportedMeta = {};
  for (const [orderNo, meta] of Object.entries(importedMeta || {})) {
    if (orderSet.has(orderNo) && meta && typeof meta === 'object') cleanedImportedMeta[orderNo] = meta;
  }
  const cleanedCurrentMeta = {};
  for (const [orderNo, meta] of Object.entries(curMeta || {})) {
    if (orderSet.has(orderNo)) cleanedCurrentMeta[orderNo] = meta;
  }
  const mergedMeta = { ...cleanedCurrentMeta, ...cleanedImportedMeta };

  const mergedRules = [...curRules, ...(importedRules || [])];

  await api.storage.local.set({
    hiddenOrders: mergedOrders,
    hiddenMeta: mergedMeta,
    autoRules: mergedRules
  });

  // ---- UI + Seite aktualisieren ----
  loadHiddenOrders();
  showNotification(I18NText('importOk', importedOrders.length), 'success');

  try {
    const [{ id: tabId } = {}] = await api.tabs.query({ active: true, currentWindow: true });
    if (tabId) {
      await api.tabs.sendMessage(tabId, { action: 'updateHiddenOrders' });
      await api.tabs.sendMessage(tabId, { action: 'collectOrderMeta' });
      setTimeout(() => api.tabs.sendMessage(tabId, { action: 'applyAutoRules' }).catch(() => {}), 300);
    }
  } catch (e) {
    console.debug('Post-import tab message skipped:', e?.message);
  }
}

// ======================= Rules UI ===========================================
function loadRules() {
  api.storage.local.get('autoRules').then((res) => {
    const rules = res.autoRules || [];
    renderRules(rules);
  });
}

function renderRules(rules) {
  const wrap = document.getElementById('rules-list');
  if (!wrap) return; // falls ältere popup.html ohne Rules
  wrap.innerHTML = '';
  if (!rules.length) {
    const p = document.createElement('p');
    p.className = 'empty-state';
    p.textContent = L.rulesEmpty || 'No rules yet';
    wrap.appendChild(p);
    return;
  }
  rules.forEach((r, idx) => {
    const row = document.createElement('div');
    row.className = 'order-item';
    row.innerHTML = `
      <div class="order-title">
        <strong>[${escapeHtml(r.type === 'regex' ? (L.ruleTypeRegex || 'regex') : (L.ruleTypeContains || 'contains'))}]</strong>
        <span style="margin-left:6px">${escapeHtml(r.pattern)}</span>
      </div>
      <div style="display:flex;gap:8px;align-items:center">
        <label style="display:flex;align-items:center;gap:6px;font-size:12px;color:#495057">
          <input type="checkbox" data-idx="${idx}" class="rule-toggle" ${r.enabled ? 'checked' : ''} />
          ${escapeHtml(L.ruleEnabled || 'Enabled')}
        </label>
        <button class="remove-btn" data-idx="${idx}">✖</button>
      </div>
    `;
    wrap.appendChild(row);
  });

  wrap.querySelectorAll('.rule-toggle').forEach(el => {
    el.addEventListener('change', (e) => toggleRule(Number(e.target.getAttribute('data-idx')), e.target.checked));
  });
  wrap.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', () => deleteRule(Number(btn.getAttribute('data-idx'))));
  });
}

function addRule() {
  const txt = document.getElementById('rule-text');
  const pat = txt?.value?.trim?.() || '';
  if (!pat) return showNotification(L.ruleInvalid || 'Please enter a rule value', 'error');
  const regex = (document.getElementById('rule-regex')?.checked) || false;
  const rule = { id: Date.now(), enabled: true, type: regex ? 'regex' : 'contains', pattern: pat };

  api.storage.local.get('autoRules').then((res) => {
    const rules = res.autoRules || [];
    rules.push(rule);
    api.storage.local.set({ autoRules: rules }).then(() => {
      if (txt) txt.value = '';
      loadRules();
      showNotification(L.ruleAdded || 'Rule added', 'success');
      api.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
        const tab = tabs[0]; if (!tab) return;
        api.tabs.sendMessage(tab.id, { action: 'applyAutoRules' }).catch(() => {});
      });
    });
  });
}

function toggleRule(idx, enabled) {
  api.storage.local.get('autoRules').then((res) => {
    const rules = res.autoRules || [];
    if (!rules[idx]) return;
    rules[idx].enabled = !!enabled;
    api.storage.local.set({ autoRules: rules }).then(() => {
      api.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
        const tab = tabs[0]; if (!tab) return;
        api.tabs.sendMessage(tab.id, { action: 'applyAutoRules' }).catch(() => {});
      });
    });
  });
}

function deleteRule(idx) {
  api.storage.local.get('autoRules').then((res) => {
    const rules = res.autoRules || [];
    rules.splice(idx, 1);
    api.storage.local.set({ autoRules: rules }).then(() => {
      loadRules();
      showNotification(L.ruleDeleted || 'Rule deleted', 'success');
      api.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
        const tab = tabs[0]; if (!tab) return;
        api.tabs.sendMessage(tab.id, { action: 'applyAutoRules' }).catch(() => {});
      });
    });
  });
}

// ---- Utils ----
const truncate = (s, n) => (s.length > n ? s.slice(0, n - 1) + '…' : s);
function escapeHtml(text) { const div = document.createElement('div'); div.textContent = text; return div.innerHTML; }
function showNotification(message, type) {
  const existing = document.querySelector('.notification'); if (existing) existing.remove();
  const el = document.createElement('div');
  el.className = `notification ${type}`;
  el.textContent = message;
  el.style.cssText = `position: fixed; top: 10px; right: 10px; padding: 10px 15px; border-radius: 6px; color: white; font-size: 14px; z-index: 1000; animation: slideIn 0.3s ease;`;
  const colors = { success: '#28a745', error: '#dc3545', warning: '#ffc107' };
  el.style.background = colors[type] || colors.success;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 5000);
}
const style = document.createElement('style');
style.textContent = `@keyframes slideIn { from{transform:translateX(100%);opacity:0;} to{transform:translateX(0);opacity:1;} }`;
document.head.appendChild(style);

// JSON tolerant parsen (BOM, Kommentare, trailing commas)
function parseJsonRelaxed(text) {
  try { return JSON.parse(text); } catch {}
  const cleaned = String(text || '')
    .replace(/^\uFEFF/, '')                       // BOM
    .replace(/\/\*[\s\S]*?\*\/|\/\/[^\n\r]*/g, '')// Kommentare
    .replace(/,\s*([}\]])/g, '$1')                // trailing comma
    .trim();
  return JSON.parse(cleaned);
}
function looksLikeJson(s) {
  if (!s) return false;
  const t = String(s).trim();
  return t.startsWith('{') || t.startsWith('[');
}