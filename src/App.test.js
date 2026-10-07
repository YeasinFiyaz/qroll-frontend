import { fmtPct, pctTone, initials, timeAgo } from './components/ui';
import { homeFor } from './auth';

test('formats percentages', () => {
  expect(fmtPct(100)).toBe('100%');
  expect(fmtPct('66.67')).toBe('66.7%');
  expect(fmtPct(null)).toBe('—');
});

test('colours attendance by threshold', () => {
  expect(pctTone(80)).toBe('success');
  expect(pctTone(60)).toBe('warning');
  expect(pctTone(20)).toBe('danger');
  expect(pctTone(0, false)).toBe('muted');
});

test('builds initials and relative times', () => {
  expect(initials('Rahim Uddin')).toBe('RU');
  expect(timeAgo(new Date())).toBe('just now');
});

test('sends each role to its home page', () => {
  expect(homeFor(null)).toBe('/login');
  expect(homeFor({ role: 'student' })).toBe('/student');
  expect(homeFor({ role: 'teacher' })).toBe('/dashboard');
  expect(homeFor({ role: 'admin' })).toBe('/dashboard');
});
