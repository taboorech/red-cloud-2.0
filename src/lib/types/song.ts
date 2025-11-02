export interface SongState {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  isPlaying: boolean;
  currentTime: number;

  roomOptions?: {
    roomId: number;
  };
}
