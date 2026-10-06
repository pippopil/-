/**
 * Модуль безопасности: валидация внешних URL и защита от SSRF (Server-Side Request Forgery)
 */

export interface UrlValidationResult {
  isValid: boolean;
  error?: string;
  sanitizedUrl?: string;
}

/**
 * Проверка IP-адреса на принадлежность к приватным, локальным или служебным диапазонам
 */
export function isPrivateOrReservedIp(ip: string): boolean {
  // IPv6 loopback and private
  if (ip === '::1' || ip === '::' || ip.startsWith('fe80:') || ip.startsWith('fc00:') || ip.startsWith('fd00:')) {
    return true;
  }

  // IPv4 mapping in IPv6
  const cleanIp = ip.startsWith('::ffff:') ? ip.substring(7) : ip;

  const parts = cleanIp.split('.').map(p => Number(p));
  if (parts.length !== 4 || parts.some(p => isNaN(p) || p < 0 || p > 255)) {
    return false;
  }

  const [p0, p1] = parts;

  // 0.0.0.0/8 (Текущая сеть)
  if (p0 === 0) return true;

  // 127.0.0.0/8 (Loopback)
  if (p0 === 127) return true;

  // 10.0.0.0/8 (Приватный класс A)
  if (p0 === 10) return true;

  // 172.16.0.0/12 (Приватный класс B: 172.16.x.x - 172.31.x.x)
  if (p0 === 172 && p1 >= 16 && p1 <= 31) return true;

  // 192.168.0.0/16 (Приватный класс C)
  if (p0 === 192 && p1 === 168) return true;

  // 169.254.0.0/16 (Link-local / Cloud metadata: AWS, GCP 169.254.169.254)
  if (p0 === 169 && p1 === 254) return true;

  // 100.64.0.0/10 (Carrier-grade NAT)
  if (p0 === 100 && p1 >= 64 && p1 <= 127) return true;

  return false;
}

/**
 * Валидация URL перед выполнением серверного HTTP-запроса (защита от SSRF)
 */
export function validateExternalUrl(rawUrl: string): UrlValidationResult {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { isValid: false, error: 'URL не указан или имеет неверный формат' };
  }

  const trimmed = rawUrl.trim();

  // Разрешены строго HTTP и HTTPS
  if (!/^https?:\/\//i.test(trimmed)) {
    return {
      isValid: false,
      error: 'Недопустимый протокол: разрешены только безопасные протоколы http:// и https://'
    };
  }

  try {
    const parsed = new URL(trimmed);

    // Запрет вложенных учетных данных в URL (http://user:pass@host)
    if (parsed.username || parsed.password) {
      return {
        isValid: false,
        error: 'В URL запрещено указывать учетные данные (логин/пароль)'
      };
    }

    const hostname = parsed.hostname.toLowerCase();

    // Запрет loopback и внутренних доменов
    const forbiddenHostnames = [
      'localhost',
      '127.0.0.1',
      '0.0.0.0',
      '::1',
      'metadata.google.internal',
      'metadata',
      'instance-data'
    ];

    if (forbiddenHostnames.includes(hostname) || hostname.endsWith('.local') || hostname.endsWith('.internal')) {
      return {
        isValid: false,
        error: `Доступ к локальному хосту "${hostname}" заблокирован по соображениям безопасности`
      };
    }

    // Если hostname является IP-адресом, проверяем на приватные диапазоны
    if (isPrivateOrReservedIp(hostname)) {
      return {
        isValid: false,
        error: `Доступ к приватному или локальному IP-адресу (${hostname}) заблокирован`
      };
    }

    return {
      isValid: true,
      sanitizedUrl: parsed.toString()
    };
  } catch {
    return {
      isValid: false,
      error: 'Некорректная структура ссылки (синтаксическая ошибка URL)'
    };
  }
}
