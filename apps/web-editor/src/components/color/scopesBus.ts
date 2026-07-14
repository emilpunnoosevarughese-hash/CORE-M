// Event bus for high-frequency messages (like scope frames) that shouldn't trigger React renders
export const scopesEventBus = new EventTarget();

export function emitScopesFrame(payload: { pixels: Uint8Array, width: number, height: number }) {
  const event = new CustomEvent('scopes-frame', { detail: payload });
  scopesEventBus.dispatchEvent(event);
}
