// En las compilaciones de publicación la API es siempre HTTPS y pública; en desarrollo se usa
// la del `docker compose` local (nginx en :8080) salvo que EXPO_PUBLIC_API_URL diga otra cosa.
module.exports = ({ config }) => {
  const release =
    ['production', 'direct'].includes(process.env.EAS_BUILD_PROFILE) ||
    process.env.MYSCHOOL_LOCAL_RELEASE === 'true';
  const apiUrl =
    process.env.EXPO_PUBLIC_API_URL || (release ? 'https://myschoolmyparents.online/api' : config.extra.apiUrl);
  if (release) {
    const url = new URL(apiUrl);
    if (url.protocol !== 'https:' || ['localhost', '127.0.0.1'].includes(url.hostname)) {
      throw new Error('Una compilación de publicación requiere una API HTTPS pública');
    }
  }
  return {
    ...config,
    ...(process.env.MYSCHOOL_LOCAL_RELEASE === 'true' ? { updates: { enabled: false } } : {}),
    extra: { ...config.extra, apiUrl },
  };
};
