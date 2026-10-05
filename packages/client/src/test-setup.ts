// Test environment mock for Web Animations API (Element.prototype.animate)
// Happy-DOM and JSDOM lack Web Animations API support.
if (typeof Element !== 'undefined' && !Element.prototype.animate) {
  Element.prototype.animate = () => {
    const listeners = new Map<string, Set<() => void>>();
    const anim = {
      playState: 'finished',
      cancel: () => {},
      finish: () => {},
      play: () => {},
      pause: () => {},
      reverse: () => {},
      addEventListener: (event: string, callback: () => void) => {
        if (!listeners.has(event)) listeners.set(event, new Set());
        listeners.get(event)!.add(callback);
        if (event === 'finish') {
          setTimeout(callback, 0);
        }
      },
      removeEventListener: (event: string, callback: () => void) => {
        listeners.get(event)?.delete(callback);
      },
    };
    return anim as unknown as Animation;
  };
}
