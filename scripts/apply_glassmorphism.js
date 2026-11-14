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
  'src/components/modals/SourcesModal.tsx'
];

for (const relPath of filesToUpdate) {
  const fullPath = path.resolve('e:/Black Hole', relPath);
  if (!fs.existsSync(fullPath)) continue;

  let content = fs.readFileSync(fullPath, 'utf8');

  // Replace #101A2A
  content = content.replaceAll(
    "background: '#101A2A'",
    "background: 'rgba(16, 26, 42, 0.72)', backdropFilter: 'blur(10px)'"
  );
  content = content.replaceAll(
    'background: "#101A2A"',
    'background: "rgba(16, 26, 42, 0.72)", backdropFilter: "blur(10px)"'
  );
  content = content.replaceAll(
    ": '#101A2A'",
    ": 'rgba(16, 26, 42, 0.72)'"
  );

  // Replace #0B1220
  content = content.replaceAll(
    "background: '#0B1220'",
    "background: 'rgba(11, 18, 32, 0.68)', backdropFilter: 'blur(8px)'"
  );
  content = content.replaceAll(
    'background: "#0B1220"',
    'background: "rgba(11, 18, 32, 0.68)", backdropFilter: "blur(8px)"'
  );
  content = content.replaceAll(
    ": '#0B1220'",
    ": 'rgba(11, 18, 32, 0.68)'"
  );

  // Replace #0A101C
  content = content.replaceAll(
    "background: '#0A101C'",
    "background: 'rgba(10, 16, 28, 0.70)', backdropFilter: 'blur(8px)'"
  );
  content = content.replaceAll(
    'background: "#0A101C"',
    'background: "rgba(10, 16, 28, 0.70)", backdropFilter: "blur(8px)"'
  );
  content = content.replaceAll(
    ": '#0A101C'",
    ": 'rgba(10, 16, 28, 0.70)'"
  );

  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`Updated glass styling in ${relPath}`);
}

console.log('All files updated with glassmorphic transparency!');
