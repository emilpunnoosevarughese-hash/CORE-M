import { Composition, getInputProps, AbsoluteFill } from "remotion";
import { CoreMComposition } from "./compositions/CoreMComposition";
import { z } from "zod";

export const sequenceSchema = z.object({
  id: z.string(),
  name: z.string(),
  width: z.number(),
  height: z.number(),
  fps: z.number(),
  duration: z.number(),
  tracks: z.array(z.any()),
  clips: z.record(z.any()),
  assets: z.record(z.any()),
});

// Calculate metadata based on the input props
const calculateMetadata = ({ props }: { props: z.infer<typeof sequenceSchema> }) => {
  return {
    durationInFrames: props.duration || 300,
    fps: props.fps || 30,
    width: props.width || 1920,
    height: props.height || 1080,
  };
};

export const RemotionRoot: React.FC = () => {
  // Use default props for the studio preview
  const defaultProps: z.infer<typeof sequenceSchema> = {
    id: "default",
    name: "CORE M Project",
    width: 1920,
    height: 1080,
    fps: 30,
    duration: 150,
    tracks: [],
    clips: {},
    assets: {},
  };

  return (
    <>
      <Composition
        id="CoreMSequence"
        component={CoreMComposition}
        calculateMetadata={calculateMetadata}
        schema={sequenceSchema}
        defaultProps={defaultProps}
      />
    </>
  );
};
