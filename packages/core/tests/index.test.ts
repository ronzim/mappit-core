import { describe, it, expect } from 'vitest';
import { VERSION } from '../src/index.js';

describe('mappit-core', () => {
    it('exports VERSION', () => {
        expect(VERSION).toBe('0.1.0');
    });
});
