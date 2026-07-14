/**
 * Hello World Plugin (Worker Model)
 * Example showing basic API calls and event subscriptions
 */

self.PluginAPI.events.on('playback.started', () => {
  console.log('[HelloPlugin] Playback started!');
});

self.PluginAPI.events.on('playback.paused', () => {
  console.log('[HelloPlugin] Playback paused!');
});

async function main() {
  console.log('[HelloPlugin] Worker started.');
  
  try {
    const playhead = await self.PluginAPI.invoke('timeline', 'getPlayhead', []);
    console.log('[HelloPlugin] Current Playhead:', playhead);

    // Notify user
    await self.PluginAPI.invoke('ui', 'showNotification', ['Hello from the Hello World plugin!', 'success']);
  } catch (err) {
    console.error('[HelloPlugin] Error:', err);
  }
}

main();
