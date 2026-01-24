import { createHash } from 'crypto';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { homedir } from 'os';
import { join, basename } from 'path';

interface CacheEntry {
  hash: string;
  intent: string;
  message: string;
  timestamp: number;
  folder: string;
}

const CACHE_DIR = join(homedir(), '.commitect');
const CACHE_FILE = join(CACHE_DIR, 'cache.json');
const CACHE_MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

class CommitCache {
  private cache: Map<string, CacheEntry>;

  constructor() {
    this.cache = new Map();
    this.loadCache();
  }

  /**
   * Generate a hash from the git diff
   */
  private hashDiff(diff: string): string {
    return createHash('sha256').update(diff.trim()).digest('hex');
  }

  /**
   * Get current folder name
   */
  private getCurrentFolder(): string {
    return basename(process.cwd());
  }

  /**
   * Load cache from disk
   */
  private loadCache(): void {
    try {
      if (!existsSync(CACHE_DIR)) {
        mkdirSync(CACHE_DIR, { recursive: true });
      }

      if (existsSync(CACHE_FILE)) {
        const data = readFileSync(CACHE_FILE, 'utf-8');
        const entries: CacheEntry[] = JSON.parse(data);
        
        // Load valid entries (not expired)
        const now = Date.now();
        entries.forEach(entry => {
          if (now - entry.timestamp < CACHE_MAX_AGE) {
            this.cache.set(entry.hash, entry);
          }
        });
      }
    } catch (error) {
      // If cache is corrupted, start fresh
      this.cache.clear();
    }
  }

  /**
   * Save cache to disk
   */
  private saveCache(): void {
    try {
      if (!existsSync(CACHE_DIR)) {
        mkdirSync(CACHE_DIR, { recursive: true });
      }

      const entries = Array.from(this.cache.values());
      writeFileSync(CACHE_FILE, JSON.stringify(entries, null, 2), 'utf-8');
    } catch (error) {
      // Silently fail - caching is optional
      console.warn('Warning: Failed to save cache');
    }
  }

  /**
   * Get cached commit message for a diff
   */
  get(diff: string): { intent: string; message: string; folder: string } | null {
    const hash = this.hashDiff(diff);
    const entry = this.cache.get(hash);

    if (!entry) {
      return null;
    }

    // Check if entry is still valid
    const now = Date.now();
    if (now - entry.timestamp > CACHE_MAX_AGE) {
      this.cache.delete(hash);
      this.saveCache();
      return null;
    }

    return {
      intent: entry.intent,
      message: entry.message,
      folder: entry.folder
    };
  }

  /**
   * Store a commit message in cache
   */
  set(diff: string, intent: string, message: string): void {
    const hash = this.hashDiff(diff);
    
    this.cache.set(hash, {
      hash,
      intent,
      message,
      timestamp: Date.now(),
      folder: this.getCurrentFolder()
    });

    this.saveCache();
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
    this.saveCache();
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; oldestEntry: number | null } {
    const entries = Array.from(this.cache.values());
    const oldestEntry = entries.length > 0 
      ? Math.min(...entries.map(e => e.timestamp))
      : null;

    return {
      size: this.cache.size,
      oldestEntry
    };
  }

  /**
   * Get all cache entries sorted by timestamp (newest first)
   */
  getHistory(): CacheEntry[] {
    const entries = Array.from(this.cache.values());
    return entries.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Get cache entries for a specific folder
   */
  getHistoryByFolder(folder: string): CacheEntry[] {
    const entries = Array.from(this.cache.values());
    return entries
      .filter(entry => entry.folder === folder)
      .sort((a, b) => b.timestamp - a.timestamp);
  }
}

// Singleton instance
export const commitCache = new CommitCache();