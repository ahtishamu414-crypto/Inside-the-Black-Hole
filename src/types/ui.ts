import { DifficultyKey, ScenarioKey, OrbitKey, VehicleKey } from './simulation';
import { NodeCategory } from './viz';

export type ScreenId =
  | 'overview'
  | 'swarm'
  | 'td'
  | 'env'
  | 'grrt'
  | 'sim'
  | 'analytics'
  | 'outcome';

export interface ToastItem {
  id: number;
  key: string;
  text: string;
}

export interface SavedRun {
  id: number;
  name: string;
  diff: string;
  sandbox: boolean;
  team: boolean;
  scen: string;
  veh: string;
  orbit: string;
  budget: number;
  mass: number;
  data: number;
  score: number;
  result: string;
  step: number;
}

export interface GrrtRunHistory {
  title: string;
  desc: string;
}

