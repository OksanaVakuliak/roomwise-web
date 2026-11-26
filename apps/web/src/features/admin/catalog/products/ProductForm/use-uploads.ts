'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { type UploadedImage, uploadImage } from '@/lib/admin-api/upload';

export type UploadEntry = {
  localId: string;
  previewUrl: string;
  progress: number;
  state: 'uploading' | 'error';
  errorText?: string;
};

export type UploadDone = {
  localId: string;
  previewUrl: string;
  image: UploadedImage;
};

export type UploadOptions = { realSizeMm?: number };

type UseUploadsOptions = {
  withReauth: <T>(run: () => Promise<T>) => Promise<T>;
  single?: boolean;
  keepPreview?: boolean;
  describe: (failure: unknown) => string;
  onDone: (done: UploadDone) => void;
};

export function useUploads({
  withReauth,
  single,
  keepPreview,
  describe,
  onDone,
}: UseUploadsOptions) {
  const [entries, setEntries] = useState<UploadEntry[]>([]);
  const urls = useRef(new Set<string>());
  const delivered = useRef(new Set<string>());
  const controllers = useRef(new Map<string, AbortController>());
  const latest = useRef({ describe, onDone });
  latest.current = { describe, onDone };

  useEffect(() => {
    const active = controllers.current;
    const created = urls.current;
    return () => {
      for (const controller of active.values()) controller.abort();
      for (const url of created) URL.revokeObjectURL(url);
    };
  }, []);

  const patch = useCallback((localId: string, next: Partial<UploadEntry>) => {
    setEntries((current) =>
      current.map((entry) =>
        entry.localId === localId ? { ...entry, ...next } : entry,
      ),
    );
  }, []);

  const release = useCallback((url: string) => {
    delivered.current.delete(url);
    if (urls.current.delete(url)) URL.revokeObjectURL(url);
  }, []);

  const prune = useCallback(
    (keep: string[]) => {
      for (const url of [...delivered.current]) {
        if (!keep.includes(url)) release(url);
      }
    },
    [release],
  );

  const remove = useCallback(
    (localId: string) => {
      controllers.current.get(localId)?.abort();
      controllers.current.delete(localId);
      setEntries((current) => {
        const entry = current.find((item) => item.localId === localId);
        if (entry) release(entry.previewUrl);
        return current.filter((item) => item.localId !== localId);
      });
    },
    [release],
  );

  const start = useCallback(
    async (file: File, options: UploadOptions) => {
      const localId = crypto.randomUUID();
      const previewUrl = URL.createObjectURL(file);
      const controller = new AbortController();
      urls.current.add(previewUrl);
      controllers.current.set(localId, controller);
      setEntries((current) => [
        ...current,
        { localId, previewUrl, progress: 0, state: 'uploading' },
      ]);
      try {
        const image = await withReauth(() => {
          patch(localId, { progress: 0 });
          return uploadImage(file, {
            ...options,
            signal: controller.signal,
            onProgress: (progress) => patch(localId, { progress }),
          });
        });
        controllers.current.delete(localId);
        setEntries((current) =>
          current.filter((entry) => entry.localId !== localId),
        );
        latest.current.onDone({ localId, previewUrl, image });
        if (keepPreview) delivered.current.add(previewUrl);
        else release(previewUrl);
      } catch (failure) {
        if (controller.signal.aborted) return;
        controllers.current.delete(localId);
        patch(localId, {
          state: 'error',
          errorText: latest.current.describe(failure),
        });
      }
    },
    [patch, keepPreview, release, withReauth],
  );

  const add = useCallback(
    (files: File[], options: UploadOptions = {}) => {
      const chosen = single ? files.slice(0, 1) : files;
      if (single) {
        for (const entry of entries) remove(entry.localId);
      }
      for (const file of chosen) void start(file, options);
    },
    [single, entries, remove, start],
  );

  const clear = useCallback(() => {
    setEntries((current) => {
      if (current.length === 0) return current;
      for (const entry of current) {
        controllers.current.get(entry.localId)?.abort();
        controllers.current.delete(entry.localId);
        release(entry.previewUrl);
      }
      return [];
    });
  }, [release]);

  const busy = entries.some((entry) => entry.state === 'uploading');

  return { entries, add, remove, clear, release, prune, busy };
}
