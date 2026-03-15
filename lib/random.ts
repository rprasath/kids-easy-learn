export function hashString(value: string): number {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash;
}

export function shuffleBySeed<T>(
  items: T[],
  seed: string,
  getKey: (item: T, index: number) => string = (_, index) => String(index),
): T[] {
  return items
    .map((item, index) => ({
      item,
      score: hashString(`${seed}:${getKey(item, index)}`),
    }))
    .sort((left, right) => left.score - right.score)
    .map((entry) => entry.item);
}
