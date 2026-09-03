# cypress/e2e

Scénarios end-to-end critiques (Cypress).

| Fichier      | Parcours                                                                                                                     | US          |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------- | ----------- |
| `auth.cy.ts` | inscription → espace perso → déconnexion → reconnexion ; email déjà pris → erreur ; page protégée sans session → redirection | US03 / US04 |

À venir : upload↔download (US01/US02), historique→suppression (US05/US06), modes debug/prod.

## Exécution

Le job CI `frontend-e2e` démarre PostgreSQL, lance le backend (`java -jar`, profil `dev`),
sert le front (`ng serve` + proxy `/api`), puis `cypress run`.

En local :

```bash
cd deploy && docker compose --env-file .env up -d db
cd ../backend && ./mvnw spring-boot:run -Dspring-boot.run.profiles=dev   # :8080
cd ../frontend && npm start                                              # :4200
cd frontend && npm run e2e        # ou npm run e2e:open
```
