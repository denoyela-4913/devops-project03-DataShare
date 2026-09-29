# Flashcards — Performance : k6 et Lighthouse

Fiche associée : [performance-k6-lighthouse](../fiches/performance-k6-lighthouse.md)

Q: Que signifie VU (dans k6) ?
R: Virtual User : un utilisateur simulé par k6. Le scénario `ramping-vus` en fait monter le nombre progressivement.

---

Q: Que signifie p95 ?
R: 95e percentile : 95 % des requêtes sont plus rapides que cette valeur. Plus révélateur qu'une moyenne, qui masque les lenteurs.

---

Q: Que signifie LCP ?
R: Largest Contentful Paint : temps d'affichage du plus gros élément visible de la page. C'est un Core Web Vital.

---

Q: Que signifie FCP ?
R: First Contentful Paint : temps avant l'affichage du premier contenu (texte, image) à l'écran.

---

Q: Que signifie TBT ?
R: Total Blocking Time : temps total pendant lequel le thread principal est bloqué et ne peut pas répondre à l'utilisateur.

---

Q: Que signifie CLS ?
R: Cumulative Layout Shift : mesure des décalages inattendus de la mise en page pendant le chargement. 0 = aucun décalage.

---

Q: Que signifie SEO ?
R: Search Engine Optimization : ensemble de bonnes pratiques qui aident les moteurs de recherche à comprendre et référencer une page.

---

Q: Quelle question pose k6 et laquelle pose Lighthouse ?
R: k6 : combien de temps l'API met-elle à répondre sous charge ? Lighthouse : que ressent l'utilisateur au chargement d'une page dans un navigateur ?

---

Q: Quels sont les trois endpoints testés avec k6 et leurs p95 mesurés ?
R: `POST /api/files` 385,64 ms, `GET /api/d/{token}` 556,42 ms, `GET /api/ping` 11 ms ; 0 % d'erreur (0,01 % pour ping).

---

Q: Pourquoi les tests k6 ne tournent-ils pas en CI ?
R: Une charge sur un runner partagé produit du bruit de mesure ; ils sont lancés à la main contre l'environnement `deploy/`.

---

Q: Que prouvent les résultats k6 actuels, et que ne prouvent-ils pas ?
R: Ils prouvent l'absence de problème à faible charge (5 VUs pour upload/download). Ils ne prouvent pas la tenue à forte charge : `PERF.md` dit le goulot « non identifié ».

---

Q: Quels sont les trois scores Lighthouse Performance de `/upload` ?
R: 56 en debug, 77 avec `ng serve --configuration production`, 99 avec nginx et un vrai build prod dans Docker.

---

Q: Pourquoi l'écart 56 → 77 → 99 est-il significatif ?
R: Le code est le même : seul change la façon de le servir (debug non minifié, puis dev-server prod, puis build prod + nginx compressé). Le score dépend de la configuration mesurée.

---

Q: Quel run Lighthouse représente la production, et pourquoi ?
R: Le run 99 (nginx + `ng build --configuration production` via `frontend/Dockerfile`) : c'est la chaîne de déploiement réelle.

---

Q: Pourquoi le run à 99 a-t-il un SEO plus bas (82) que les autres (91) ?
R: Le fallback SPA de nginx renvoie `index.html` en 200 sur `/robots.txt`, que Lighthouse lit comme un robots.txt invalide. Il manque aussi une meta description. Correctifs prévus, non faits.

---

Q: Quel budget de bundle déclare `frontend/angular.json` ?
R: Bundle initial : warning 500 ko, error 1 Mo ; style par composant : warning 6 ko, error 10 ko. Le job `assert-prod-bundle` échoue au-delà de l'error.
