import { describe, it, expect, beforeEach } from 'vitest';
import { buildUrl, migrateToNewBaseUrl, setBaseUrl, clearBaseUrl } from './urlHelper';

describe('URL Helper Edge Cases', () => {
  beforeEach(() => {
    clearBaseUrl();
    localStorage.clear();
    Object.defineProperty(window, 'location', {
      value: { origin: 'http://localhost:5173' },
      writable: true
    });
  });

  describe('buildUrl edge cases', () => {
    it('should handle empty paths', () => {
      setBaseUrl('https://example.com');
      expect(buildUrl('')).toBe('https://example.com/');
    });

    it('should handle URLs with query parameters', () => {
      setBaseUrl('https://example.com');
      expect(buildUrl('/api?param=value')).toBe('https://example.com/api?param=value');
      expect(buildUrl('/api?param1=value1&param2=value2')).toBe('https://example.com/api?param1=value1&param2=value2');
    });

    it('should handle URLs with hash fragments', () => {
      setBaseUrl('https://example.com');
      expect(buildUrl('/page#section')).toBe('https://example.com/page#section');
      expect(buildUrl('/page#section/subsection')).toBe('https://example.com/page#section/subsection');
    });

    it('should handle URLs with both query and hash', () => {
      setBaseUrl('https://example.com');
      expect(buildUrl('/page?param=value#section')).toBe('https://example.com/page?param=value#section');
    });

    it('should handle protocol-relative URLs', () => {
      expect(buildUrl('//cdn.example.com/resource')).toBe('//cdn.example.com/resource');
      expect(buildUrl('//cdn.example.com/resource?v=1.0')).toBe('//cdn.example.com/resource?v=1.0');
    });

    it('should handle multiple slashes in path', () => {
      setBaseUrl('https://example.com');
      expect(buildUrl('//path//to///resource')).toBe('//path//to///resource'); // Protocol relative
      expect(buildUrl('/path//to///resource')).toBe('https://example.com/path//to///resource');
    });

    it('should handle special characters in path', () => {
      setBaseUrl('https://example.com');
      expect(buildUrl('/path/with spaces/file.txt')).toBe('https://example.com/path/with spaces/file.txt');
      expect(buildUrl('/path/with%20encoded/file.txt')).toBe('https://example.com/path/with%20encoded/file.txt');
    });

    it('should handle base URL with trailing slash', () => {
      setBaseUrl('https://example.com/');
      expect(buildUrl('/path')).toBe('https://example.com/path');
      expect(buildUrl('path')).toBe('https://example.com/path');
    });

    it('should handle base URL with path', () => {
      setBaseUrl('https://example.com/app');
      expect(buildUrl('/resource')).toBe('https://example.com/app/resource');
      expect(buildUrl('resource')).toBe('https://example.com/app/resource');
    });

    it('should handle data URLs', () => {
      setBaseUrl('https://example.com');
      const dataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      expect(buildUrl(dataUrl)).toBe(dataUrl);
    });

    it('should handle blob URLs', () => {
      setBaseUrl('https://example.com');
      const blobUrl = 'blob:https://example.com/550e8400-e29b-41d4-a716-446655440000';
      expect(buildUrl(blobUrl)).toBe(blobUrl);
    });

    it('should handle file URLs', () => {
      setBaseUrl('https://example.com');
      const fileUrl = 'file:///C:/Users/test/document.pdf';
      expect(buildUrl(fileUrl)).toBe(fileUrl);
    });
  });

  describe('migrateToNewBaseUrl edge cases', () => {
    it('should handle complex nested localStorage data', () => {
      const complexData = {
        pages: [
          {
            url: 'http://old.com/page1',
            assets: ['http://old.com/asset1.js', 'http://old.com/asset2.css'],
            nested: {
              icon: 'http://old.com/icon.svg',
              data: { link: 'http://old.com/link' }
            }
          },
          {
            url: 'http://old.com/page2',
            assets: ['http://old.com/asset3.js'],
            unrelatedUrl: 'https://external.com/resource'
          }
        ],
        config: {
          baseUrl: 'http://old.com',
          apiEndpoint: 'http://old.com/api'
        }
      };

      localStorage.setItem('workspace_pages', JSON.stringify(complexData));

      migrateToNewBaseUrl('http://new.com', 'http://old.com');

      const migrated = JSON.parse(localStorage.getItem('workspace_pages')!);
      expect(migrated.pages[0].url).toBe('http://new.com/page1');
      expect(migrated.pages[0].assets[0]).toBe('http://new.com/asset1.js');
      expect(migrated.pages[0].assets[1]).toBe('http://new.com/asset2.css');
      expect(migrated.pages[0].nested.icon).toBe('http://new.com/icon.svg');
      expect(migrated.pages[0].nested.data.link).toBe('http://new.com/link');
      expect(migrated.pages[1].url).toBe('http://new.com/page2');
      expect(migrated.pages[1].unrelatedUrl).toBe('https://external.com/resource');
      expect(migrated.config.baseUrl).toBe('http://new.com');
      expect(migrated.config.apiEndpoint).toBe('http://new.com/api');
    });

    it('should handle localStorage with mixed content types', () => {
      localStorage.setItem('workspace_string', 'http://old.com/resource');
      localStorage.setItem('config_json', JSON.stringify({ url: 'http://old.com/api' }));
      localStorage.setItem('mixed_content', 'Some text with http://old.com/link in it');
      localStorage.setItem('number_value', '42');
      localStorage.setItem('boolean_value', 'true');

      migrateToNewBaseUrl('http://new.com', 'http://old.com');

      expect(localStorage.getItem('workspace_string')).toBe('http://new.com/resource');
      expect(JSON.parse(localStorage.getItem('config_json')!).url).toBe('http://new.com/api');
      expect(localStorage.getItem('mixed_content')).toBe('Some text with http://new.com/link in it');
      expect(localStorage.getItem('number_value')).toBe('42');
      expect(localStorage.getItem('boolean_value')).toBe('true');
    });

    it('should handle URLs with ports', () => {
      localStorage.setItem('config_dev', 'http://localhost:3000/app');
      localStorage.setItem('config_prod', 'https://example.com:8080/app');

      migrateToNewBaseUrl('https://new.com:9000', 'http://localhost:3000');
      expect(localStorage.getItem('config_dev')).toBe('https://new.com:9000/app');

      migrateToNewBaseUrl('https://final.com', 'https://example.com:8080');
      expect(localStorage.getItem('config_prod')).toBe('https://final.com/app');
    });

    it('should handle case-sensitive URL replacements', () => {
      localStorage.setItem('config_test', JSON.stringify({
        url1: 'http://Old.Com/resource',
        url2: 'HTTP://OLD.COM/RESOURCE',
        url3: 'http://old.com/resource'
      }));

      migrateToNewBaseUrl('http://new.com', 'http://old.com');

      const migrated = JSON.parse(localStorage.getItem('config_test')!);
      expect(migrated.url1).toBe('http://Old.Com/resource'); // Should not change (case mismatch)
      expect(migrated.url2).toBe('HTTP://OLD.COM/RESOURCE'); // Should not change (case mismatch)
      expect(migrated.url3).toBe('http://new.com/resource'); // Should change (exact match)
    });

    it('should handle empty localStorage', () => {
      migrateToNewBaseUrl('http://new.com', 'http://old.com');
      expect(localStorage.length).toBe(0);
    });

    it('should handle localStorage with no matching URLs', () => {
      localStorage.setItem('config_1', 'https://different.com/resource');
      localStorage.setItem('config_2', JSON.stringify({ url: 'https://another.com/api' }));

      migrateToNewBaseUrl('http://new.com', 'http://old.com');

      expect(localStorage.getItem('config_1')).toBe('https://different.com/resource');
      expect(JSON.parse(localStorage.getItem('config_2')!).url).toBe('https://another.com/api');
    });

    it('should handle partial URL matches correctly', () => {
      localStorage.setItem('config_test', JSON.stringify({
        correctUrl: 'http://old.com/resource',
        partialMatch: 'http://old.com.evil.com/resource',
        substringMatch: 'http://notold.com/resource'
      }));

      migrateToNewBaseUrl('http://new.com', 'http://old.com');

      const migrated = JSON.parse(localStorage.getItem('config_test')!);
      expect(migrated.correctUrl).toBe('http://new.com/resource');
      expect(migrated.partialMatch).toBe('http://new.com.evil.com/resource'); // This might be unintended
      expect(migrated.substringMatch).toBe('http://notold.com/resource'); // Should not change
    });

    it('should handle very long URLs', () => {
      const longPath = '/very/' + 'long/'.repeat(100) + 'path.html';
      const oldUrl = `http://old.com${longPath}`;
      const expectedNewUrl = `http://new.com${longPath}`;

      localStorage.setItem('config_long', oldUrl);

      migrateToNewBaseUrl('http://new.com', 'http://old.com');

      expect(localStorage.getItem('config_long')).toBe(expectedNewUrl);
    });

    it('should handle special regex characters in URLs', () => {
      localStorage.setItem('config_test', 'http://old.com/path?param=$value&test=.*');

      migrateToNewBaseUrl('http://new.com', 'http://old.com');

      expect(localStorage.getItem('config_test')).toBe('http://new.com/path?param=$value&test=.*');
    });

    it('should handle unicode characters in URLs', () => {
      localStorage.setItem('config_unicode', 'http://old.com/路径/文件.html');

      migrateToNewBaseUrl('http://new.com', 'http://old.com');

      expect(localStorage.getItem('config_unicode')).toBe('http://new.com/路径/文件.html');
    });
  });

  describe('extreme edge cases', () => {
    it('should handle null-like values', () => {
      setBaseUrl('https://example.com');
      expect(buildUrl('null')).toBe('https://example.com/null');
      expect(buildUrl('undefined')).toBe('https://example.com/undefined');
    });

    it('should handle base URL changes during operation', () => {
      setBaseUrl('https://first.com');
      const url1 = buildUrl('/path1');

      setBaseUrl('https://second.com');
      const url2 = buildUrl('/path2');

      expect(url1).toBe('https://first.com/path1');
      expect(url2).toBe('https://second.com/path2');
    });

    it('should handle rapid base URL changes', () => {
      for (let i = 0; i < 100; i++) {
        setBaseUrl(`https://example${i}.com`);
      }
      expect(buildUrl('/test')).toBe('https://example99.com/test');
    });
  });
});