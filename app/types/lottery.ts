export interface PlayerHistory {
  score: number;
  changed_at: number;
  challenge_id: number | null;
  blood_state: number | null;
}

export interface Player {
  id: number;
  name: string;
  game_id: number;
  token: string;
  state: number;
  institute_id: number | null;
  score: number;
  history: PlayerHistory[];
  last_active_at?: number;
}

export interface PlayerInfo {
  name: string;
  token: string;
  score: number;
}

export interface PlayerHash {
  name: string;
  hash: string;
}

export interface Winner {
  name: string;
  sortValue: bigint;
}

export interface LotteryResult {
  blockNumber: number;
  blockHash: string;
  timestamp: string;
  winners: string[];
}
