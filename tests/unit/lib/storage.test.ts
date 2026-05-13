import { describe, it, expect, beforeEach } from 'vitest';
import { loadState, saveState, clearState, type Persisted } from '@/lib/storage';

beforeEach(() => localStorage.clear());

describe('storage', () => {
  it('round-trips canonical shape', () => {
    const state: Persisted = {
      schemaVersion: 1, input: '{"a":1}', tool: 'beautify',
      options: { indent: 2, sortKeys: false }, theme: 'auto',
    };
    saveState(state);
    expect(loadState()).toEqual(state);
  });

  it('discards a schemaVersion mismatch', () => {
    localStorage.setItem('jsontools:v1', JSON.stringify({ schemaVersion: 99 }));
    expect(loadState()).toBeNull();
  });

  it('discards malformed JSON', () => {
    localStorage.setItem('jsontools:v1', 'not json');
    expect(loadState()).toBeNull();
  });

  it('clearState removes the entry', () => {
    saveState({ schemaVersion: 1, input: '', tool: 'beautify',
      options: { indent: 2, sortKeys: false }, theme: 'auto' });
    clearState();
    expect(loadState()).toBeNull();
  });

  it('saveState swallows quota errors', () => {
    const orig = Storage.prototype.setItem;
    Storage.prototype.setItem = () => { throw new Error('QuotaExceededError'); };
    expect(() => saveState({ schemaVersion: 1, input: '', tool: 'beautify',
      options: { indent: 2, sortKeys: false }, theme: 'auto' })).not.toThrow();
    Storage.prototype.setItem = orig;
  });
});
