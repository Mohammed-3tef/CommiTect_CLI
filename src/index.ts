#!/usr/bin/env node
import { Command } from 'commander';
import { analyzeCommand } from './commands/analyze.js';
import { copyCommand } from './commands/copy.js';
import { commitCommand } from './commands/commit.js';
import { clearCacheCommand } from './commands/clear-cache.js';
import { historyCommand } from './commands/history.js';
import { helpCommand } from './commands/help.js';

const program = new Command();

program
  .name('commitect')
  .description('Zero-config Git Commit Assistant')
  .version('1.0.0');

program
  .command('analyze')
  .description('Analyze changes and suggest a commit message')
  .action(analyzeCommand);

program
  .command('copy')
  .description('Generate commit message and copy to clipboard')
  .action(copyCommand);

program
  .command('commit')
  .description('Generate and execute git commit')
  .action(commitCommand);

program
  .command('history')
  .description('Show cached commit message history')
  .action(historyCommand);

program
  .command('clear-cache')
  .description('Clear the commit message cache')
  .action(clearCacheCommand);

program
  .command('help')
  .description('Show detailed help and examples')
  .action(helpCommand);

// Show help by default if no command is provided
if (process.argv.length === 2) {
  helpCommand();
  process.exit(0);
}

program.parse();