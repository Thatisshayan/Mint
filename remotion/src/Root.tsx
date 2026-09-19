import { Composition } from 'remotion';
import { CaptionedVideo, calculateCaptionedVideoMetadata, captionedVideoPropsSchema } from './CaptionedVideo.js';

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="CaptionedVideo"
      component={CaptionedVideo}
      fps={30}
      width={1080}
      height={1920}
      durationInFrames={300}
      schema={captionedVideoPropsSchema}
      defaultProps={{ audioSrc: '', captions: [] }}
      calculateMetadata={calculateCaptionedVideoMetadata}
    />
  );
};
