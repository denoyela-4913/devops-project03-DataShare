# TESTING — plan de tests DataShare

Plan de tests vivant. Recoupé par [`docs/CI.md`](docs/CI.md) (pipeline) et
[`DESIGN.md`](DESIGN.md) (carte fonctionnelle).

> Légende de statut : ☑ en place · ◐ partiel · ☐ prévu (PR de feature).

## 1. Stratégie — les couches de test

| Couche | Périmètre | Outil | Dépendances | Job CI |
|---|---|---|---|---|
| **Back — unitaire** | services, validators, mappers, règles de gestion isolées | JUnit 5 + Mockito | aucune | `backend-unit` |
| **Back — intégration** | repositories, contrôleurs (MockMvc), sécurité, migrations Flyway | Spring Boot Test + Testcontainers | PostgreSQL, MinIO (conteneurs jetables) | `backend-integ` |
| **Back — fonctionnel** | scénarios API bout en bout (un ou plusieurs endpoints) | Spring Boot Test (`RANDOM_PORT`) + Testcontainers | idem | `backend-integ` |
| **Front — unitaire** | pipes, services, guards, `token.store`, logique de composant isolée | Vitest | aucune | `frontend-unit` |
| **Front — intégration** | composant rendu + template + DI, intercepteur, formulaire + validation | Vitest + Angular `TestBed` + jsdom | `HttpTestingController` (réponses simulées) | `frontend-integ` |
| **Front — e2e** | 3–4 parcours critiques dans un vrai navigateur | Cypress | stack complète dockerisée | `frontend-e2e` |
| **Garde bundle** | la config debug ne fuit pas en production | build + `grep` | — | `assert-prod-bundle` |

Règle de placement :

- une **règle de gestion** → test unitaire ;
- un **endpoint** → test d'intégration (statut, corps, autorisation, erreurs) ;
- un **parcours utilisateur critique** → test e2e ;
- tout ce qui n'est ni l'un ni l'autre (rendu de composant, câblage DI) → test d'intégration front.

## 2. Couverture par user story

| US | Unitaire | Intégration | Fonctionnel / e2e | Statut |
|---|---|---|---|---|
| US01 — upload (compte) | `upload.integ.spec` : état landing/form/success, taille > 1 Go, format Mo/Go | `POST /api/files` (201, lien, autorisation) ; stockage MinIO | e2e upload→download | ◐ écran front, soumission ☐ |
| US02 — téléchargement via lien | vérif expiration + mot de passe | `GET /api/d/{token}` (métadonnées, flux, 404/410, 401 mdp) | e2e upload→download | ☐ |
| US03 — création de compte | back : `AuthServiceTest`, `JwtServiceTest` · front : `register.integ.spec` (validation, mdp différents, submit → `AuthService.register` → navigation), `field-error.spec` | `AuthControllerIT` : 201, 409 `EMAIL_ALREADY_USED`, 400 `VALIDATION` · front : `auth.service.integ.spec` (POST + stockage token) | **`cypress/e2e/auth.cy.ts`** : inscription → espace perso ; email déjà pris → erreur | ☑ |
| US04 — connexion | back : `AuthServiceTest` · front : `login.integ.spec` (submit, `?redirect=`, erreur serveur), `token-store.spec`, `auth.guard.spec`, `jwt.interceptor.integ.spec` | `AuthControllerIT` : 200 + token, 401 `INVALID_CREDENTIALS` ; `MeControllerIT` : `/api/me` 401 sans token / 200 avec / 401 compte supprimé | `auth.cy.ts` : déconnexion → reconnexion ; page protégée sans session → `/login` | ☑ |
| US05 — historique | tri/état du lien | `GET /api/files` (liste du propriétaire uniquement) | e2e historique→suppression | ☐ |
| US06 — suppression | suppression physique + métadonnées, propriété | `DELETE /api/files/{id}` (204, 403 non-propriétaire) | e2e historique→suppression | ☐ |
| US07 — upload anonyme | règles US01 sans `owner` | `POST /api/files` sans JWT | — | ☐ |
| US08 — tags | longueur ≤ 30, anti-doublon | `V2` + endpoints tags | — | ☐ |
| US09 — mdp fichier | hash, min 6 | vérif au téléchargement | — | ☐ |
| US10 — expiration auto | calcul de la date, borne 1–7 j | job planifié de purge (déclenché manuellement en test) | — | ☐ |
| Socle transverse | contrat d'erreur verbose/non-verbose ; garde config prod ; pipes `fileSize`/`expiryStatus` | contexte Spring démarre ; `/api/ping` public ; intercepteur d'erreur ; `ErrorToast` debug/prod | — | ☑ |

## 3. Scénarios e2e critiques (Cypress)

Câblés avec la première feature offrant un parcours complet (US03/US04).

1. **Inscription → connexion** ☑ (`cypress/e2e/auth.cy.ts`) — créer un compte, atterrir
   sur l'espace personnel, se déconnecter, se reconnecter ; email déjà utilisé → message
   d'erreur explicite ; page protégée sans session → redirection vers `/login`.
2. **Upload → téléchargement** ☐ — déposer un fichier, récupérer le lien, l'ouvrir dans
   un contexte non authentifié, voir les métadonnées, télécharger.
3. **Historique → suppression** ☐ — l'utilisateur voit ses fichiers, en supprime un
   après confirmation, il disparaît ; il ne voit pas les fichiers d'un autre.
4. **Modes debug/prod** ☐ — provoquer une erreur 409 : en build dev, l'info-bulle de
   détail technique est présente ; en build prod, seule la mention générique.

Job CI **`frontend-e2e`** : PostgreSQL (service) + backend (`java -jar`, profil `dev`) +
`ng serve` (proxy `/api`) + `cypress run`.

## 4. Critères d'acceptation

Chaque test décrit **Given / When / Then**. Un test d'endpoint valide au minimum :

- le **code HTTP** attendu (succès et échecs) ;
- la **forme du corps** (champs présents, types) ;
- l'**autorisation** (401 sans jeton, 403 pour un non-propriétaire) ;
- la **validation** (400 + corps d'erreur normalisé pour chaque contrainte de saisie).

Une fonctionnalité est « faite » quand : tests unit + integ verts, scénario e2e
associé vert (si parcours critique), documentation à jour, CI verte.

## 5. Exécution

### Backend

```bash
cd backend
./mvnw test                          # unitaires (Surefire)
./mvnw verify -Dsurefire.skip=true   # intégration + fonctionnels (Failsafe, Docker requis)
./mvnw verify                        # tout + rapport JaCoCo
```

Rapport de couverture : `backend/target/site/jacoco/index.html` (unitaires) et
`jacoco-it/index.html` (intégration).

### Frontend

```bash
cd frontend
nvm use 24
npm run test:unit     # Vitest — *.spec.ts
npm run test:integ    # Vitest + TestBed — *.integ.spec.ts
npm run verify:config # garde prod != debug
```

Rapport de couverture : `frontend/coverage/index.html`.

### e2e (à venir)

```bash
cd deploy && docker compose --env-file .env up -d   # stack
cd ../frontend && npm run e2e                         # Cypress
```

## 6. Couverture — seuil

- **Objectif : 70 %** de lignes, conformément au cahier des charges.
- Outils : **JaCoCo** (back), **Vitest + coverage-v8** (front).
- **Back : porte bloquante active** (PR #0006). `jacoco:merge` (unit + integ) puis
  `jacoco:check` **BUNDLE LINE ≥ 0.70** au `verify` (donc dans le job `backend-integ`).
  Exclusions : `config/**`, `*Application`, `**/dto/**`, `*Properties`. Couverture
  actuelle : **~93 %** (lignes).
- **Front : porte bloquante active** (PR #0007). `ng test` (projets unit + integ) +
  `--coverage` + `tools/check-coverage.mjs` (lignes ≥ 70 %) dans le job `frontend-integ`.
  `frontend-unit` reste rapide (projet unit seul). Couverture actuelle : **~92 %** (lignes).
- Capture du rapport : `docs/screenshots/coverage-backend.png` (JaCoCo) — voir
  [`docs/screenshots/README.md`](docs/screenshots/README.md). Rapport local :
  `backend/target/site/jacoco-merged/index.html`.

## 7. Traçabilité

- Les tests sont nommés d'après l'US ou la règle qu'ils couvrent.
- Toute PR de feature met à jour le tableau du §2 (statut ☐ → ☑) et, si besoin, la
  liste des scénarios e2e du §3.
