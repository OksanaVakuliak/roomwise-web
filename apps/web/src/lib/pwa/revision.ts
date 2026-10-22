import { spawnSync } from 'node:child_process';
import crypto from 'node:crypto';

export function buildRevision(): string {
  if (process.env.VERCEL_GIT_COMMIT_SHA) {
    return process.env.VERCEL_GIT_COMMIT_SHA;
  }
  const git = spawnSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf-8' });
  const sha = git.status === 0 ? git.stdout.trim() : '';
  return sha || crypto.randomUUID();
}
