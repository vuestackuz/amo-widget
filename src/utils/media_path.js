export function widgetPath(file) {
  const settings = window.__AMO_UTEL_WIDGET_SETTINGS__;
  return settings?.path ? `${settings.path}/dist/${file}` : `/${file}`;
}