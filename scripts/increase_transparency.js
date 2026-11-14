import fs from 'fs';
import path from 'path';

const filesToUpdate = [
  'src/screens/OverviewScreen.tsx',
  'src/screens/SwarmScreen.tsx',
  'src/screens/TimeDilationScreen.tsx',
  'src/screens/EnvironmentalScreen.tsx',
  'src/screens/GrrtScreen.tsx',
  'src/screens/SimulationScreen.tsx',
  'src/screens/AnalyticsScreen.tsx',
  'src/screens/OutcomeScreen.tsx',
  'src/components/modals/EventModal.tsx',
  'src/components/modals/VoteModal.tsx',
  'src/components/modals/GuideModal.tsx',
  'src/components/modals/SourcesModal.tsx',
  'src/components/layout/TopBar.tsx',
  'src/components/layout/Sidebar.tsx',
  'src/components/layout/Footer.tsx',
  'src/components/layout/GameBar.tsx'
];

for (const relPath of filesToUpdate) {
  const fullPath = path.resolve('e:/Black Hole', relPath);
  if (!fs.existsSync(fullPath)) continue;

  let content = fs.readFileSync(fullPath, 'utf8');

  // Replace 0.72 / 0.68 / 0.70 / 0.90 with much more transparent values
  content = content.replaceAll("rgba(16, 26, 42, 0.72)", "rgba(16, 26, 42, 0.38)");
  content = content.replaceAll('rgba(16, 26, 42, 0.72)', 'rgba(16, 26, 42, 0.38)');
  content = content.replaceAll("rgba(11, 18, 32, 0.68)", "rgba(11, 18, 32, 0.32)");
  content = content.replaceAll('rgba(11, 18, 32, 0.68)', 'rgba(11, 18, 32, 0.32)');
  content = content.replaceAll("rgba(10, 16, 28, 0.70)", "rgba(10, 16, 28, 0.30)");
  content = content.replaceAll('rgba(10, 16, 28, 0.70)', 'rgba(10, 16, 28, 0.30)');
  content = content.replaceAll("rgba(11, 18, 32, 0.90)", "rgba(11, 18, 32, 0.45)");
  content = content.replaceAll('rgba(11, 18, 32, 0.90)', 'rgba(11, 18, 32, 0.45)');
  content = content.replaceAll("rgba(10, 16, 28, 0.90)", "rgba(10, 16, 28, 0.45)");
  content = content.replaceAll('rgba(10, 16, 28, 0.90)', 'rgba(10, 16, 28, 0.45)');

  // Also replace any remaining solid panel colors if any
  content = content.replaceAll("background: '#101A2A'", "background: 'rgba(16, 26, 42, 0.38)', backdropFilter: 'blur(8px)'");
  content = content.replaceAll('background: "#101A2A"', 'background: "rgba(16, 26, 42, 0.38)", backdropFilter: "blur(8px)"');
  content = content.replaceAll("background: '#0B1220'", "background: 'rgba(11, 18, 32, 0.32)', backdropFilter: 'blur(8px)'");
  content = content.replaceAll('background: "#0B1220"', 'background: "rgba(11, 18, 32, 0.32)", backdropFilter: "blur(8px)"');
  content = content.replaceAll("background: '#0A101C'", "background: 'rgba(10, 16, 28, 0.30)', backdropFilter: 'blur(8px)'");
  content = content.replaceAll('background: "#0A101C"', 'background: "rgba(10, 16, 28, 0.30)", backdropFilter: "blur(8px)"');

  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`Updated transparency in ${relPath}`);
}

console.log('All components updated with increased transparency!');
