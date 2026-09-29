# Flashcards — Stratégie de test : couches, Testcontainers et portes de couverture

Fiche associée : [strategie-de-test-pyramide-couverture](../fiches/strategie-de-test-pyramide-couverture.md)

Q: Que signifie e2e ?
R: End-to-end : test qui parcourt l'application de bout en bout, du navigateur jusqu'à la base, comme un vrai utilisateur. Ici avec Cypress.

---

Q: Que signifie CI ?
R: Continuous Integration : exécution automatique du build et des tests à chaque changement de code (ici GitHub Actions).

---

Q: Que signifie JaCoCo ?
R: Java Code Coverage : outil qui mesure la part du code Java exécutée par les tests.

---

Q: Que signifie DI (dans « câblage DI ») ?
R: Dependency Injection : le framework fournit à une classe ses dépendances au lieu qu'elle les crée. `TestBed` la reproduit côté Angular.

---

Q: Que signifie Flyway ?
R: Un outil de migration de schéma de base de données : il applique des scripts SQL versionnés (`V1`, `V2`…) dans l'ordre.

---

Q: Quelles couches de test le back de DataShare a-t-il ?
R: Trois : unitaire (JUnit 5 + Mockito, `backend-unit`), intégration (Spring Boot Test + Testcontainers, `backend-integ`) et fonctionnel (scénarios API enchaînés, `backend-integ`).

---

Q: Quelles couches de test le front a-t-il ?
R: Trois : unitaire (Vitest, `frontend-unit`), intégration (Vitest + `TestBed` + jsdom, `frontend-integ`) et e2e (Cypress, `frontend-e2e`).

---

Q: Où place-t-on une règle de gestion, un endpoint, un parcours critique ?
R: Règle de gestion → test unitaire ; endpoint → test d'intégration ; parcours utilisateur critique → test e2e.

---

Q: Qu'est-ce que Testcontainers ?
R: Une bibliothèque qui démarre de vrais conteneurs Docker jetables (PostgreSQL, MinIO) pendant les tests.

---

Q: Pourquoi Testcontainers plutôt qu'un mock pour un repository ?
R: Un mock renvoie ce qu'on lui dit ; le conteneur exécute vraiment le schéma, les migrations Flyway et les requêtes JPA, donc prouve qu'elles marchent. Justification déduite de la répartition de `TESTING.md`.

---

Q: Que fait `@ServiceConnection` dans `TestcontainersConfiguration` ?
R: Il branche automatiquement l'URL du conteneur PostgreSQL dans la configuration Spring, sans propriétés à écrire à la main.

---

Q: Où les mocks (Mockito) restent-ils pertinents dans DataShare ?
R: Dans `backend-unit` pour les services et règles isolées : rapides, sans Docker, sans infrastructure à valider.

---

Q: Quel est le seuil de couverture et comment est-il imposé côté back ?
R: 70 % de lignes. `jacoco:merge` fusionne unit et integ, puis `jacoco:check` (BUNDLE, `COVEREDRATIO` ≥ 0.70) échoue au `verify`, dans le job `backend-integ`.

---

Q: Comment le seuil de 70 % est-il imposé côté front ?
R: Par `tools/check-coverage.mjs` (`THRESHOLD = 70`), lancé après les tests avec couverture dans le job `frontend-integ`.

---

Q: Pourquoi fusionner les couvertures unit et integ côté back ?
R: Les contrôleurs et repositories ne sont exercés que par les tests d'intégration ; mesurer les unitaires seuls sous-estimerait la couverture réelle.

---

Q: À quoi sert le job `assert-prod-bundle` ?
R: À vérifier par build et `grep` que la configuration debug ne fuit pas dans le bundle de production.
