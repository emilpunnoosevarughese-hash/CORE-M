import React from 'react';
import { Code2, Heart, Cpu, Sparkles } from 'lucide-react';

export function DashboardAbout() {
  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">About CORE M</h1>
      
      <div className="bg-surface border border-border rounded-xl p-8 mb-8 flex flex-col md:flex-row gap-8 items-center">
        <div className="w-32 h-32 rounded-full overflow-hidden shrink-0 border-4 border-primary/20 bg-black/20 flex items-center justify-center">
          <span className="text-4xl font-bold text-primary">EV</span>
        </div>
        <div>
          <h2 className="text-2xl font-bold mb-2">Developed by EMILPUNNOOSE VARUGHESE</h2>
          <p className="text-foreground/70 leading-relaxed mb-4">
            CORE M Cloud is a professional, browser-based video editing platform designed to bring 
            desktop-class editing capabilities directly to the web. Built with modern web technologies 
            like WebGL, WebAudio, and WebAssembly, it empowers creators to craft stunning visuals 
            without expensive hardware.
          </p>
          <div className="flex gap-4">
            <a href="#" className="text-primary hover:underline text-sm font-semibold">Contact Developer</a>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface border border-border rounded-xl p-6">
          <Cpu className="text-primary mb-4" size={24} />
          <h3 className="font-bold mb-2">High Performance</h3>
          <p className="text-sm text-foreground/70">
            Hardware-accelerated rendering utilizing the full power of your GPU inside the browser.
          </p>
        </div>
        
        <div className="bg-surface border border-border rounded-xl p-6">
          <Sparkles className="text-primary mb-4" size={24} />
          <h3 className="font-bold mb-2">AI-Powered</h3>
          <p className="text-sm text-foreground/70">
            Advanced background removal, color grading, and auto-captioning powered by machine learning.
          </p>
        </div>

        <div className="bg-surface border border-border rounded-xl p-6">
          <Code2 className="text-primary mb-4" size={24} />
          <h3 className="font-bold mb-2">Open Extensibility</h3>
          <p className="text-sm text-foreground/70">
            A rich plugin ecosystem allowing developers to build custom effects and tools.
          </p>
        </div>
      </div>

      <div className="mt-12 text-center text-foreground/50 text-sm flex items-center justify-center gap-2">
        Built with <Heart size={14} className="text-red-500" /> by Emil Punnoose Varughese &copy; {new Date().getFullYear()}
      </div>
    </div>
  );
}
