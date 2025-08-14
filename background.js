// MV3 Background – Service Worker Version
// Funktioniert in Chrome & Firefox

const api = typeof browser !== 'undefined' ? browser : chrome;

api.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    api.storage.local.set({
      hiddenOrders: [],
      hiddenMeta: {}, // orderNumber -> { title, updatedAt }
      settings: { autoHide: false, notifications: true }
    });
  }
  updateBadge();
});

api.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getHiddenOrders') {
    api.storage.local.get(['hiddenOrders', 'hiddenMeta']).then((res) =>
      sendResponse({
        hiddenOrders: res.hiddenOrders || [],
        hiddenMeta: res.hiddenMeta || {}
      })
    );
    return true; // async sendResponse
  }
  if (request.action === 'updateBadge') updateBadge();
});

api.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.hiddenOrders) updateBadge();
});

function updateBadge() {
  api.storage.local.get('hiddenOrders').then((res) => {
    const count = (res.hiddenOrders || []).length;
    api.action.setBadgeText({ text: count ? String(count) : '' });
    if (count) api.action.setBadgeBackgroundColor({ color: '#764ba2' });
  });
}