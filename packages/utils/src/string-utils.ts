export function fromSnakeToCapitalized(text: string) {
  if (!text.includes('_')) {
    return text;
  }
  return text
    .split('_')
    .map((w) => w[0].toUpperCase().concat(w.slice(1)))
    .join(' ');
}
