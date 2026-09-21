export const AWARDEE_EVENTS = [
  'Musical Chair - 4y to 7y',
  'Musical Chair - 8y to 16y',
  'Musical Chair - Senior Citizens',
  'Musical Chair - Women',
  'Musical Chair - Men',
  'Carrom - Below 4y',
  'Carrom - Below 14y',
  'Carrom - Adults',
  'Chess - Kids',
  'Chess - Adults',
  'Badminton - Kids',
  'Badminton - Adults',
  'Running Race - Upto 5y',
  'Running Race - Upto 6y to 10y',
  'Fast Cycling Race - Kids',
  'Running Race - 10y to 20y',
  'Slow Cycling - Below 5y',
  'Slow Citizens - Above 5y',
  'Limbu Chamcha - Below 5y',
  'Limbu Chamcha - 5y to 10y',
  'Limbu Chamcha - 10y to 20y',
  'Slow Cycling - Ladies',
  'Slow Cycling - 10y to 20y',
  'Drawing - Upto 5y',
  'Drawing - 6y to 12y',
  'Drawing - 13y and above',
  'Antakshari',
];

function eventCategory(eventName) {
  const name = (eventName || '').trim();
  if (name.includes(' - ')) {
    return name.split(' - ')[0].trim();
  }
  return name;
}

function detailPart(eventName) {
  const name = (eventName || '').trim();
  if (name.includes(' - ')) {
    return name.split(' - ')[1].trim().toLowerCase();
  }
  return '';
}

function yearSortKey(eventName) {
  const detail = detailPart(eventName);
  const nums = [...detail.matchAll(/\d+/g)].map((match) => Number(match[0]));
  if (detail.includes('and above') && nums.length) {
    return nums[0];
  }
  if (nums.length >= 2) {
    return nums[0];
  }
  if (nums.length === 1) {
    return nums[0];
  }
  if (detail.includes('below') || detail.includes('upto')) {
    return 0;
  }
  if (detail.includes('senior')) {
    return 200;
  }
  if (detail.includes('kids')) {
    return 10;
  }
  if (['adults', 'men', 'women', 'ladies'].some((word) => detail.includes(word))) {
    return 150;
  }
  if (detail.includes('citizens') || detail.includes('above')) {
    return 100;
  }
  return 50;
}

export function awardeeSortKey(eventName, festivalYear = 2026) {
  return [
    festivalYear,
    eventCategory(eventName).toLowerCase(),
    yearSortKey(eventName),
    detailPart(eventName),
  ];
}

export function compareAwardeeEvents(a, b) {
  const keyA = awardeeSortKey(a);
  const keyB = awardeeSortKey(b);
  for (let i = 0; i < keyA.length; i += 1) {
    if (keyA[i] < keyB[i]) return -1;
    if (keyA[i] > keyB[i]) return 1;
  }
  return 0;
}

export function sortAwardeeEventNames(events) {
  return [...events].sort(compareAwardeeEvents);
}

export function sortAwardeeRecords(records) {
  return [...records].sort((left, right) =>
    compareAwardeeEvents(left.event_name, right.event_name),
  );
}

export const SORTED_AWARDEE_EVENTS = sortAwardeeEventNames(AWARDEE_EVENTS);
