# Flashcards — PostgreSQL dans Docker : explorer et nettoyer la base DataShare

Fiche associée : [postgres-docker-commandes-datashare](../fiches/postgres-docker-commandes-datashare.md)

Q: Quelle commande ouvre un shell `psql` sur la base de DataShare ?
R: Depuis `deploy/` : `docker compose exec db psql -U datashare -d datashare`. `db` est le nom du service dans `docker-compose.yml`.

---

Q: Pourquoi utilise-t-on `docker compose exec db psql` plutôt qu'un `psql` local ?
R: PostgreSQL tourne dans un conteneur : on exécute le client `psql` déjà présent dans ce conteneur, sans rien installer sur la machine.

---

Q: Que fait l'option `-c` de `psql` ?
R: Elle exécute une seule requête SQL puis rend la main, sans ouvrir de shell interactif. Exemple : `psql -U datashare -d datashare -c "SELECT now();"`.

---

Q: Comment lister les bases, puis les tables, dans `psql` ?
R: `\l` pour les bases, `\dt` pour les tables de la base courante.

---

Q: Comment voir la structure (colonnes, index, clés) de la table `stored_file` ?
R: `\d stored_file`.

---

Q: Quelle différence entre une méta-commande `psql` et une requête SQL ?
R: Une méta-commande (`\dt`, `\d`) commence par `\`, s'écrit sans `;` et n'est comprise que par le client `psql`. Une requête SQL se termine par `;` et est exécutée par le serveur.

---

Q: Que signifie SQL ?
R: Structured Query Language : le langage standard pour interroger et modifier une base de données relationnelle.

---

Q: Que signifie UUID, et pourquoi DataShare l'utilise-t-il comme clé primaire ?
R: Universally Unique Identifier : identifiant de 128 bits. Généré par `gen_random_uuid()`, il n'est pas devinable, contrairement à un entier auto-incrémenté.

---

Q: Que signifie DDL, et qui l'émet dans DataShare ?
R: Data Definition Language : les instructions qui définissent le schéma (`CREATE TABLE`...). Seul Flyway l'émet : `ddl-auto: validate` empêche Hibernate de modifier le schéma.

---

Q: Que signifie S3, et quel rapport avec `stored_file.storage_key` ?
R: Simple Storage Service : l'API de stockage d'objets qu'imite MinIO. `storage_key` est la clé de l'objet dans ce stockage : le fichier n'est pas dans PostgreSQL, seulement ses métadonnées.

---

Q: Que se passe-t-il quand on exécute `DELETE FROM users WHERE email = '...'` ?
R: L'utilisateur est supprimé **et** tous ses fichiers aussi : `stored_file.owner_id` est déclaré `REFERENCES users(id) ON DELETE CASCADE`.

---

Q: Quelle différence entre `DELETE FROM stored_file;` et `TRUNCATE stored_file;` ?
R: Les deux vident la table. `DELETE` supprime ligne par ligne (avec un `WHERE` possible) ; `TRUNCATE` vide d'un coup, plus rapidement, sans condition. `TRUNCATE users CASCADE` vide aussi `stored_file`.

---

Q: Comment tester un `DELETE` sans rien perdre ?
R: Dans une transaction : `BEGIN;` puis le `DELETE`, un `SELECT count(*)` pour vérifier, et `ROLLBACK;` pour annuler (`COMMIT;` pour valider).

---

Q: Pourquoi un `DELETE FROM stored_file WHERE expires_at < now();` manuel est-il incomplet ?
R: Il retire les lignes mais pas les objets MinIO correspondants, qui restent orphelins. `FileService.delete` et `deploy/purge-expired.sh` suppriment la ligne **et** l'objet.

---

Q: Quel script purge correctement les fichiers expirés dans DataShare ?
R: `deploy/purge-expired.sh` (profil Spring `purge`, classe `ExpiredFilePurger`) : il supprime la ligne `stored_file` et l'objet MinIO. Lancement manuel en attendant `@Scheduled` (US10).

---

Q: Pourquoi ne faut-il jamais supprimer `flyway_schema_history` ni modifier une migration appliquée ?
R: Flyway y compare les migrations appliquées à celles du dépôt, et `ddl-auto: validate` vérifie le schéma : une incohérence fait échouer le démarrage du backend.

---

Q: Dans l'onglet Exec de Docker Desktop, quelle commande ouvre `psql` sur la base ?
R: `psql -U datashare -d datashare`. On est déjà dans le conteneur `db` : pas de `docker compose exec`.

---

Q: Comment supprimer un fichier de `stored_file` à partir de son nom ?
R: `DELETE FROM stored_file WHERE original_name = 'rapport.pdf';`, après un `SELECT` avec le même `WHERE`. `original_name` n'est pas unique : tous les fichiers du même nom sont supprimés. Pour en viser un seul, filtrer sur `id`.

---

Q: Comment sauvegarde-t-on la base, et pourquoi `-T` ?
R: `docker compose exec -T db pg_dump -U datashare datashare > sauvegarde.sql`. `-T` désactive le pseudo-terminal, nécessaire pour rediriger l'entrée ou la sortie.

---

Q: Que fait `docker compose down -v` sur la base ?
R: Il arrête la stack et efface les volumes, dont `db-data` : la base repart de zéro (Flyway rejoue les migrations au prochain démarrage du backend).
