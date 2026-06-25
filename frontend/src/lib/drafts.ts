const DRAFT_KEY_PREFIX = 'mint-draft-';

export interface Draft {
  topic: string;
  type: string;
  tone: string;
  savedAt: string;
}

export function saveDraft(userId: string, draft: Omit<Draft, 'savedAt'>): void {
  try {
    const key = `${DRAFT_KEY_PREFIX}${userId}`;
    const data: Draft = { ...draft, savedAt: new Date().toISOString() };
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // silently fail
  }
}

export function loadDraft(userId: string): Draft | null {
  try {
    const key = `${DRAFT_KEY_PREFIX}${userId}`;
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as Draft;
  } catch {
    return null;
  }
}

export function clearDraft(userId: string): void {
  try {
    const key = `${DRAFT_KEY_PREFIX}${userId}`;
    localStorage.removeItem(key);
  } catch {
    // silently fail
  }
}
