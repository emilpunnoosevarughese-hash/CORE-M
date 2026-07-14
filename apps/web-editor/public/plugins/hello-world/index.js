/**
 * Hello World Extension - Entry Script
 * Runs inside the Web Worker Sandbox
 */

console.log("[Hello World Plugin] Initializing...");

async function run() {
  try {
    // Call the coreM SDK exposed by the sandbox
    await coreM.api.ui.showNotification("Hello World Plugin Activated!", "success");
    
    // Poll playhead occasionally as an example
    setInterval(async () => {
      const time = await coreM.api.timeline.getPlayhead();
      console.log(`[Hello World Plugin] Playhead is at ${time}s`);
    }, 5000);
    
  } catch (err) {
    console.error("[Hello World Plugin] Failed:", err);
  }
}

run();
