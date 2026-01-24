import { execSync } from 'child_process';

const IGNORED_PATHS = [
  'node_modules/',
  'bin/',
  'obj/',
  'dist/',
  'build/',
  '.git/'
];

export function isGitRepository(): boolean {
  try {
    execSync('git rev-parse --git-dir', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

export function getGitDiff(): string {
  try {
    // Get both staged and unstaged changes
    const diff = execSync('git diff HEAD', { 
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024 // 10MB buffer
    });
    
    return filterIgnoredPaths(diff);
  } catch (error) {
    throw new Error('Failed to read git diff');
  }
}

export function hasChanges(): boolean {
  try {
    const status = execSync('git status --porcelain', { 
      encoding: 'utf-8' 
    });
    return status.trim().length > 0;
  } catch {
    return false;
  }
}

export function executeCommit(message: string): void {
  try {
    execSync(`git commit -m "${message.replace(/"/g, '\\"')}"`, {
      stdio: 'inherit'
    });
  } catch (error) {
    throw new Error('Git commit failed');
  }
}

function filterIgnoredPaths(diff: string): string {
  const lines = diff.split('\n');
  const filteredLines: string[] = [];
  let skipFile = false;

  for (const line of lines) {
    // Check if this is a file header
    if (line.startsWith('diff --git')) {
      const path = line.split(' b/')[1];
      skipFile = IGNORED_PATHS.some(ignored => path?.startsWith(ignored));
    }

    if (!skipFile) {
      filteredLines.push(line);
    }
  }

  return filteredLines.join('\n');
}