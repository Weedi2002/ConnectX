import { escapeRegex, sanitize } from '../src/utils/security.js';

describe('Security Utils', () => {
  describe('escapeRegex', () => {
    it('should escape special regex characters', () => {
      expect(escapeRegex('(a+)+$')).toBe('\\(a\\+\\)\\+\\$');
      expect(escapeRegex('[test]')).toBe('\\[test\\]');
      expect(escapeRegex('hello.world')).toBe('hello\\.world');
    });

    it('should return plain text unchanged', () => {
      expect(escapeRegex('hello')).toBe('hello');
      expect(escapeRegex('test123')).toBe('test123');
    });

    it('should handle empty string', () => {
      expect(escapeRegex('')).toBe('');
    });
  });

  describe('sanitize', () => {
    it('should strip HTML tags', () => {
      const scriptResult = sanitize('<script>alert("xss")</script>');
      expect(scriptResult).not.toContain('<script>');
      expect(scriptResult).not.toContain('</script>');
      expect(sanitize('<b>bold</b>')).toBe('bold');
      expect(sanitize('<img src="x" onerror="alert(1)">')).toBe('');
    });

    it('should preserve plain text', () => {
      expect(sanitize('hello world')).toBe('hello world');
      expect(sanitize('test123')).toBe('test123');
    });

    it('should handle non-string input', () => {
      expect(sanitize(null)).toBe(null);
      expect(sanitize(undefined)).toBe(undefined);
      expect(sanitize(123)).toBe(123);
    });

    it('should strip nested tags', () => {
      const result = sanitize('<div><script>alert(1)</script></div>');
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('<div>');
    });
  });
});
