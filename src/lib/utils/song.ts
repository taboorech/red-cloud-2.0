import { SongState } from "../types/song";

export function validateSongState(data: any): data is SongState {
  return (
    data &&
    typeof data.id === "number" &&
    typeof data.currentTime === "number" &&
    typeof data.duration === "number" &&
    typeof data.isPlaying === "boolean" &&
    data.currentTime >= 0 &&
    data.currentTime <= data.duration
  );
}
