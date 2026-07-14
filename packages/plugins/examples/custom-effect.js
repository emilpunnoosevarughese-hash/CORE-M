/**
 * Custom Effect Plugin (Worker Model)
 * Demonstrates rendering commands pipeline.
 */

async function applyEffectToSelection() {
  try {
    // 1. We ask the UI for selected clips (requires 'project.read' permission)
    const selectedIds = await self.PluginAPI.invoke('timeline', 'getSelection', []);
    
    if (selectedIds.length === 0) {
      await self.PluginAPI.invoke('ui', 'showNotification', ['Please select a clip first.', 'info']);
      return;
    }

    // 2. We queue a custom render command for the WebGL engine to process
    // (requires 'render' permission)
    await self.PluginAPI.invoke('render', 'queueCommand', [{
      type: 'APPLY_FILTER',
      target: selectedIds[0],
      filterId: 'com.community.glitch-effect',
      params: { intensity: 0.8, rgbShift: 5.0 }
    }]);

    await self.PluginAPI.invoke('ui', 'showNotification', ['Glitch effect applied!', 'success']);

  } catch (err) {
    console.error('[CustomEffect] Error:', err);
    await self.PluginAPI.invoke('ui', 'showNotification', [err.message, 'error']);
  }
}

// Subscribe to a custom UI button click if registered
self.PluginAPI.events.on('ui.button_clicked.glitch_effect', () => {
  applyEffectToSelection();
});
