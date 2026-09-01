/** Mirrors the real window fullscreen state, which the OS can change too. */
import { useCallback, useEffect, useState } from 'react';

export function useFullscreen(): { isFullscreen: boolean; toggle: () => void; set: (value: boolean) => void } {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    void window.desktop.isFullscreen().then(setIsFullscreen);
    return window.desktop.onFullscreenChange(setIsFullscreen);
  }, []);

  const set = useCallback((value: boolean) => {
    void window.desktop.setFullscreen(value).then(setIsFullscreen);
  }, []);

  const toggle = useCallback(() => {
    void window.desktop.setFullscreen().then(setIsFullscreen);
  }, []);

  return { isFullscreen, toggle, set };
}
