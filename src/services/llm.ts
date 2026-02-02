import axios, { AxiosError } from 'axios';
import crypto from 'crypto';
import { commitCache } from '../utils/cache.js';

export interface CommitSuggestion {
  intent: string;
  message: string;
}

interface DiffAnalysis {
  hasBugFix: boolean;
  hasTestFix: boolean;
  hasNewFunction: boolean;
  hasNewClass: boolean;
  hasNewEndpoint: boolean;
  hasNewComponent: boolean;
  hasRefactor: boolean;
  hasRename: boolean;
  hasMovedCode: boolean;
  hasDocsChange: boolean;
  hasCommentChange: boolean;
  hasTestChange: boolean;
  hasDeletions: boolean;
  hasStyleChange: boolean;
  hasWhitespaceOnly: boolean;
  hasConfigChange: boolean;
  hasDependencyChange: boolean;
  additions: number;
  deletions: number;
  hasChanges: boolean;
}

interface ChangeSummary {
  total?: number;
  renamed?: number;
}

const API_ENDPOINT = 'http://commitintentdetector.runasp.net/api/Commit/analyze';

export async function generateCommitMessage(diff: string, summary?: ChangeSummary): Promise<CommitSuggestion> {
  const diffHash = crypto.createHash('sha1').update(diff).digest('hex');

  // Check cache first
  const cached = commitCache.get(diffHash);
  if (cached) {
    return cached;
  }

  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await axios.post(
        API_ENDPOINT,
        { diff },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      // API returns: { intent: "Intent: Feature\nMessage: Add subtraction support function" }
      const data = response.data;
      
      if (!data || !data.intent) {
        throw new Error('Invalid response format from API');
      }

      const result = parseResponse(data.intent);
      
      // Cache the result
      commitCache.set(diffHash, result.intent, result.message);

      return result;

    } catch (error) {
      lastError = error as Error;

      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        
        // Handle rate limiting (429)
        if (axiosError.response?.status === 429) {
          if (attempt < maxRetries) {
            await sleep(500 * Math.pow(2, attempt));
            continue;
          }
          break;
        }

        // Handle server errors (5xx) - retry
        if (axiosError.response?.status && axiosError.response.status >= 500) {
          if (attempt < maxRetries) {
            await sleep(500 * Math.pow(2, attempt));
            continue;
          }
        }

        // Handle network errors - retry
        if (axiosError.code === 'ECONNREFUSED' || axiosError.code === 'ETIMEDOUT') {
          if (attempt < maxRetries) {
            await sleep(500 * Math.pow(2, attempt));
            continue;
          }
        }
      }

      // Don't retry on client errors (4xx) except 429
      if (axios.isAxiosError(error) && error.response?.status && error.response.status < 500 && error.response.status !== 429) {
        break;
      }

      // Retry on other errors
      if (attempt < maxRetries) {
        await sleep(500 * Math.pow(2, attempt));
        continue;
      }
    }
  }

  console.warn('⚠  AI service unavailable, using fallback commit message.');
  return generateFallbackCommit(diff, summary);
}

function parseResponse(response: string): CommitSuggestion {
  const lines = response.trim().split('\n');
  
  let intent = '';
  let message = '';

  for (const line of lines) {
    if (line.startsWith('Intent:')) {
      intent = line.replace('Intent:', '').trim();
    } else if (line.startsWith('Message:')) {
      message = line.replace('Message:', '').trim();
    }
  }

  if (!intent || !message) {
    throw new Error('Invalid response format from LLM');
  }

  if (message.length > 70) {
    message = message.substring(0, 67) + '...';
  }

  return { intent, message };
}

function extractFilesFromDiff(diff: string): string[] {
  const files = new Set<string>();
  const regex = /^diff --git a\/(.+?) b\/(.+)$/gm;
  let match;
  while ((match = regex.exec(diff))) {
    files.add(match[2]);
  }
  return [...files];
}

function isTrivialWhitespace(lines: string[]): boolean {
  return lines.every(l =>
    /^[+-]\s*$/.test(l) ||
    /^[+-]\s*[{}();,]*\s*$/.test(l)
  );
}

/**
 * Analyze the diff content for patterns
 * @param diff - The git diff string
 * @param summary - Optional summary with file change counts
 * @returns Analysis results with detected patterns
 */
function analyzeDiff(diff: string, summary: ChangeSummary = {}): DiffAnalysis {
  const lines = diff.split('\n');
  const lowerDiff = diff.toLowerCase();
  const files = extractFilesFromDiff(diff);

  const addedLines = lines.filter(l => l.startsWith('+') && !l.startsWith('+++'));
  const removedLines = lines.filter(l => l.startsWith('-') && !l.startsWith('---'));

  const additions = addedLines.length;
  const deletions = removedLines.length;

  const matchesAny = (patterns: RegExp[], text: string): boolean =>
    patterns.some(p => p.test(text));

  const patterns = {
    bugFix: [/\b(fix(e[ds])?|bug|error|issue|crash|incorrect|fault)\b/i],
    testFix: [/\b(fix|repair|correct).*(test|spec)\b/i],
    refactor: [/\b(refactor|cleanup|simplify|restructure|reorganize)\b/i],
    style: [/\b(format|lint|prettier|indent)\b/i]
  };

  const hasDocsChange = files.some(f =>
    /\.(md|rst|txt)$/i.test(f) || /readme/i.test(f)
  );

  const hasTestChange = files.some(f =>
    /(__tests__|\.test\.|\.spec\.)/i.test(f)
  );

  const hasConfigChange = files.some(f =>
    /\.(json|ya?ml|env|toml)$/i.test(f)
  );

  const hasDependencyChange = files.some(f =>
    /(package(-lock)?\.json|requirements\.txt|go\.mod|pom\.xml)/i.test(f)
  );

  const hasNewFunction =
    addedLines.some(l =>
      /^\+\s*(export\s+)?(async\s+)?function\s+\w+/.test(l) ||
      /^\+\s*(export\s+)?const\s+\w+\s*=\s*(async\s*)?\(/.test(l)
    );

  const hasNewClass =
    addedLines.some(l =>
      /^\+\s*(export\s+)?class\s+\w+/.test(l)
    );

  const hasNewEndpoint =
    addedLines.some(l =>
      /\b(app|router)\.(get|post|put|delete|patch)\b/i.test(l)
    ) ||
    /^\+\s*@(Get|Post|Put|Delete|Patch)\b/m.test(diff);

  const hasNewComponent =
    files.some(f => /\.(jsx|tsx)$/i.test(f)) &&
    addedLines.some(l =>
      /^\+\s*(export\s+)?(function|const)\s+[A-Z]\w*/.test(l)
    );

  const hasWhitespaceOnly =
    additions + deletions > 0 &&
    isTrivialWhitespace([...addedLines, ...removedLines]);

  return {
    hasBugFix: matchesAny(patterns.bugFix, diff),
    hasTestFix: hasTestChange && matchesAny(patterns.testFix, diff),

    hasNewFunction,
    hasNewClass,
    hasNewEndpoint,
    hasNewComponent,

    hasRefactor: matchesAny(patterns.refactor, diff),

    hasRename: (summary.renamed ?? 0) > 0,
    hasMovedCode: (summary.renamed ?? 0) > 0 && additions > 0 && deletions > 0,

    hasDocsChange,
    hasCommentChange: addedLines.some(l => /^\+\s*(\/\/|\/\*|\*)/.test(l)),
    hasTestChange,

    hasDeletions: deletions > 0,
    hasStyleChange: matchesAny(patterns.style, diff),

    hasWhitespaceOnly,
    hasConfigChange,
    hasDependencyChange,

    additions,
    deletions,
    hasChanges: additions + deletions > 0
  };
}

/**
 * Determine the commit intent type based on analysis
 * @param analysis - Analysis results from analyzeDiff
 * @param summary - Changes summary
 * @returns The intent type string
 */
function determineIntent(analysis: DiffAnalysis, summary: ChangeSummary = {}): string {
  if (!analysis.hasChanges) return 'Chore';

  if (analysis.hasBugFix || analysis.hasTestFix) return 'Bug Fix';
  if (analysis.hasTestChange && !analysis.hasBugFix) return 'Test';
  if (analysis.hasDocsChange) return 'Documentation';

  if (
    analysis.hasRefactor ||
    analysis.hasMovedCode ||
    (analysis.deletions > analysis.additions * 2)
  )
    return 'Refactor';

  if (
    analysis.hasNewFunction ||
    analysis.hasNewClass ||
    analysis.hasNewComponent ||
    analysis.hasNewEndpoint
  )
    return 'Feature';

  if (analysis.hasDependencyChange || analysis.hasConfigChange) return 'Chore';
  if (analysis.hasStyleChange || analysis.hasWhitespaceOnly) return 'Style';

  return 'Update';
}

/**
 * Generate a descriptive commit message based on analysis
 * @param analysis - Analysis results from analyzeDiff
 * @param intent - The determined intent type
 * @returns A commit message string
 */
function generateMessage(analysis: DiffAnalysis, intent: string, summary: ChangeSummary = {}): string {
  const fileCount = summary.total;
  const hasFileCount = typeof fileCount === 'number' && fileCount > 0;
  const fileWord = fileCount === 1 ? 'file' : 'files';

  switch (intent) {
    case 'Bug Fix':
      return analysis.hasTestFix
        ? hasFileCount
          ? `fix failing tests in ${fileCount} ${fileWord}`
          : 'fix failing tests'
        : hasFileCount
          ? `fix issues in ${fileCount} ${fileWord}`
          : 'fix issues';

    case 'Feature':
      if (analysis.hasNewEndpoint) return 'add new API endpoints';
      if (analysis.hasNewComponent) return 'add new components';
      if (analysis.hasNewClass || analysis.hasNewFunction)
        return hasFileCount
          ? `add new functionality to ${fileCount} ${fileWord}`
          : 'add new functionality';
      return hasFileCount
        ? `implement new features in ${fileCount} ${fileWord}`
        : 'implement new features';

    case 'Refactor':
      if (analysis.hasMovedCode)
        return hasFileCount
          ? `restructure code in ${fileCount} ${fileWord}`
          : 'restructure code';
      if (analysis.deletions > analysis.additions * 2)
        return hasFileCount
          ? `remove unused code from ${fileCount} ${fileWord}`
          : 'remove unused code';
      return hasFileCount
        ? `refactor code in ${fileCount} ${fileWord}`
        : 'refactor code';

    case 'Test':
      return hasFileCount
        ? `add/update tests in ${fileCount} ${fileWord}`
        : 'add/update tests';

    case 'Chore':
      if (analysis.hasDependencyChange) return 'update dependencies';
      if (analysis.hasConfigChange) return 'update configuration files';
      return 'update project configuration';

    case 'Style':
      return hasFileCount
        ? `format and style ${fileCount} ${fileWord}`
        : 'format and style code';

    case 'Documentation':
      return hasFileCount
        ? fileCount === 1
          ? 'update documentation'
          : `update documentation in ${fileCount} ${fileWord}`
        : 'update documentation';

    default:
      return hasFileCount
        ? `update ${fileCount} ${fileWord}`
        : 'update code';
  }
}

function generateFallbackCommit(diff: string, summary?: ChangeSummary): CommitSuggestion {
  const diffHash = crypto.createHash('sha1').update(diff).digest('hex');

  const analysis = analyzeDiff(diff, summary);
  const intent = determineIntent(analysis, summary);
  const message = generateMessage(analysis, intent, summary);

  const result = { intent, message };
  commitCache.set(diffHash, intent, message);

  return result;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}