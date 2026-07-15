import React, { useMemo } from "react";
import { OffthreadVideo, useCurrentFrame, useVideoConfig, AbsoluteFill } from "remotion";

// Helper to construct CSS filter strings from effect parameters
function buildCssFilter(effects: any[]) {
  if (!effects || effects.length === 0) return "";
  let filter = "";

  const primary = effects.find((e) => e.effectId === "primary_color");
  if (primary && primary.parameters) {
    const p = primary.parameters;
    // Map our basic color parameters to standard CSS filters
    if (p.contrast !== undefined) filter += `contrast(${(p.contrast * 100).toFixed(0)}%) `;
    // Exposure maps roughly to brightness
    if (p.exposure !== undefined) {
      // simple map: e.g. -5 to 5 mapping to 0% to 500%
      const b = Math.max(0, 100 + p.exposure * 50);
      filter += `brightness(${b.toFixed(0)}%) `;
    }
    if (p.saturation !== undefined) filter += `saturate(${(p.saturation * 100).toFixed(0)}%) `;
    if (p.temperature !== undefined) {
      // Approximate temp with sepia/hue
      if (p.temperature > 0) filter += `sepia(${(p.temperature * 50).toFixed(0)}%) hue-rotate(-15deg) `;
      else if (p.temperature < 0) filter += `sepia(${(-p.temperature * 20).toFixed(0)}%) hue-rotate(180deg) `;
    }
  }

  return filter.trim();
}

export const VideoClip: React.FC<{ clip: any; asset: any }> = ({ clip, asset }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Ensure asset is valid video
  if (!asset || asset.type !== 'video' || !asset.url) return null;

  // Calculate start time based on sourceStart
  const startFrom = (clip.sourceStart / fps) * 1000; // startFrom is in milliseconds for OffthreadVideo
  // Remotion offthreadvideo uses startFrom in frames relative to video fps, wait no, startFrom is frames in the composition fps
  const startFromFrames = clip.sourceStart;
  
  const cssFilter = useMemo(() => buildCssFilter(clip.effects), [clip.effects]);

  const style: React.CSSProperties = {
    position: "absolute",
    left: "50%",
    top: "50%",
    width: "100%",
    height: "100%",
    transform: `translate(-50%, -50%) translate(${clip.transform?.x || 0}px, ${clip.transform?.y || 0}px) scale(${clip.transform?.scaleX || 1}, ${clip.transform?.scaleY || 1}) rotate(${clip.transform?.rotation || 0}deg)`,
    transformOrigin: `${(clip.transform?.anchorX || 0) * 100}% ${(clip.transform?.anchorY || 0) * 100}%`,
    opacity: clip.opacity ?? 1,
    filter: cssFilter || undefined,
  };

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <OffthreadVideo
        src={asset.url}
        startFrom={startFromFrames}
        style={style}
        volume={clip.audio?.volume ?? 1}
      />
    </AbsoluteFill>
  );
};
