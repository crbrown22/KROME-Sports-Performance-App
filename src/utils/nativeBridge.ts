/**
 * Native Bridge Utility
 * Provides a unified interface for native device features.
 * Currently supports Haptics (vibrations) using the Web Vibration API.
 * Ready for Capacitor integration.
 */

export const haptics = {
  /**
   * Light impact vibration
   */
  light: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  },

  /**
   * Medium impact vibration
   */
  medium: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(20);
    }
  },

  /**
   * Heavy impact vibration
   */
  heavy: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(40);
    }
  },

  /**
   * Success notification pattern
   */
  success: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([10, 30, 10]);
    }
  },

  /**
   * Error/Warning notification pattern
   */
  error: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([50, 50, 50]);
    }
  },

  /**
   * Selection change pattern
   */
  selection: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(5);
    }
  }
};

/**
 * Share content using the native share sheet
 */
export const share = async (title: string, text: string, url: string) => {
  if (navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return true;
    } catch (error) {
      console.error('Error sharing:', error);
      return false;
    }
  } else {
    // Fallback: Copy to clipboard
    try {
      await navigator.clipboard.writeText(`${title}\n${text}\n${url}`);
      return 'copied';
    } catch (error) {
      console.error('Clipboard error:', error);
      return false;
    }
  }
};
