# Flashcards — Gestion des dépendances et veille (Dependabot)

Fiche associée : [dependances-dependabot-veille](../fiches/dependances-dependabot-veille.md)

Q: Que signifie LTS ?
R: Long Term Support : version maintenue (correctifs de sécurité) pendant une longue période. Java 21 et Node 24 sont les LTS retenues.

---

Q: Que signifie CVE ?
R: Common Vulnerabilities and Exposures : identifiant public unique d'une vulnérabilité connue.

---

Q: Que signifie EOL ?
R: End Of Life : date à partir de laquelle une version n'est plus maintenue, sans correctif de sécurité. `MAINTENANCE.md` demande de ne jamais rester sur une version hors support.

---

Q: Que signifie OSS ?
R: Open Source Software : logiciel dont le code source est public. « Support OSS » désigne la période où la communauté publie encore des correctifs.

---

Q: Qu'est-ce que Dependabot ?
R: Un outil de GitHub qui ouvre automatiquement des PR de mise à jour de dépendances (et des alertes de sécurité), configuré dans `.github/dependabot.yml`.

---

Q: Quelle fréquence et quels écosystèmes Dependabot couvre-t-il ?
R: Chaque semaine, pour `github-actions` (`/`), `maven` (`/backend`), `npm` (`/frontend`) et `docker` (`/backend` et `/frontend`).

---

Q: Quels préfixes de commit Dependabot utilise-t-il ?
R: `ci` pour les actions GitHub ; `build` pour Maven, npm et Docker ; `chore` pour les dépendances de développement (Maven et npm) via `prefix-development`.

---

Q: Pourquoi configurer les préfixes de commit de Dependabot ?
R: Les titres de PR sont contrôlés par `commitlint` (Conventional Commits) : sans préfixe valide, les PR Dependabot seraient rejetées.

---

Q: Pourquoi le groupe `angular` dans `dependabot.yml` ?
R: Les paquets `@angular/*` exigent tous la même version (peer dependencies strictes). Montés un par un, chaque PR échouait sur `ERESOLVE` (#22, #26, #34, #36). Un groupe les monte ensemble.

---

Q: Pourquoi ignorer les versions majeures de `vitest` ?
R: `@angular/build` ne supporte pas encore vitest 5 dans sa peer dependency. Le projet reste en 4.x jusqu'à ce qu'elle s'élargisse, puis retire la règle.

---

Q: Pourquoi ignorer les majeures de `eclipse-temurin` et `node` dans les Dockerfile ?
R: Pour rester sur des versions LTS : Java 21 (24 n'est pas LTS) et Node 24 (version paire LTS, Node 26 ne l'est pas).

---

Q: Quelles images Docker Dependabot ne surveille-t-il pas dans DataShare ?
R: Celles de `deploy/docker-compose.yml` (`postgres`, `silo`, `adminer`) : il ne lit que les `Dockerfile` de `backend/` et `frontend/`. Elles sont suivies à la main.

---

Q: Comment audite-t-on les CVE des dépendances du back, et pourquoi à la main ?
R: `./mvnw dependency-check:check` (OWASP dependency-check), lancé manuellement : il n'est pas câblé en CI, car une CVE publiée demain ferait échouer des PR sans rapport.

---

Q: Comment traite-t-on une montée de version majeure d'un framework ?
R: PR dédiée, avec `ng update` ou le guide de migration Spring, planifiée et jamais dans l'urgence. Patch et minor sont mergés si la CI est verte.

---

Q: Où vérifier la date de fin de support avant une montée majeure ?
R: Sur endoflife.date (Spring Boot, Angular, Node), comme le liste `MAINTENANCE.md`. Dependabot propose des versions mais ne donne pas les dates de fin de vie.
