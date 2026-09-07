import React from 'react';
import { Composition } from 'remotion';
import { DURACAO_TOTAL, Pitch } from './Pitch';

export const RemotionRoot: React.FC = () => (
  <Composition
    id="Pitch"
    component={Pitch}
    durationInFrames={DURACAO_TOTAL}
    fps={30}
    width={1920}
    height={1080}
  />
);
