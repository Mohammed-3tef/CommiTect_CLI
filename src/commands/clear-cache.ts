import { commitCache } from '../utils/cache.js';
import chalk from 'chalk';

export function clearCacheCommand(): void {
  try {
    const stats = commitCache.getStats();
    
    if (stats.size === 0) {
      console.log(chalk.yellow('ℹ  Cache is already empty'));
      return;
    }

    commitCache.clear();
    console.log(chalk.green(`✓  Cache cleared (${stats.size} entries removed)`));
  } catch (error) {
    if (error instanceof Error) {
      console.error(chalk.red('✗  ' + error.message));
    } else {
      console.error(chalk.red('✗  Failed to clear cache'));
    }
    process.exit(1);
  }
}