// bundle-summary.js
const fs = require('fs');
const path = require('path');

const webpackDir = path.join(__dirname, '../.webpack');

const statsFiles = [];
function findStatsFiles(dir) {
    const items = fs.readdirSync(dir);
    items.forEach(item => {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            findStatsFiles(fullPath);
        } else if (item === 'stats.json') {
            statsFiles.push(fullPath);
        }
    });
}

findStatsFiles(webpackDir);

console.info('📦 Bundle Size Summary\n');
console.info('Function                       | Size (MB)  | Assets');
console.info('-------------------------------|------------|--------');

statsFiles.forEach(statsFile => {
    const functionName = path.basename(path.dirname(statsFile));
    const stats = JSON.parse(fs.readFileSync(statsFile, 'utf8'));

    const totalSize = stats.assets.reduce((sum, asset) => sum + asset.size, 0);
    const sizeMB = (totalSize / 1024 / 1024).toFixed(2);
    const assetCount = stats.assets.length;

    console.info(`${functionName.padEnd(30)} | ${sizeMB.padEnd(10)} | ${assetCount}`);
});

// Sort by size (largest first)
const functionSizes = statsFiles.map(statsFile => {
    const functionName = path.basename(path.dirname(statsFile));
    const stats = JSON.parse(fs.readFileSync(statsFile, 'utf8'));
    const totalSize = stats.assets.reduce((sum, asset) => sum + asset.size, 0);
    return { functionName, size: totalSize };
});

functionSizes.sort((a, b) => b.size - a.size);

console.info('\n🏆 Largest Bundles:');
functionSizes.slice(0, 5).forEach((func, index) => {
    console.info(`${index + 1}. ${func.functionName.padEnd(20)}: ${(func.size / 1024 / 1024).toFixed(2)} MB`);
});