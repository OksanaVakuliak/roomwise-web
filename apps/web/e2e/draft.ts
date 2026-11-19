import type { Page } from '@playwright/test';
import { DRAFT_VERSION } from '@/lib/draft/migrate';
import { DRAFT_STORAGE_KEY } from '@/stores/draft';
import type { DraftV1 } from '@/test/fixtures';

export async function seedDraft(page: Page, draft: DraftV1) {
  await page.addInitScript(
    ([key, value]) => {
      window.localStorage.setItem(key, value);
    },
    [
      DRAFT_STORAGE_KEY,
      JSON.stringify({ state: draft, version: DRAFT_VERSION }),
    ] as const,
  );
}
