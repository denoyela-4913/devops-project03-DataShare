# Backlog / éléments différés

Ce qui a été volontairement écarté d'une PR, avec le contexte, pour ne pas le perdre.

## PR « gestion de la clé » (à discuter)

Reprise d'une idée du Projet 2 : la clé de signature JWT (secret propre à la machine)
porterait un contrôle d'âge — si elle a plus de 24 h, on la vérifie / régénère.

**Statut : non planifié.** À reprendre avec un **point de vue critique** avant toute
implémentation. Points à instruire :

- Une rotation du secret HMAC toutes les 24 h invalide tous les tokens en cours, sauf
  à gérer un jeu de clés à validité recouvrante (identifiées par `kid`).
- Avec des access tokens courts (15–60 min) et sans refresh token, une rotation
  quotidienne est très perturbante pour l'utilisateur.
- Alternatives plus simples : secret stable géré par un gestionnaire de secrets / variable
  d'environnement ; ou RS256 + endpoint JWKS avec rotation propre (publication de la
  nouvelle clé, conservation de l'ancienne le temps du recouvrement, retrait).
- Pour un MVP évalué, un secret stable bien géré suffit généralement ; la rotation est
  un sujet d'exploitation qui peut être **documenté dans `MAINTENANCE.md`** sans code.

## Stockage — module `storage`

Interface `StorageService` + implémentation MinIO/S3 (AWS SDK v2) + test d'intégration
Testcontainers MinIO : reportés à la **PR US01** (upload de fichier), là où ils sont
réellement utilisés. Le `docker-compose` de dev fournit déjà MinIO.

## Couverture de tests

La porte JaCoCo à 70 % (goal `check`) est **désactivée** tant qu'il n'y a pas de code
métier. À activer dès la première PR de feature (US01), avec exclusions
(`config/**`, `*Application`, DTO).

## Conteneurisation complète

`docker-compose.prod.yml` (backend + frontend nginx + db) et les scripts d'installation
complets : PR ultérieure dédiée au déploiement.
