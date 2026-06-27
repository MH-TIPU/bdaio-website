const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Helper to remove directory recursively
function cleanDir(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true });
  }
}

// Main function
async function main() {
  const rootDir = path.join(__dirname, '..');
  const outDir = path.join(rootDir, 'out');
  const targetDir = path.join(rootDir, 'public', 'bdaio-site-static');
  const zipPath = path.join(rootDir, 'public', 'bdaio-site-static.zip');

  console.log('Cleaning up old static build folders...');
  cleanDir(targetDir);
  if (fs.existsSync(zipPath)) {
    fs.unlinkSync(zipPath);
  }

  console.log('Running Next.js build...');
  execSync('npm run build', { stdio: 'inherit', cwd: rootDir });

  console.log('Copying static build to public/bdaio-site-static...');
  fs.mkdirSync(targetDir, { recursive: true });
  fs.cpSync(outDir, targetDir, { recursive: true });

  console.log('Creating ZIP archive in public/bdaio-site-static.zip using native zip...');
  try {
    // Navigate to outDir and zip contents to place zip at zipPath
    execSync(`zip -r "${zipPath}" .`, { stdio: 'inherit', cwd: outDir });
    console.log(`ZIP file created at: ${zipPath}`);
  } catch (err) {
    console.error('Failed to create ZIP archive using native zip command:', err);
    console.log('Ensure you have "zip" utility installed in your path.');
    process.exit(1);
  }

  console.log('Static export build completed successfully!');
}

main().catch((err) => {
  console.error('Build failed:', err);
  process.exit(1);
});
