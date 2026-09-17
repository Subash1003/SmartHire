export function extractCsrfToken(res) {
  const cookie = res.headers['set-cookie']?.map((c) => c.split(';')[0]).find((c) => c.startsWith('csrfToken='));
  return cookie ? cookie.split('=')[1] : null;
}
