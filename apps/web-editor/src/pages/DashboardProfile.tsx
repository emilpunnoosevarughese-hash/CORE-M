import React from 'react';
import { useAuthStore } from '@corem/cloud';
import { User, Mail, Shield, HardDrive, Key } from 'lucide-react';

export function DashboardProfile() {
  const { user } = useAuthStore();

  if (!user) {
    return <div className="p-8 text-foreground/50">Please sign in to view your profile.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Your Profile</h1>
      
      <div className="bg-surface border border-border rounded-xl p-8 mb-8">
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center shrink-0 border-2 border-primary/30">
            {user.photoURL ? (
              <img src={user.photoURL} alt="Avatar" className="w-full h-full rounded-full object-cover" />
            ) : (
              <span className="text-4xl text-primary font-bold">
                {(user.displayName || user.email || 'U')[0].toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-1">{user.displayName || 'Guest User'}</h2>
            <div className="flex items-center gap-2 text-foreground/60 mb-1">
              <Mail size={14} />
              <span>{user.email || 'No email provided'}</span>
            </div>
            <div className="flex items-center gap-2 text-foreground/60">
              <Shield size={14} />
              <span className="font-mono text-xs">{user.uid}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-surface border border-border rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <HardDrive size={18} className="text-primary" />
            Storage Usage
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-foreground/70">Projects</span>
                <span>2 / 5 allowed</span>
              </div>
              <div className="h-2 bg-background rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 w-[40%]"></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-foreground/70">Cloud Media</span>
                <span>1.2 GB / 5 GB</span>
              </div>
              <div className="h-2 bg-background rounded-full overflow-hidden">
                <div className="h-full bg-green-500 w-[24%]"></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Key size={18} className="text-primary" />
            Account Status
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-background rounded-lg border border-border">
              <div>
                <div className="font-medium">Free Tier</div>
                <div className="text-xs text-foreground/50">Basic features & 720p export</div>
              </div>
              <button className="px-3 py-1.5 bg-primary/10 text-primary rounded text-xs font-semibold hover:bg-primary/20 transition-colors">
                Upgrade Pro
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
