/**
 * Comprehensive Email Validator based on strict website form requirements:
 * 📧 Email validation conditions:
 * 1. Cannot be empty / Email is required
 * 2. Reasonable length limit (<= 254 chars)
 * 3. No spaces
 * 4. Exactly one '@' symbol
 * 5. Must have text before '@' (username)
 * 6. Must have a domain after '@'
 * 7. Username cannot start or end with a dot (.)
 * 8. No consecutive dots (..)
 * 9. Username can contain common characters (Letters, numbers, ., _, -)
 * 10. Domain must contain a dot (.)
 * 11. Must have text between '@' and '.'
 * 12. Domain should use valid characters (Letters, numbers, hyphens)
 * 13. Must have a valid extension (.com, .in, .org, .edu, etc., at least 2 letters)
 * 14. Matches simple validation pattern: ^[A-Za-z0-9._-]+@([A-Za-z0-9-]+\.)+[A-Za-z]{2,}$
 */

export function validateEmailDetails(email) {
  const checklist = [
    { id: 'not_empty', label: 'Email is required', passed: false },
    { id: 'length', label: 'Maximum 254 characters', passed: false },
    { id: 'no_spaces', label: 'No spaces allowed', passed: false },
    { id: 'has_at', label: 'Must contain an @ symbol', passed: false },
    { id: 'single_at', label: 'Only one @ symbol allowed', passed: false },
    { id: 'user_before_at', label: 'Must have text before @', passed: false },
    { id: 'domain_after_at', label: 'Must have a domain after @', passed: false },
    { id: 'no_dot_edges', label: 'Cannot start or end with a dot', passed: false },
    { id: 'no_consecutive_dots', label: 'No consecutive dots (..)', passed: false },
    { id: 'valid_user_chars', label: 'Username uses valid characters (a-z, 0-9, ., _, -)', passed: false },
    { id: 'domain_has_dot', label: 'Domain must contain a dot (.)', passed: false },
    { id: 'text_between_at_and_dot', label: 'Must have text between @ and .', passed: false },
    { id: 'valid_domain_chars', label: 'Domain uses valid characters (letters, numbers, -)', passed: false },
    { id: 'valid_extension', label: 'Valid extension (.com, .in, .org, .edu, etc.)', passed: false }
  ];

  if (!email || typeof email !== 'string') {
    return {
      isValid: false,
      error: 'Email is required',
      checklist
    };
  }

  const str = email.trim();

  // 1. Not empty
  checklist[0].passed = str.length > 0;
  if (!checklist[0].passed) {
    return { isValid: false, error: 'Email is required', checklist };
  }

  // 2. Length <= 254
  checklist[1].passed = str.length <= 254;
  if (!checklist[1].passed) {
    return { isValid: false, error: 'Email exceeds maximum length of 254 characters', checklist };
  }

  // 3. No spaces
  checklist[2].passed = !/\s/.test(str);
  if (!checklist[2].passed) {
    return { isValid: false, error: 'Email cannot contain spaces', checklist };
  }

  // 4. Must contain @
  const atCount = (str.match(/@/g) || []).length;
  checklist[3].passed = atCount >= 1;
  if (!checklist[3].passed) {
    return { isValid: false, error: "Email must contain an '@' symbol", checklist };
  }

  // 5. Only one @
  checklist[4].passed = atCount === 1;
  if (!checklist[4].passed) {
    return { isValid: false, error: "Email can only contain one '@' symbol", checklist };
  }

  const parts = str.split('@');
  const username = parts[0];
  const domain = parts[1] || '';

  // 6. Text before @
  checklist[5].passed = username.length > 0;
  if (!checklist[5].passed) {
    return { isValid: false, error: "Email must have text before '@'", checklist };
  }

  // 7. Domain after @
  checklist[6].passed = domain.length > 0;
  if (!checklist[6].passed) {
    return { isValid: false, error: "Email must have a domain after '@'", checklist };
  }

  // 8. Cannot start or end with a dot
  checklist[7].passed = !str.startsWith('.') && !str.endsWith('.') && !username.startsWith('.') && !username.endsWith('.');
  if (!checklist[7].passed) {
    return { isValid: false, error: 'Email cannot start or end with a dot', checklist };
  }

  // 9. No consecutive dots
  checklist[8].passed = !str.includes('..');
  if (!checklist[8].passed) {
    return { isValid: false, error: "Email cannot contain consecutive dots ('..')", checklist };
  }

  // 10. Valid username chars
  checklist[9].passed = /^[A-Za-z0-9._-]+$/.test(username);
  if (!checklist[9].passed) {
    return { isValid: false, error: 'Username can only contain letters, numbers, dots, underscores, and hyphens', checklist };
  }

  // 11. Domain must contain a dot
  checklist[10].passed = domain.includes('.');
  if (!checklist[10].passed) {
    return { isValid: false, error: "Email domain must contain a dot (.)", checklist };
  }

  const domainParts = domain.split('.');

  // 12. Must have text between @ and .
  checklist[11].passed = domainParts[0].length > 0;
  if (!checklist[11].passed) {
    return { isValid: false, error: "Must have text between '@' and '.'", checklist };
  }

  // 13. Valid domain chars
  const validDomainChars = domainParts.every((part) => /^[A-Za-z0-9-]+$/.test(part) && part.length > 0);
  checklist[12].passed = validDomainChars;
  if (!checklist[12].passed) {
    return { isValid: false, error: 'Domain contains invalid characters', checklist };
  }

  // 14. Valid extension (.com, .in, .org, .edu, etc., at least 2 letters)
  const extension = domainParts[domainParts.length - 1];
  checklist[13].passed = /^[A-Za-z]{2,}$/.test(extension);
  if (!checklist[13].passed) {
    return { isValid: false, error: 'Email must end with a valid extension (e.g. .com, .in, .org, .edu)', checklist };
  }

  // 15. Simple validation pattern check
  const simplePattern = /^[A-Za-z0-9._-]+@([A-Za-z0-9-]+\.)+[A-Za-z]{2,}$/;
  if (!simplePattern.test(str)) {
    return { isValid: false, error: 'Invalid email address format', checklist };
  }

  return { isValid: true, error: null, checklist };
}

export function validateEmail(email) {
  const result = validateEmailDetails(email);
  return result.isValid ? null : result.error;
}
