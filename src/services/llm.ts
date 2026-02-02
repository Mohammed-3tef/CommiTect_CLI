import axios, { AxiosError } from 'axios';
import crypto from 'crypto';
import { commitCache } from '../utils/cache.js';

export interface CommitSuggestion {
  intent: string;
  message: string;
}

const API_ENDPOINT = 'http://commitintentdetector.runasp.net/api/Commit/analyze';

export async function generateCommitMessage(diff: string): Promise<CommitSuggestion> {
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
  return generateFallbackCommit(diff);
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

function generateFallbackCommit(diff: string): CommitSuggestion {
  const diffHash = crypto.createHash('sha1').update(diff).digest('hex');
  const lowerDiff = diff.toLowerCase();

  let intent: CommitSuggestion['intent'];
  let message: string;

  if (/(fix|bug|error|issue|crash|fault)/i.test(lowerDiff)) {
    intent = 'Bug Fix';
    message = 'fix reported issue';
  } 
  else if (/(add|create|implement|introduce|new)/i.test(lowerDiff)) {
    intent = 'Feature';
    message = 'add new functionality';
  } 
  else if (/(refactor|cleanup|restructure|optimize)/i.test(lowerDiff)) {
    intent = 'Refactor';
    message = 'refactor code structure';
  } 
  else if (/(doc|readme|comment)/i.test(lowerDiff)) {
    intent = 'Docs';
    message = 'update documentation';
  } 
  else if (/(test|spec|coverage)/i.test(lowerDiff)) {
    intent = 'Test';
    message = 'update tests';
  } 
  else {
    intent = 'Chore';
    message = 'update project files';
  }

  commitCache.set(diffHash, intent, message);
  return { intent, message };
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
