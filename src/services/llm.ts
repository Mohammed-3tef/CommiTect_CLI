import axios, { AxiosError } from 'axios';
import { commitCache } from '../utils/cache.js';

export interface CommitSuggestion {
  intent: string;
  message: string;
}

const API_ENDPOINT = 'http://commitintentdetector.runasp.net/api/Commit/analyze';

export async function generateCommitMessage(diff: string): Promise<CommitSuggestion> {
  // Check cache first
  const cached = commitCache.get(diff);
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
          timeout: 30000 // 30 second timeout
        }
      );

      // API returns: { intent: "Intent: Feature\nMessage: Add subtraction support function" }
      const data = response.data;
      
      if (!data || !data.intent) {
        throw new Error('Invalid response format from API');
      }

      const result = parseResponse(data.intent);
      
      // Cache the result
      commitCache.set(diff, result.intent, result.message);

      return result;

    } catch (error) {
      lastError = error as Error;

      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        
        // Handle rate limiting (429)
        if (axiosError.response?.status === 429) {
          if (attempt < maxRetries) {
            await sleep(1000 * attempt); // Exponential backoff
            continue;
          }
          throw new Error('API rate limit reached. Please try again later.');
        }

        // Handle server errors (5xx) - retry
        if (axiosError.response?.status && axiosError.response.status >= 500) {
          if (attempt < maxRetries) {
            await sleep(1000 * attempt);
            continue;
          }
        }

        // Handle network errors - retry
        if (axiosError.code === 'ECONNREFUSED' || axiosError.code === 'ETIMEDOUT') {
          if (attempt < maxRetries) {
            await sleep(1000 * attempt);
            continue;
          }
          throw new Error('Unable to connect to API. Please check your network connection.');
        }
      }

      // Don't retry on client errors (4xx) except 429
      if (axios.isAxiosError(error) && error.response?.status && error.response.status < 500 && error.response.status !== 429) {
        break;
      }

      // Retry on other errors
      if (attempt < maxRetries) {
        await sleep(1000 * attempt);
        continue;
      }
    }
  }

  throw new Error('Failed to generate commit message. Please check your API configuration.');
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

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}