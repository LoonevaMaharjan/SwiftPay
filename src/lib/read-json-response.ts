/** Read a JSON API response and return a useful error if the server did not send JSON. */
export async function readJsonResponse<T>(response: Response, endpoint: string): Promise<T> {
  const body = await response.text();

  try {
    return JSON.parse(body) as T;
  } catch {
    const status = `HTTP ${response.status}`;
    const detail = body.trim().startsWith('<')
      ? 'the server returned an HTML page'
      : body.length === 0
        ? 'the server returned an empty response'
        : 'the server returned invalid JSON';

    throw new Error(`${endpoint} returned ${detail} (${status}).`);
  }
}
