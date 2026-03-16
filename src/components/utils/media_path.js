/**
 * Resolves a relative widget asset path to a full URL.
 * In production the widget bundle is served from a CDN/server path,
 * so we prefix with the widget base URL when available.
 */
export function widgetPath(path) {
  const base = window.__AMO_UTEL_WIDGET_SETTINGS__?.widgetBasePath || '';
  return base ? `${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}` : path;
}
