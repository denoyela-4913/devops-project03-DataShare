/**
 * Rend absolu un lien de partage renvoyé par l'API.
 *
 * Sans `DATASHARE_DOWNLOAD_BASE_URL`, le backend renvoie un chemin relatif (`/d/<token>`) : on y
 * ajoute l'origine réellement chargée par le navigateur (localhost, IP du réseau local, tunnel…),
 * ce qui donne un lien valable pour l'appareil qui l'a généré. Un lien déjà absolu (base imposée
 * côté serveur, ex. https en production) est conservé tel quel.
 */
export function toAbsoluteShareUrl(url: string, origin: string = window.location.origin): string {
  return url.startsWith('/') ? `${origin}${url}` : url;
}
