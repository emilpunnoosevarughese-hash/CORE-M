import React from "react";
import { Audio } from "remotion";

export const AudioClip: React.FC<{ clip: any; asset: any; trackMuted: boolean }> = ({ clip, asset, trackMuted }) => {
  // Ensure asset is valid audio
  if (!asset || asset.type !== 'audio' || !asset.url) return null;

  const startFromFrames = clip.sourceStart;
  
  // Base volume logic
  let vol = clip.audio?.volume ?? 1;
  if (trackMuted || clip.disabled) vol = 0;

  return (
    <Audio
      src={asset.url}
      startFrom={startFromFrames}
      volume={vol}
    />
  );
};
