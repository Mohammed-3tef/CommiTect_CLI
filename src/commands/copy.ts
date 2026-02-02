import { isGitRepository, getGitDiff, hasChanges } from '../utils/git.js';
import { generateCommitMessage } from '../services/llm.js';
import clipboardy from 'clipboardy';
import chalk from 'chalk';

export async function copyCommand(): Promise<void> {
  try {
    // Validate git repository
    if (!isGitRepository()) {
      console.error(chalk.red('✗  Not a git repository'));
      process.exit(1);
    }

    // Check for changes
    if (!hasChanges()) {
      console.log(chalk.yellow('⚠  No changes detected'));
      process.exit(0);
    }

    // Get diff
    const diff = getGitDiff();
    
    if (!diff.trim()) {
      console.log(chalk.yellow('⚠  No changes to analyze'));
      process.exit(0);
    }

    // Generate commit message
    console.log(chalk.blue('🔎︎ Generating commit message...'));
    const suggestion = await generateCommitMessage(diff);

    // Build commit message as "intent: message"
    const commitMessage = `${suggestion.intent}: ${suggestion.message}`;

    // Copy to clipboard
    await clipboardy.write(commitMessage);

    console.log(chalk.green('✓  Commit message copied to clipboard'));

  } catch (error) {
    if (error instanceof Error) {
      console.error(chalk.red('✗  ' + error.message));
    } else {
      console.error(chalk.red('✗  An unexpected error occurred'));
    }
    process.exit(1);
  }
}