import { describe, it, expect } from 'vitest';
import { validateExternalUrl, isPrivateOrReservedIp } from '../server/services/security';

describe('Security & SSRF Protection Tests', () => {
  describe('isPrivateOrReservedIp', () => {
    it('блокирует loopback адреса (127.0.0.1, ::1)', () => {
      expect(isPrivateOrReservedIp('127.0.0.1')).toBe(true);
      expect(isPrivateOrReservedIp('127.0.1.5')).toBe(true);
      expect(isPrivateOrReservedIp('::1')).toBe(true);
    });

    it('блокирует локальные адреса (0.0.0.0)', () => {
      expect(isPrivateOrReservedIp('0.0.0.0')).toBe(true);
    });

    it('блокирует приватные сети 10.x.x.x, 192.168.x.x, 172.16.x.x', () => {
      expect(isPrivateOrReservedIp('10.0.0.1')).toBe(true);
      expect(isPrivateOrReservedIp('192.168.1.1')).toBe(true);
      expect(isPrivateOrReservedIp('172.16.0.1')).toBe(true);
      expect(isPrivateOrReservedIp('172.31.255.255')).toBe(true);
    });

    it('блокирует Cloud Metadata (169.254.169.254)', () => {
      expect(isPrivateOrReservedIp('169.254.169.254')).toBe(true);
      expect(isPrivateOrReservedIp('169.254.0.1')).toBe(true);
    });

    it('разрешает публичные IP-адреса', () => {
      expect(isPrivateOrReservedIp('8.8.8.8')).toBe(false);
      expect(isPrivateOrReservedIp('1.1.1.1')).toBe(false);
      expect(isPrivateOrReservedIp('93.184.216.34')).toBe(false);
    });
  });

  describe('validateExternalUrl', () => {
    it('отклоняет localhost и локальные домены', () => {
      const res1 = validateExternalUrl('http://localhost:3000/api/secret');
      expect(res1.isValid).toBe(false);
      expect(res1.error).toContain('заблокирован');

      const res2 = validateExternalUrl('http://127.0.0.1:8080/recipe');
      expect(res2.isValid).toBe(false);

      const res3 = validateExternalUrl('http://myserver.local/test');
      expect(res3.isValid).toBe(false);
    });

    it('отклоняет cloud metadata домены', () => {
      const res = validateExternalUrl('http://metadata.google.internal/computeMetadata/v1/');
      expect(res.isValid).toBe(false);
    });

    it('отклоняет опасные протоколы (file, gopher, ftp)', () => {
      const resFile = validateExternalUrl('file:///etc/passwd');
      expect(resFile.isValid).toBe(false);

      const resFtp = validateExternalUrl('ftp://example.com/file');
      expect(resFtp.isValid).toBe(false);
    });

    it('отклоняет URL с учетными данными', () => {
      const res = validateExternalUrl('http://admin:secret@example.com/recipe');
      expect(res.isValid).toBe(false);
    });

    it('разрешает корректные публичные HTTP/HTTPS ссылки', () => {
      const res1 = validateExternalUrl('https://example.com/recipe.xml');
      expect(res1.isValid).toBe(true);
      expect(res1.sanitizedUrl).toBe('https://example.com/recipe.xml');

      const res2 = validateExternalUrl('https://xn--90aoy.xn--p1ai/recipes/12345');
      expect(res2.isValid).toBe(true);
    });
  });
});
