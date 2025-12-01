export interface SongState {
  id: string;
  currentTime: number;
  duration: number;
  isPlaying: boolean;

  roomOptions?: {
    roomId: number;
  };
}

export interface ISongListeningRecord {
  songId: number;
  listeningId: number;
  userId: number;
}
