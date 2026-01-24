import chalk from 'chalk';

const VERSION = '1.0.0';
const GITHUB_REPO = 'https://github.com/Mohammed_3tef/CommiTect_CLI';
const ISSUES_URL = GITHUB_REPO + '/issues';

export function helpCommand(): void {
  console.log('');
  console.log(chalk.bold.cyan('╔══════════════════════════════════════════════════════════╗'));
  console.log(chalk.bold.cyan('║                      ') + chalk.bold.white('CommiTect') + chalk.bold.cyan('                           ║'));
  console.log(chalk.bold.cyan('║            ') + chalk.gray('Zero-config Git Commit Assistant') + chalk.bold.cyan('              ║'));
  console.log(chalk.bold.cyan('╚══════════════════════════════════════════════════════════╝'));
  console.log('');

  // COMMANDS SECTION
  console.log(chalk.bold.yellow('📋 AVAILABLE COMMANDS'));
  console.log('');

  // ANALYZE
  console.log(chalk.bold.green('  commitect analyze'));
  console.log(chalk.gray('  │'));
  console.log(chalk.gray('  ├─ ') + 'Analyzes your git changes and suggests a commit message');
  console.log(chalk.gray('  ├─ ') + 'Displays both intent and message on the terminal');
  console.log(chalk.gray('  └─ ') + 'Does NOT modify your git repository');
  console.log('');
  console.log(chalk.dim('     Example output:'));
  console.log(chalk.dim('     Feature: Add user authentication with JWT'));
  console.log('');

  // COPY
  console.log(chalk.bold.green('  commitect copy'));
  console.log(chalk.gray('  │'));
  console.log(chalk.gray('  ├─ ') + 'Generates a commit message from your changes');
  console.log(chalk.gray('  ├─ ') + 'Copies ONLY the message (not intent) to clipboard');
  console.log(chalk.gray('  └─ ') + 'Perfect for manual commits with custom flags');
  console.log('');
  console.log(chalk.dim('     Usage:'));
  console.log(chalk.dim('     $ commitect copy'));
  console.log(chalk.dim('     $ git commit -m "<paste>" --no-verify'));
  console.log('');

  // COMMIT
  console.log(chalk.bold.green('  commitect commit'));
  console.log(chalk.gray('  │'));
  console.log(chalk.gray('  ├─ ') + 'Generates a commit message from your changes');
  console.log(chalk.gray('  ├─ ') + 'Automatically executes: git commit -m "<message>"');
  console.log(chalk.gray('  └─ ') + 'Fastest way to commit with AI-generated messages');
  console.log('');
  console.log(chalk.dim('     Warning: Make sure you have staged your changes first!'));
  console.log(chalk.dim('     $ git add .'));
  console.log(chalk.dim('     $ commitect commit'));
  console.log('');

  // HISTORY
  console.log(chalk.bold.green('  commitect history'));
  console.log(chalk.gray('  │'));
  console.log(chalk.gray('  ├─ ') + 'Shows all cached commit messages');
  console.log(chalk.gray('  ├─ ') + 'Displays timestamp and time ago for each entry');
  console.log(chalk.gray('  └─ ') + 'Useful for reviewing past suggestions');
  console.log('');

  // CLEAR-CACHE
  console.log(chalk.bold.green('  commitect clear-cache'));
  console.log(chalk.gray('  │'));
  console.log(chalk.gray('  ├─ ') + 'Clears all cached commit messages');
  console.log(chalk.gray('  ├─ ') + 'Cache location: ~/.commitect/cache.json');
  console.log(chalk.gray('  └─ ') + 'Use when you want fresh suggestions');
  console.log('');

  // HELP
  console.log(chalk.bold.green('  commitect help'));
  console.log(chalk.gray('  │'));
  console.log(chalk.gray('  └─ ') + 'Shows this help message');
  console.log('');

  // HOW IT WORKS
  console.log(chalk.bold.yellow('⚙️  HOW IT WORKS'));
  console.log('');
  console.log(chalk.gray('  1. ') + '📖 Reads your git diff (staged + unstaged changes)');
  console.log(chalk.gray('  2. ') + '🔍 Checks cache for previously analyzed diffs');
  console.log(chalk.gray('  3. ') + '🤖 Sends to AI API if not cached (with auto-retry)');
  console.log(chalk.gray('  4. ') + '💾 Caches result for 30 days');
  console.log(chalk.gray('  5. ') + '✨ Returns professional commit message');
  console.log('');

  // WORKFLOW
  console.log(chalk.bold.yellow('🔄 TYPICAL WORKFLOW'));
  console.log('');
  console.log(chalk.gray('  # Make your changes'));
  console.log(chalk.white('  $ vim src/auth.ts'));
  console.log('');
  console.log(chalk.gray('  # Stage files'));
  console.log(chalk.white('  $ git add .'));
  console.log('');
  console.log(chalk.gray('  # Option 1: Preview message'));
  console.log(chalk.white('  $ commitect analyze'));
  console.log('');
  console.log(chalk.gray('  # Option 2: Copy to clipboard'));
  console.log(chalk.white('  $ commitect copy'));
  console.log(chalk.white('  $ git commit -m "<paste>"'));
  console.log('');
  console.log(chalk.gray('  # Option 3: Auto-commit (fastest)'));
  console.log(chalk.white('  $ commitect commit'));
  console.log('');

  // FEATURES
  console.log(chalk.bold.yellow('✨ KEY FEATURES'));
  console.log('');
  console.log(chalk.green('  ✓ ') + 'Zero configuration required');
  console.log(chalk.green('  ✓ ') + 'Smart caching (instant responses for same diffs)');
  console.log(chalk.green('  ✓ ') + 'Auto-retry on API failures (up to 3 attempts)');
  console.log(chalk.green('  ✓ ') + 'Ignores: node_modules/, dist/, build/, .git/');
  console.log(chalk.green('  ✓ ') + 'Professional messages (imperative, <70 chars)');
  console.log(chalk.green('  ✓ ') + 'Works with any git repository');
  console.log('');

  // TIPS
  console.log(chalk.bold.yellow('💡 PRO TIPS'));
  console.log('');
  console.log(chalk.cyan('  • ') + 'Use ' + chalk.bold('analyze') + ' when you want to review before committing');
  console.log(chalk.cyan('  • ') + 'Use ' + chalk.bold('copy') + ' when you need custom git flags');
  console.log(chalk.cyan('  • ') + 'Use ' + chalk.bold('commit') + ' for quick, everyday commits');
  console.log(chalk.cyan('  • ') + 'Use ' + chalk.bold('history') + ' to review all your cached messages');
  console.log(chalk.cyan('  • ') + 'Run ' + chalk.bold('clear-cache') + ' if suggestions seem outdated');
  console.log(chalk.cyan('  • ') + 'Cache saves time and reduces API costs significantly');
  console.log('');

  // REQUIREMENTS
  console.log(chalk.bold.yellow('📦 REQUIREMENTS'));
  console.log('');
  console.log(chalk.gray('  • Node.js >= 16'));
  console.log(chalk.gray('  • Git repository (initialized)'));
  console.log(chalk.gray('  • Internet connection (unless result is cached)'));
  console.log('');

  // FOOTER
  console.log(chalk.bold.cyan('─'.repeat(63)));
  console.log(chalk.gray('  Version: ') + chalk.white(VERSION));
  console.log(chalk.gray('  Docs: ') + chalk.white(GITHUB_REPO));
  console.log(chalk.gray('  Issues: ') + chalk.white(ISSUES_URL));
  console.log(chalk.bold.cyan('─'.repeat(63)));
  console.log('');
}