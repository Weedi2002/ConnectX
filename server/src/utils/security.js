import xss from 'xss';

/**
 * Escape special regex characters in a string to prevent ReDoS and injection.
 */
export function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Sanitize a string to strip HTML tags and prevent XSS.
 */
export function sanitize(str) {
  if (typeof str !== 'string') return str;
  return xss(str, {
    whiteList: {},
    stripIgnoreTag: true,
    stripIgnoreTagBody: ['script', 'style'],
  });
}
