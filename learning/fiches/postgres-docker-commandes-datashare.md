# PostgreSQL dans Docker : explorer et nettoyer la base DataShare

La base de DataShare est un PostgreSQL 16 qui tourne dans un conteneur : on n'a donc pas de client
`psql` installé sur la machine, on exécute celui du conteneur avec `docker compose exec`. L'enjeu
de la fiche : savoir **inspecter** la base, **lire** les données et **supprimer** des tuples
(lignes) sans casser le schéma ni laisser le stockage des fichiers incohérent avec la base.

## Se connecter

Le service s'appelle `db` dans [`deploy/docker-compose.yml`](../../deploy/docker-compose.yml)
(image `postgres:16-alpine`, base, utilisateur et mot de passe `datashare` par défaut). Les
commandes se lancent depuis le dossier `deploy/`, là où se trouve le fichier compose :

```bash
docker compose exec db psql -U datashare -d datashare              # shell interactif
docker compose exec db psql -U datashare -d datashare -c "SELECT now();"   # requête ponctuelle
docker exec -it <conteneur> psql -U datashare -d datashare         # sans compose (nom via docker ps)
```

`-c` exécute une seule requête SQL (Structured Query Language) puis rend la main ; sans `-c`, on
entre dans le shell `psql`, qu'on quitte avec `\q`.

## Méta-commandes `psql` et requêtes SQL

Deux familles à ne pas confondre dans le shell `psql` :

| | Méta-commandes `psql` | Requêtes SQL |
|---|---|---|
| Syntaxe | commencent par `\`, sans `;` | se terminent par `;` |
| Rôle | explorer (bases, tables, structure) | lire ou modifier les données |
| Exemples | `\l`, `\dt`, `\d stored_file` | `SELECT ...;`, `DELETE ...;` |
| Qui les comprend | le client `psql` seulement | le serveur PostgreSQL |

```text
\l                  lister les bases
\dt                 lister les tables
\d users            structure d'une table (colonnes, index, clés)
\di                 lister les index
\x                  affichage vertical, pratique pour les lignes larges
```

## Le schéma réel

Deux tables, créées par la migration Flyway
[`V1__init.sql`](../../backend/src/main/resources/db/migration/V1__init.sql) :

```sql
CREATE TABLE users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email         VARCHAR(320) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE stored_file (
    ...
    storage_key    VARCHAR(255) NOT NULL,   -- clé de l'objet dans le stockage
    owner_id       UUID REFERENCES users(id) ON DELETE CASCADE,  -- NULL = upload anonyme
    expires_at     TIMESTAMPTZ  NOT NULL
);
```

- `UUID` (Universally Unique Identifier) : identifiant de 128 bits, généré par la base
  (`gen_random_uuid()`), non devinable contrairement à un entier auto-incrémenté.
- `stored_file.owner_id` est une clé étrangère vers `users(id)` avec `ON DELETE CASCADE` :
  supprimer un utilisateur supprime ses fichiers.
- `storage_key` désigne l'objet dans MinIO (stockage compatible S3, Simple Storage Service) : le
  fichier lui-même n'est **pas** dans PostgreSQL, seulement ses métadonnées.
- La table `flyway_schema_history` est tenue par Flyway : elle liste les migrations appliquées.

## Lire les données

```sql
SELECT id, email, created_at FROM users;                       -- sans le hash du mot de passe
SELECT original_name, size_bytes, expires_at FROM stored_file ORDER BY created_at DESC;
SELECT id, original_name FROM stored_file WHERE expires_at < now();   -- expirés
SELECT id, original_name FROM stored_file WHERE owner_id IS NULL;     -- uploads anonymes
SELECT version, description, success FROM flyway_schema_history;      -- migrations
```

## Supprimer des tuples

| Besoin | Commande | Effet |
|---|---|---|
| Une ligne précise | `DELETE FROM stored_file WHERE id = '<uuid>';` | supprime cette ligne |
| Les expirés | `DELETE FROM stored_file WHERE expires_at < now();` | supprime les lignes, **pas** les objets MinIO |
| Un utilisateur | `DELETE FROM users WHERE email = '...';` | supprime aussi ses fichiers (CASCADE) |
| Tout le contenu | `DELETE FROM stored_file;` | vide la table, elle reste |
| Vider vite | `TRUNCATE users CASCADE;` | vide `users` et `stored_file` |

Un `DELETE` sans `WHERE` vide toute la table. Pour s'entraîner sans risque, on encadre par une
transaction : rien n'est définitif tant qu'on n'a pas validé.

```sql
BEGIN;
DELETE FROM stored_file WHERE expires_at < now();
SELECT count(*) FROM stored_file;
ROLLBACK;   -- annule ; COMMIT; pour valider
```

## Depuis Docker Desktop (onglet Exec)

Dans Docker Desktop, ouvrir **Containers**, cliquer sur le conteneur de la base
(`datashare-dev-db-1`), puis l'onglet **Exec**. On est déjà **dans** le conteneur, dans un shell
`sh` : on n'écrit donc ni `docker compose` ni `exec db`, seulement `psql`.

```bash
psql -U datashare -d datashare       # ouvre le shell psql (invite : datashare=#)
```

Puis, dans `psql` (méta-commandes sans `;`, SQL avec `;`) :

```sql
\dt                                          -- lister les tables
SELECT * FROM users;                         -- contenu de users
SELECT * FROM stored_file;                   -- contenu de stored_file
SELECT id, original_name, expires_at FROM stored_file;   -- version lisible

-- supprimer un fichier à partir de son nom
SELECT id, original_name FROM stored_file WHERE original_name = 'rapport.pdf';  -- vérifier d'abord
DELETE FROM stored_file WHERE original_name = 'rapport.pdf';
SELECT id, original_name FROM stored_file;   -- contrôler le résultat

\q                                           -- quitter psql
```

Sans ouvrir le shell `psql`, une commande unique avec `-c` fonctionne aussi dans l'onglet :

```bash
psql -U datashare -d datashare -c "\dt"
psql -U datashare -d datashare -c "SELECT * FROM stored_file;"
psql -U datashare -d datashare -c "DELETE FROM stored_file WHERE original_name = 'rapport.pdf';"
```

Précautions propres à `original_name` : rien ne le rend unique, deux uploads peuvent porter le
même nom, et le `DELETE` les supprime alors **tous les deux**. Le `SELECT` préalable montre
combien de lignes sont concernées ; pour n'en supprimer qu'une, filtrer sur `id` (UUID) plutôt que
sur le nom. Pour un nom partiel, `WHERE original_name ILIKE '%rapport%'` (insensible à la casse).
Comme pour tout `DELETE` manuel, l'objet MinIO correspondant reste orphelin.

## Sauvegarder et restaurer

```bash
docker compose exec -T db pg_dump -U datashare datashare > sauvegarde.sql
docker compose exec -T db psql -U datashare -d datashare < sauvegarde.sql
docker compose down -v      # efface aussi le volume db-data : reset total
```

`-T` désactive le pseudo-terminal, nécessaire pour rediriger l'entrée ou la sortie.

## Dans DataShare

- Le service `db`, son volume `db-data` et son healthcheck `pg_isready` :
  [`deploy/docker-compose.yml:9-21`](../../deploy/docker-compose.yml#L9-L21).
- Schéma et `ON DELETE CASCADE` :
  [`V1__init.sql:11-21`](../../backend/src/main/resources/db/migration/V1__init.sql#L11-L21).
- `ddl-auto: validate` : Hibernate ne modifie jamais le schéma, il vérifie seulement qu'il
  correspond aux entités ; le DDL (Data Definition Language) vient exclusivement de Flyway
  ([`application.yml:11-13`](../../backend/src/main/resources/application.yml#L11-L13)). Supprimer
  `flyway_schema_history` ou modifier une migration déjà appliquée fait échouer le démarrage.
- La suppression applicative, [`FileService.delete`](../../backend/src/main/java/com/datashare/file/FileService.java#L155-L163),
  retire la ligne **puis** l'objet MinIO (un échec du stockage laisse un orphelin inoffensif).
  Un `DELETE` à la main ne fait que la première moitié.
- Pour purger les expirés correctement (ligne **et** objet MinIO), le projet fournit
  [`deploy/purge-expired.sh`](../../deploy/purge-expired.sh), décrit dans
  [`MAINTENANCE.md`](../../MAINTENANCE.md) (US10, déclenchement manuel en attendant `@Scheduled`).

## À retenir

1. On n'installe pas `psql` : on utilise celui du conteneur, `docker compose exec db psql -U datashare -d datashare`.
2. `\dt`, `\d table` explorent, `SELECT` lit : les méta-commandes commencent par `\` et ne
   s'écrivent pas avec `;`.
3. Supprimer un `users` supprime ses fichiers (`ON DELETE CASCADE`) ; `TRUNCATE ... CASCADE` aussi.
4. La base ne contient que les métadonnées : un `DELETE` manuel laisse l'objet MinIO orphelin, d'où
   `purge-expired.sh` et `FileService.delete`.
5. On ne touche ni à `flyway_schema_history` ni aux migrations appliquées ; avant de supprimer :
   `SELECT` avec le même `WHERE`, ou `BEGIN` / `ROLLBACK`.
