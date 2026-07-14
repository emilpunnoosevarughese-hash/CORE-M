# coreM Plugin SDK Documentation

Welcome to the coreM Plugin SDK. This architecture allows developers to extend coreM with Video Effects, UI Overlays, Exporters, and more, all while running securely inside a Web Worker Sandbox.

## Architecture Overview

All coreM plugins execute entirely inside isolated Web Workers. This ensures:
1. **Security**: Plugins cannot access the DOM or read user cookies/IndexedDB.
2. **Performance**: Heavy computation in plugins will never freeze the main React UI thread.
3. **Stability**: If a plugin throws a fatal error, its isolated Web Worker crashes safely without affecting the rest of the application.

## The API Bridge

Because plugins run inside a Sandbox, they interact with the editor through an asynchronous API Bridge.

```javascript
// Example Plugin Code (runs in Worker)
async function getPlayheadTime() {
  // Calls the main thread's TimelineStore securely
  const time = await coreM.api.timeline.getPlayhead();
  console.log(`Current time is: ${time}`);
}
```

## Plugin Manifest (`manifest.json`)

Every plugin must define a `manifest.json`.

```json
{
  "id": "my-awesome-plugin",
  "name": "My Awesome Plugin",
  "version": "1.0.0",
  "category": "video-effect",
  "supportedCoreMVersion": ">=1.0.0",
  "permissions": ["timeline:read", "ui:notifications"],
  "entry": "index.js"
}
```

## Developing a Plugin

1. Create a folder in `apps/web-editor/public/plugins/` (e.g., `my-plugin`).
2. Add your `manifest.json` and `index.js`.
3. In `index.js`, write your logic using the injected `coreM.api` object.
4. Open the Plugin Marketplace in coreM and install it via URL.

## API Reference

Currently exposed via the Sandbox:

- `coreM.api.timeline.getPlayhead(): Promise<number>`
- `coreM.api.timeline.setPlayhead(time: number): Promise<void>`
- `coreM.api.ui.showNotification(msg: string, type: 'info' | 'success' | 'error'): Promise<void>`

*(More endpoints to be exposed in Phase 17+)*
