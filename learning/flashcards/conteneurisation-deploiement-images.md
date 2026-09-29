# Flashcards — Conteneurisation et déploiement : services et images tierces

Fiche associée : [conteneurisation-deploiement-images](../fiches/conteneurisation-deploiement-images.md)

Q: Que signifie GHCR ?
R: GitHub Container Registry : le registre d'images de conteneurs de GitHub (`ghcr.io`), où est publiée l'image `silo` de DataShare.

---

Q: Que signifie S3 (dans « stockage compatible S3 ») ?
R: Simple Storage Service : le service de stockage objet d'Amazon dont l'API est devenue un standard. MinIO/`silo` l'implémente.

---

Q: Que signifie JRE ?
R: Java Runtime Environment : l'environnement qui exécute du Java, sans les outils de compilation du JDK. L'image finale du back n'embarque que lui.

---

Q: Que signifie AGPL ?
R: Affero General Public License : licence copyleft qui oblige à publier les sources même pour un service utilisé via le réseau. Le fork public de `silo` publie donc ses sources.

---

Q: Que signifie CVE ?
R: Common Vulnerabilities and Exposures : identifiant public unique d'une vulnérabilité connue. Trivy en remonte 4 de niveau `HIGH` sur `silo`.

---

Q: Quels services contient `deploy/docker-compose.yml` ?
R: `db` (PostgreSQL 16), `minio` (stockage S3, image `silo`), `createbuckets` (crée le bucket) et `adminer` (interface de base, dev). Ni le backend ni le frontend.

---

Q: Où tournent le backend et le frontend, si ce n'est dans le compose ?
R: Le back en dev via `./mvnw spring-boot:run`, en prod via `java -jar` (profil `prod`). Le front via `npm start` en dev, ou l'image `frontend/Dockerfile` (nginx) en prod.

---

Q: Pourquoi `createbuckets` utilise-t-il `condition: service_healthy` ?
R: `depends_on` seul attend le démarrage du conteneur, pas sa disponibilité. Le `healthcheck` de `minio` (`mcli ready local`) doit réussir avant de créer le bucket.

---

Q: Quel est l'intérêt d'un Dockerfile multi-étapes, comme celui du backend ?
R: Une étape de build (Maven, JDK, sources) compile ; l'image finale ne garde que le JRE et le jar, sous un utilisateur non root : plus petite, moins de surface d'attaque.

---

Q: Que couvre Dependabot pour Docker dans DataShare, et que ne couvre-t-il pas ?
R: Seulement les `Dockerfile` de `backend/` et `frontend/`. Les images d'infrastructure du compose (`postgres`, `silo`, `adminer`) sont suivies à la main.

---

Q: À quels trois endroits une image d'infrastructure doit-elle rester alignée ?
R: `deploy/docker-compose.yml`, `.github/workflows/ci.yml` (job `frontend-e2e`) et Testcontainers (`MinioTestcontainersConfiguration`). Sinon les tests tournent sur une version différente de celle du dev.

---

Q: Pourquoi MinIO a-t-il changé d'image plusieurs fois ?
R: `minio/minio` a quitté Docker Hub (10/2025), `quay.io/minio` est devenu privé (09/2026), `pgsty/minio` a été gelé et renommé `pgsty/silo` (06/08/2026). Le projet a donc forké `silo`.

---

Q: Pourquoi publier un fork de `silo` sur GHCR avec un tag épinglé ?
R: Le fork garde le code même si l'amont disparaît, et un tag explicite (jamais `latest`) rend le build reproductible.

---

Q: Comment met-on à jour l'image MinIO/`silo` ?
R: Sync du fork, workflow *Publish GHCR image (DataShare)* avec le tag `RELEASE.*` voulu, report du tag aux trois endroits, puis CI et merge. À faire après chaque avis de sécurité de SILO.

---

Q: Quelle image du compose n'est pas épinglée ?
R: `adminer:latest`, toléré car outil de développement uniquement (non utilisé en CI ni en tests).
