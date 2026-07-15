import React from "react";
import { AbsoluteFill, Sequence, useVideoConfig } from "remotion";
import { VideoClip } from "./VideoClip";
import { AudioClip } from "./AudioClip";

export const CoreMComposition: React.FC<any> = ({ tracks, clips, assets }) => {
  const { fps } = useVideoConfig();

  // Filter video tracks and map to clips
  const videoTracks = tracks.filter((t: any) => t.type === 'video');
  const audioTracks = tracks.filter((t: any) => t.type === 'audio');

  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      {/* Render Video Tracks (bottom to top based on array order or index) */}
      {videoTracks.map((track: any) => (
        <AbsoluteFill key={track.id}>
          {track.clipIds.map((clipId: string) => {
            const clip = clips[clipId];
            if (!clip || clip.disabled || track.hidden) return null;
            const asset = assets[clip.assetId];

            return (
              <Sequence
                key={clip.id}
                from={clip.start}
                durationInFrames={clip.duration}
              >
                <VideoClip clip={clip} asset={asset} />
              </Sequence>
            );
          })}
        </AbsoluteFill>
      ))}

      {/* Render Audio Tracks */}
      {audioTracks.map((track: any) => (
        <React.Fragment key={track.id}>
          {track.clipIds.map((clipId: string) => {
            const clip = clips[clipId];
            if (!clip || clip.disabled || track.muted) return null;
            const asset = assets[clip.assetId];

            return (
              <Sequence
                key={clip.id}
                from={clip.start}
                durationInFrames={clip.duration}
              >
                <AudioClip clip={clip} asset={asset} trackMuted={track.muted} />
              </Sequence>
            );
          })}
        </React.Fragment>
      ))}
    </AbsoluteFill>
  );
};
