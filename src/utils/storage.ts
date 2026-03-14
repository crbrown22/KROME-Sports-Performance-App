export const safeStorage = {
  getItem: (key: string) => {
    try { return window.localStorage.getItem(key); } catch (e) { return null; }
  },
  setItem: (key: string, value: string) => {
    try { window.localStorage.setItem(key, value); } catch (e) { console.warn('localStorage not available'); }
  },
  removeItem: (key: string) => {
    try { window.localStorage.removeItem(key); } catch (e) { console.warn('localStorage not available'); }
  }
};
