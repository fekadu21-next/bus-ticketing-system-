/**
 * Safely format a user's or passenger's full name without null/undefined concatenation.
 * @param {object|string} entity - User object, passenger info, or name string
 * @param {string} fallback - Fallback string if no valid name found
 * @returns {string} Clean full name
 */
export const formatUserFullName = (entity, fallback = 'Passenger') => {
  if (!entity) return fallback;

  if (typeof entity === 'string') {
    const trimmed = entity.trim();
    if (
      !trimmed ||
      trimmed.toLowerCase() === 'null' ||
      trimmed.toLowerCase() === 'undefined' ||
      trimmed.toLowerCase() === 'null null' ||
      trimmed.toLowerCase() === 'null undefined'
    ) {
      return fallback;
    }
    // Clean any lingering 'null' or 'undefined' words
    const sanitized = trimmed.replace(/\b(null|undefined)\b/gi, '').trim();
    return sanitized || fallback;
  }

  if (entity.fullName && typeof entity.fullName === 'string') {
    const cleaned = entity.fullName.replace(/\b(null|undefined)\b/gi, '').trim();
    if (cleaned) return cleaned;
  }

  const rawFirst = (entity.firstName ?? entity.first_name ?? '').toString().trim();
  const rawLast = (entity.lastName ?? entity.last_name ?? '').toString().trim();

  const isInvalid = (str) => !str || str.toLowerCase() === 'null' || str.toLowerCase() === 'undefined';

  const first = isInvalid(rawFirst) ? '' : rawFirst;
  const last = isInvalid(rawLast) ? '' : rawLast;

  const parts = [first, last].filter(Boolean);
  if (parts.length > 0) {
    return parts.join(' ').trim();
  }

  if (entity.name && typeof entity.name === 'string') {
    const cleaned = entity.name.replace(/\b(null|undefined)\b/gi, '').trim();
    if (cleaned) return cleaned;
  }

  if (entity.email && typeof entity.email === 'string') {
    return entity.email.split('@')[0];
  }

  return fallback;
};

export default formatUserFullName;
