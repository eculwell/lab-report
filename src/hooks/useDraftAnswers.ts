'use client';

import { useCallback } from 'react';

// Images larger than this are not persisted — base64 would exceed localStorage quota
const MAX_IMAGE_PERSIST_BYTES = 2 * 1024 * 1024; // 2 MB

export type DraftData = {
  studentName: string;
  textAnswers: Record<string, string>;
  imageDataUrls: Record<string, string>; // base64 data URLs
};

function emptyDraft(): DraftData {
  return { studentName: '', textAnswers: {}, imageDataUrls: {} };
}

function readStorage(key: string): DraftData {
  try {
    if (typeof window === 'undefined') return emptyDraft();
    const raw = localStorage.getItem(key);
    return raw ? { ...emptyDraft(), ...JSON.parse(raw) } : emptyDraft();
  } catch {
    return emptyDraft();
  }
}

function writeStorage(key: string, data: DraftData): void {
  try {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // Quota exceeded or storage unavailable — fail silently
  }
}

export function useDraftAnswers(labId: string) {
  const storageKey = `lab-draft-${labId}`;

  const loadDraft = useCallback((): DraftData => {
    return readStorage(storageKey);
  }, [storageKey]);

  const saveStudentName = useCallback((name: string) => {
    const draft = readStorage(storageKey);
    writeStorage(storageKey, { ...draft, studentName: name });
  }, [storageKey]);

  const saveText = useCallback((questionId: string, value: string) => {
    const draft = readStorage(storageKey);
    writeStorage(storageKey, {
      ...draft,
      textAnswers: { ...draft.textAnswers, [questionId]: value },
    });
  }, [storageKey]);

  const saveImage = useCallback((questionId: string, file: File) => {
    if (file.size > MAX_IMAGE_PERSIST_BYTES) return; // skip files that are too large
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (!dataUrl) return;
      const draft = readStorage(storageKey);
      writeStorage(storageKey, {
        ...draft,
        imageDataUrls: { ...draft.imageDataUrls, [questionId]: dataUrl },
      });
    };
    reader.readAsDataURL(file);
  }, [storageKey]);

  const clearImage = useCallback((questionId: string) => {
    const draft = readStorage(storageKey);
    const imageDataUrls = { ...draft.imageDataUrls };
    delete imageDataUrls[questionId];
    writeStorage(storageKey, { ...draft, imageDataUrls });
  }, [storageKey]);

  const clearDraft = useCallback(() => {
    try {
      if (typeof window !== 'undefined') localStorage.removeItem(storageKey);
    } catch {}
  }, [storageKey]);

  return { loadDraft, saveStudentName, saveText, saveImage, clearImage, clearDraft };
}

/**
 * Convert a saved base64 data URL back into a File object so it can be
 * submitted via FormData exactly like a freshly-picked file.
 */
export function dataUrlToFile(dataUrl: string, filename = 'restored-image.jpg'): File {
  const [header, data] = dataUrl.split(',');
  const mime = header.match(/:(.*?);/)?.[1] ?? 'image/jpeg';
  const binary = atob(data);
  const arr = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
  return new File([arr], filename, { type: mime });
}
