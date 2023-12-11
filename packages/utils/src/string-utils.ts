export function getHrefs(text: string) {
  const regex = /href="([^"]*)"/g;
  const hrefs = [];
  let match;

  while ((match = regex.exec(text)) !== null) {
    hrefs.push(match[1]);
  }

  return hrefs;
}
