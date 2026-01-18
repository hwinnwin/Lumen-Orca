/**
 * AI Builder Platform — Storage Service
 *
 * Persistence layer for AI objects with Supabase integration.
 */

import { supabase } from '@/integrations/supabase/client';
import type { AIObject, AIObjectId, UserId } from '@lumen-orca/ai-builder';

// ============================================================================
// TYPES
// ============================================================================

export interface StoredAIObject {
  id: string;
  user_id: string;
  name: string;
  data: AIObject;
  status: 'draft' | 'active' | 'locked' | 'archived';
  created_at: string;
  updated_at: string;
  locked_at: string | null;
}

export interface AIObjectListItem {
  id: AIObjectId;
  name: string;
  status: AIObject['status'];
  purposeCategory: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface StorageResult<T> {
  data: T | null;
  error: Error | null;
}

// ============================================================================
// STORAGE SERVICE
// ============================================================================

class AIBuilderStorageService {
  private readonly tableName = 'ai_objects';

  /**
   * Save an AI object to storage
   */
  async save(aiObject: AIObject): Promise<StorageResult<AIObject>> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        return { data: null, error: new Error('User not authenticated') };
      }

      const record: Partial<StoredAIObject> = {
        id: aiObject.id,
        user_id: userData.user.id,
        name: aiObject.name,
        data: aiObject,
        status: aiObject.status,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from(this.tableName)
        .upsert(record, { onConflict: 'id' })
        .select()
        .single();

      if (error) {
        return { data: null, error: new Error(error.message) };
      }

      return { data: (data as StoredAIObject).data, error: null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
    }
  }

  /**
   * Get an AI object by ID
   */
  async get(id: AIObjectId): Promise<StorageResult<AIObject>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        return { data: null, error: new Error(error.message) };
      }

      const stored = data as StoredAIObject;
      return { data: this.restoreDates(stored.data), error: null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
    }
  }

  /**
   * List all AI objects for the current user
   */
  async list(): Promise<StorageResult<AIObjectListItem[]>> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        return { data: null, error: new Error('User not authenticated') };
      }

      const { data, error } = await supabase
        .from(this.tableName)
        .select('id, name, status, data, created_at, updated_at')
        .eq('user_id', userData.user.id)
        .order('updated_at', { ascending: false });

      if (error) {
        return { data: null, error: new Error(error.message) };
      }

      const items: AIObjectListItem[] = (data as StoredAIObject[]).map(row => ({
        id: row.id as AIObjectId,
        name: row.name,
        status: row.status,
        purposeCategory: row.data?.purpose?.category || 'custom',
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      }));

      return { data: items, error: null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
    }
  }

  /**
   * Delete an AI object
   */
  async delete(id: AIObjectId): Promise<StorageResult<boolean>> {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', id);

      if (error) {
        return { data: false, error: new Error(error.message) };
      }

      return { data: true, error: null };
    } catch (err) {
      return { data: false, error: err instanceof Error ? err : new Error(String(err)) };
    }
  }

  /**
   * Lock an AI object
   */
  async lock(id: AIObjectId, reason?: string): Promise<StorageResult<AIObject>> {
    try {
      const { data: existing } = await this.get(id);
      if (!existing) {
        return { data: null, error: new Error('AI object not found') };
      }

      const locked: AIObject = {
        ...existing,
        status: 'locked',
        lockedAt: new Date(),
        version: {
          ...existing.version,
          isLocked: true,
          lockReason: reason,
        },
      };

      return this.save(locked);
    } catch (err) {
      return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
    }
  }

  /**
   * Clone an AI object with a new name
   */
  async clone(id: AIObjectId, newName: string): Promise<StorageResult<AIObject>> {
    try {
      const { data: existing } = await this.get(id);
      if (!existing) {
        return { data: null, error: new Error('AI object not found') };
      }

      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        return { data: null, error: new Error('User not authenticated') };
      }

      const cloned: AIObject = {
        ...existing,
        id: `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` as AIObjectId,
        name: newName,
        ownerId: userData.user.id as UserId,
        status: 'draft',
        createdAt: new Date(),
        updatedAt: new Date(),
        lockedAt: undefined,
        version: {
          currentVersionId: `v_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` as any,
          versionNumber: '1.0.0',
          history: [],
          isLocked: false,
        },
      };

      return this.save(cloned);
    } catch (err) {
      return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
    }
  }

  /**
   * Search AI objects by name
   */
  async search(query: string): Promise<StorageResult<AIObjectListItem[]>> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        return { data: null, error: new Error('User not authenticated') };
      }

      const { data, error } = await supabase
        .from(this.tableName)
        .select('id, name, status, data, created_at, updated_at')
        .eq('user_id', userData.user.id)
        .ilike('name', `%${query}%`)
        .order('updated_at', { ascending: false });

      if (error) {
        return { data: null, error: new Error(error.message) };
      }

      const items: AIObjectListItem[] = (data as StoredAIObject[]).map(row => ({
        id: row.id as AIObjectId,
        name: row.name,
        status: row.status,
        purposeCategory: row.data?.purpose?.category || 'custom',
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      }));

      return { data: items, error: null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
    }
  }

  /**
   * Get AI objects by status
   */
  async listByStatus(status: AIObject['status']): Promise<StorageResult<AIObjectListItem[]>> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        return { data: null, error: new Error('User not authenticated') };
      }

      const { data, error } = await supabase
        .from(this.tableName)
        .select('id, name, status, data, created_at, updated_at')
        .eq('user_id', userData.user.id)
        .eq('status', status)
        .order('updated_at', { ascending: false });

      if (error) {
        return { data: null, error: new Error(error.message) };
      }

      const items: AIObjectListItem[] = (data as StoredAIObject[]).map(row => ({
        id: row.id as AIObjectId,
        name: row.name,
        status: row.status,
        purposeCategory: row.data?.purpose?.category || 'custom',
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      }));

      return { data: items, error: null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
    }
  }

  /**
   * Restore Date objects from stored JSON
   */
  private restoreDates(ai: AIObject): AIObject {
    return {
      ...ai,
      createdAt: new Date(ai.createdAt),
      updatedAt: new Date(ai.updatedAt),
      lockedAt: ai.lockedAt ? new Date(ai.lockedAt) : undefined,
      version: {
        ...ai.version,
        history: ai.version.history.map(entry => ({
          ...entry,
          createdAt: new Date(entry.createdAt),
        })),
      },
    };
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let storageInstance: AIBuilderStorageService | null = null;

export function getAIBuilderStorage(): AIBuilderStorageService {
  if (!storageInstance) {
    storageInstance = new AIBuilderStorageService();
  }
  return storageInstance;
}

// ============================================================================
// LOCAL STORAGE FALLBACK
// ============================================================================

const LOCAL_STORAGE_KEY = 'lumen_ai_builder_objects';

export class LocalAIBuilderStorage {
  save(aiObject: AIObject): void {
    const existing = this.list();
    const index = existing.findIndex(ai => ai.id === aiObject.id);
    if (index >= 0) {
      existing[index] = aiObject;
    } else {
      existing.push(aiObject);
    }
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(existing));
  }

  get(id: AIObjectId): AIObject | null {
    const all = this.list();
    const found = all.find(ai => ai.id === id);
    return found || null;
  }

  list(): AIObject[] {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (!stored) return [];
      const parsed = JSON.parse(stored);
      return parsed.map((ai: AIObject) => ({
        ...ai,
        createdAt: new Date(ai.createdAt),
        updatedAt: new Date(ai.updatedAt),
        lockedAt: ai.lockedAt ? new Date(ai.lockedAt) : undefined,
      }));
    } catch {
      return [];
    }
  }

  delete(id: AIObjectId): void {
    const existing = this.list();
    const filtered = existing.filter(ai => ai.id !== id);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));
  }

  clear(): void {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  }
}

export function getLocalAIBuilderStorage(): LocalAIBuilderStorage {
  return new LocalAIBuilderStorage();
}
