import { commitCache } from '../utils/cache.js';
import chalk from 'chalk';

export function historyCommand(): void {
  try {
    const history = commitCache.getHistory();

    if (history.length === 0) {
      console.log(chalk.yellow('ℹ No commit history found'));
      console.log(chalk.gray('  Generate some commits first using commitect analyze/copy/commit'));
      return;
    }

    console.log('');
    console.log(chalk.bold.cyan('📜 COMMIT HISTORY'));
    console.log(chalk.gray('─'.repeat(70)));
    console.log('');

    history.forEach((entry, index) => {
      const date = new Date(entry.timestamp);
      const timeAgo = getTimeAgo(entry.timestamp);
      
      // Format: [1] Feature: Add user authentication
      console.log(chalk.bold.white(`[${index + 1}]`) + ' ' + chalk.green(`${entry.intent}: ${entry.message}`));
      console.log(chalk.gray(`    📁 ${entry.folder}`));
      console.log(chalk.gray(`    🕒 ${date.toLocaleString()} (${timeAgo})`));
      console.log('');
    });

    console.log(chalk.gray('─'.repeat(70)));
    console.log(chalk.gray(`Total: ${history.length} cached commit message${history.length !== 1 ? 's' : ''}`));
    console.log('');

  } catch (error) {
    if (error instanceof Error) {
      console.error(chalk.red('❌ ' + error.message));
    } else {
      console.error(chalk.red('❌ Failed to load history'));
    }
    process.exit(1);
  }
}

function getTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  } else if (hours > 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  } else {
    return 'just now';
  }
}