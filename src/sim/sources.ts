// NASA Data Sources and Mission References
// TODO: confirm these URLs with NASA mission pages

export interface NasaSource {
  screenId: string;
  label: string;
  url: string;
}

export const NASA_SOURCES: Record<string, string> = {
  overview: 'https://science.nasa.gov/universe/black-holes/', // TODO: confirm
  swarm: 'https://www.nasa.gov/smallsat-institute/',           // TODO: confirm
  td: 'https://science.nasa.gov/mission/gravity-probe-b/',     // TODO: confirm
  env: 'https://www.nasa.gov/hrp/',                            // TODO: confirm
  grrt: 'https://svs.gsfc.nasa.gov/',                          // TODO: confirm
  sim: 'https://www.nasa.gov/stem/'                            // TODO: confirm
};

export const NASA_SOURCES_LIST: { label: string; url: string }[] = [
  { label: 'Mission Overview · black holes', url: NASA_SOURCES.overview },
  { label: 'Swarm Network · small satellites', url: NASA_SOURCES.swarm },
  { label: 'Time Dilation · relativity tests', url: NASA_SOURCES.td },
  { label: 'Environmental Simulation · radiation and health', url: NASA_SOURCES.env },
  { label: 'GRRT Imaging · visualizations', url: NASA_SOURCES.grrt },
  { label: 'Mission Simulation · education', url: NASA_SOURCES.sim }
];

