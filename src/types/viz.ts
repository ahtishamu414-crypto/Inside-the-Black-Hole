export type NodeCategory = 'active' | 'anchor' | 'damaged' | 'lost' | 'inactive' | 'marker';

export interface VizNode {
  id: number;
  cat: NodeCategory;
  r: number;
  a0: number;
}

export interface VizState {
  r: number;
  mass: number;
  markers: number;
  anchorR: number;
  frac: {
    lost: number;
    damaged: number;
    inactive: number;
  };
  vt: number;
}

export interface SwarmUIState {
  zoom: number;
  filters: Record<NodeCategory, boolean>;
  layers: {
    disk: boolean;
    orbits: boolean;
    links: boolean;
    traj: boolean;
    grid: boolean;
  };
  sel: number | null;
}

export interface SwarmOut {
  pts: { id: number; x: number; y: number }[];
}

export interface GrrtParams {
  mass: number;
  cam: number;
  dist: number;
  inc: number;
  res: number;
}

export interface ChartSeries {
  d: number[];
  c: string;
  fill?: string;
}

export interface ChartThreshold {
  v: number;
  c: string;
}

export interface ChartSpec {
  xmax?: number;
  min?: number;
  max?: number;
  series: ChartSeries[];
  th?: ChartThreshold[];
}

