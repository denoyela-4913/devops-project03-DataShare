# Flashcards — nginx reverse proxy : le bloc `location ^~ /api/`

Fiche associée : [nginx-reverse-proxy-api](../fiches/nginx-reverse-proxy-api.md)

Q: Qu'est-ce qu'un reverse proxy, et quel est son rôle dans DataShare ?
R: Un serveur placé devant un autre pour relayer les demandes à sa place. Dans DataShare, le nginx du front sert les pages Angular et relaie tout ce qui commence par `/api/` vers le backend Spring.

---

Q: Que signifie DNS ?
R: Domain Name System : le service qui traduit un nom (ex. `backend`) en adresse IP. Dans Docker, le DNS interne du réseau fait cette traduction entre conteneurs.

---

Q: Que signifie `^~` dans `location ^~ /api/` ?
R: Si ce préfixe correspond, nginx s'arrête là et ne teste pas les règles `location` à expression régulière.

---

Q: Pourquoi `^~` est-il utile dans le `nginx.conf` de DataShare ?
R: Une règle regex `location ~* \.(?:js|css)$` existe pour le cache des assets. Sans `^~`, une URL `/api/...js` serait captée par cette regex au lieu d'aller au backend.

---

Q: Que fait `proxy_pass http://backend:8080;` (sans `/` final) de l'URL reçue `/api/files/42` ?
R: Il la transmet telle quelle : le backend reçoit `/api/files/42`. Avec `http://backend:8080/;`, le préfixe `/api/` serait retiré et le backend recevrait `/files/42`.

---

Q: Que désigne `backend` dans `proxy_pass http://backend:8080;` ?
R: Un nom de service résolu par le DNS interne de Docker. Attention : le dépôt ne déclare pas encore de service `backend` (`docker-compose.prod.yml` est hors périmètre MVP) : c'est une convention attendue par `nginx.conf`.

---

Q: Que signifie IP ?
R: Internet Protocol : le protocole d'adressage du réseau ; par extension, l'adresse numérique d'une machine (ex. `82.12.34.56`).

---

Q: Pourquoi nginx ajoute-t-il des en-têtes `X-Real-IP`, `X-Forwarded-For` et `X-Forwarded-Proto` ?
R: Parce que le backend ne voit que nginx comme client. Ces en-têtes transmettent l'IP du vrai visiteur, la chaîne des proxys traversés et le protocole d'origine (http/https).

---

Q: Que fait `$proxy_add_x_forwarded_for` dans `X-Forwarded-For` ?
R: Il reprend l'en-tête `X-Forwarded-For` existant et y ajoute l'IP du client à la fin : chaque proxy traversé s'ajoute à la liste.

---

Q: Le backend de DataShare exploite-t-il aujourd'hui les en-têtes `X-Forwarded-*` ?
R: Non. Aucune lecture de ces en-têtes ni `forward-headers-strategy` dans `backend/src/main`. Ils sont envoyés mais pas utilisés. Le lien de partage ne vient pas de `Host` : chemin relatif côté backend, origine du navigateur ajoutée par le frontend (base imposée seulement si `DATASHARE_DOWNLOAD_BASE_URL` est définie).

---

Q: Que change `proxy_request_buffering off` ?
R: nginx ne stocke plus tout le corps de la requête avant d'appeler le backend : il transmet l'upload en streaming, morceau par morceau.

---

Q: Pourquoi `proxy_request_buffering off` est-il pertinent pour DataShare ?
R: Les fichiers vont jusqu'à 1 Go : pas de fichier temporaire de 1 Go par upload dans nginx, le backend démarre dès le premier morceau et peut rejeter tôt (authentification, taille).

---

Q: Quel est l'inconvénient de `proxy_request_buffering off` ?
R: nginx ne peut plus rejouer la requête vers un autre backend en cas d'échec, puisqu'il n'a rien gardé. Sans importance ici : il n'y a qu'un seul backend.

---

Q: Quelle taille de requête nginx accepte-t-il sans `client_max_body_size`, et que vaut le réglage de DataShare ?
R: 1 Mo par défaut. DataShare met `client_max_body_size 1024m` dans `frontend/nginx.conf` (1 Go), aligné avec `max-file-size` / `max-request-size: 1GB` de Spring.

---

Q: Quelle erreur renvoie nginx quand le corps dépasse `client_max_body_size` ?
R: 413 (Content Too Large).

---

Q: Les timeouts nginx sont-ils configurés dans DataShare, et que mesurent-ils ?
R: Non, les défauts de 60 s s'appliquent (`client_body_timeout`, `proxy_send_timeout`, `proxy_read_timeout`). Ils mesurent l'inactivité entre deux lectures/écritures, pas la durée totale : un upload lent mais continu passe, une coupure de plus de 60 s non (408), un backend muet plus de 60 s donne un 504.

---

Q: Que signifie CORS, et pourquoi n'en a-t-on pas besoin entre le front et l'API en production ?
R: Cross-Origin Resource Sharing : mécanisme qui encadre les appels entre origines différentes. Le front appelle `/api` en chemin relatif et nginx relaie : tout passe par la même origine.

---

Q: Comment le proxy `/api` fonctionne-t-il en développement, sans nginx ?
R: `ng serve` utilise `frontend/proxy.conf.json`, qui redirige `/api` vers `http://localhost:8080`.
