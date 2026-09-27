# cypress/e2e

Scénarios end-to-end critiques (Cypress).

- `auth.cy.ts` (US03 / US04) : inscription → espace perso → déconnexion → reconnexion ;
  email déjà pris → erreur ; page protégée sans session → redirection.
- `download.cy.ts` (US01 / US02 / US09) : dépôt → lien → ouverture hors session,
  métadonnées, téléchargement ; lien protégé refusé puis accepté ; lien inconnu → état
  introuvable.
- `history.cy.ts` (US05 / US06) : liste des fichiers, filtre Tous/Actifs/Expiré,
  suppression après confirmation ; fichier supprimé non téléchargeable.

À venir : modes debug/prod.

## Exécution

Le job CI `frontend-e2e` démarre PostgreSQL (service) et MinIO (`silo`, GHCR), lance le
backend (`java -jar`, profil `dev`), sert le front (`ng serve` + proxy `/api`), puis
`cypress run`.

En local :

```bash
cd deploy && docker compose --env-file .env up -d                        # PostgreSQL + MinIO + bucket
cd ../backend && ./mvnw spring-boot:run -Dspring-boot.run.profiles=dev   # :8080
cd ../frontend && npm start                                              # :4200 (autre terminal)
npm run e2e                                                              # ou npm run e2e:open
```
