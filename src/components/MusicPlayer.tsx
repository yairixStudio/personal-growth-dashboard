import React, { useState } from 'react';
import styled from '@emotion/styled';

interface Track {
  id: string;
  name: string;
  type: 'alpha' | 'beta' | 'theta' | 'delta' | 'gamma';
  description: string;
}

const PlayerContainer = styled.div`
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  padding: 15px;
  width: 300px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 10px;
  border: 1px solid rgba(0, 0, 0, 0.1);
`;

const PlayerHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
`;

const Title = styled.h3`
  margin: 0;
  font-size: 14px;
  color: #333;
`;

const Controls = styled.div`
  display: flex;
  gap: 15px;
  justify-content: center;
  align-items: center;
`;

const Button = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: #666;
  transition: color 0.2s;
  padding: 5px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    color: #333;
    background: rgba(0, 0, 0, 0.05);
  }
`;

const TrackInfo = styled.div`
  text-align: center;
  margin: 10px 0;
`;

const TrackName = styled.div`
  font-size: 13px;
  font-weight: 500;
  color: #333;
`;

const TrackType = styled.div`
  font-size: 11px;
  color: #666;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 4px;
  background: #eee;
  border-radius: 2px;
  position: relative;
  cursor: pointer;

  &::after {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    width: 45%;
    background: linear-gradient(90deg, #4a90e2, #67b26f);
    border-radius: 2px;
  }
`;

const MusicPlayer: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack] = useState<Track>({
    id: '1',
    name: 'Deep Focus',
    type: 'alpha',
    description: 'גלי אלפא לריכוז מוגבר'
  });

  return (
    <PlayerContainer>
      <PlayerHeader>
        <Title>נגן גלי מוח</Title>
        <Button onClick={() => console.log('minimize')}>
          <span>_</span>
        </Button>
      </PlayerHeader>
      
      <TrackInfo>
        <TrackName>{currentTrack.name}</TrackName>
        <TrackType>{currentTrack.description}</TrackType>
      </TrackInfo>

      <ProgressBar />

      <Controls>
        <Button onClick={() => console.log('previous')}>
          ⏮️
        </Button>
        <Button onClick={() => setIsPlaying(!isPlaying)}>
          {isPlaying ? '⏸️' : '▶️'}
        </Button>
        <Button onClick={() => console.log('next')}>
          ⏭️
        </Button>
      </Controls>
    </PlayerContainer>
  );
};

export default MusicPlayer; 