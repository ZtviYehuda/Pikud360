import { describe, it, expect, beforeEach } from 'vitest';
import { useUIStore } from '../stores/uiStore';

describe('UI Zustand Store', () => {
  beforeEach(() => {
    // Reset state before each test if needed
    useUIStore.getState().setLanguage('en');
  });

  it('should toggle theme from initial state', () => {
    const store = useUIStore.getState();
    const initialTheme = store.theme;
    
    store.toggleTheme();
    
    const updatedTheme = useUIStore.getState().theme;
    expect(updatedTheme).not.toBe(initialTheme);
  });

  it('should change language and update layout direction', () => {
    const store = useUIStore.getState();
    
    store.setLanguage('he');
    
    expect(useUIStore.getState().language).toBe('he');
    expect(useUIStore.getState().direction).toBe('rtl');
    
    store.setLanguage('en');
    expect(useUIStore.getState().language).toBe('en');
    expect(useUIStore.getState().direction).toBe('ltr');
  });
});
