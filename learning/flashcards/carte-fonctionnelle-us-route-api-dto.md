# Flashcards — Architecture fonctionnelle : de la user story au code

Fiche associée : [carte-fonctionnelle-us-route-api-dto](../fiches/carte-fonctionnelle-us-route-api-dto.md)

Q: Que signifie US ?
R: User Story : une exigence écrite du point de vue de l'utilisateur (« en tant que… je veux… pour… »). Dans DataShare, US01 à US10.

---

Q: Que signifie DTO ?
R: Data Transfer Object : un objet qui décrit uniquement les données échangées à travers une frontière (ici HTTP), distinct de l'entité de base de données.

---

Q: Que signifie JWT ?
R: JSON Web Token : un jeton signé qui transporte l'identité de l'utilisateur de façon vérifiable, sans session stockée côté serveur.

---

Q: Que signifie API ?
R: Application Programming Interface : l'ensemble des endpoints HTTP (`/api/...`) que le back expose et que le front appelle.

---

Q: Que signifie UUID ?
R: Universally Unique Identifier : un identifiant de 128 bits pratiquement impossible à deviner ou à dupliquer. Il sert d'`id` d'utilisateur et de fichier.

---

Q: Que signifie MVP ?
R: Minimum Viable Product : la plus petite version utilisable du produit. US07 (upload anonyme) est déclarée hors MVP.

---

Q: Quelles colonnes contient la carte fonctionnelle de `DESIGN.md` ?
R: US, route Angular, composants, endpoint API, DTO, statut.

---

Q: Pourquoi l'US09 (mot de passe fichier) n'a-t-elle ni route ni endpoint propre ?
R: Elle réutilise ceux d'US01 et US02 : un champ optionnel `password` à l'upload (`POST /api/files`) et une invite au téléchargement (`/d/:token`, `403` si invalide).

---

Q: Quelles routes Angular sont protégées par `authGuard` ?
R: `/upload` et `/history` (et `/` qui redirige vers `/history`). `/login`, `/register` et `/d/:token` sont publiques.

---

Q: Que fait `authGuard` quand l'utilisateur n'est pas authentifié ?
R: Il redirige vers `/login?redirect=<url demandée>`. Il ne fait qu'une vérification ergonomique côté client : il lit `exp` du JWT sans vérifier la signature.

---

Q: Pourquoi le garde Angular ne suffit-il pas à protéger les données ?
R: Il s'exécute dans le navigateur, donc contournable. La protection réelle est côté back : la chaîne de sécurité `@Order(2)` impose `anyRequest().authenticated()` et vérifie le JWT.

---

Q: Comment le back sait-il quel utilisateur possède un fichier lors d'un upload ?
R: Via `@AuthenticationPrincipal Jwt jwt` : `UUID.fromString(jwt.getSubject())`. L'identité vient du jeton, jamais d'un paramètre envoyé par le client.

---

Q: Quels endpoints sont publics (sans JWT) et comment le front le gère-t-il ?
R: `POST /api/auth/register`, `POST /api/auth/login`, `GET` et `POST /api/d/*`. Le `jwtInterceptor` n'ajoute pas l'en-tête `Authorization` à `/auth/*` ni `/d/*`.

---

Q: Pourquoi le mot de passe d'un fichier est-il envoyé par `POST /api/d/{token}` et non dans l'URL du `GET` ?
R: Dans le corps de la requête (`DownloadRequest`), il n'apparaît ni dans les journaux d'accès ni dans l'historique du navigateur. Le `GET` ne sert qu'aux métadonnées.

---

Q: Pourquoi `DESIGN.md` parle de `FileMetadata` alors que le back a `FileMetadataResponse` ?
R: `FileMetadata` est le nom de l'interface TypeScript (front), `FileMetadataResponse` celui du `record` Java (back). Même contrat, deux noms ; rien ne les synchronise automatiquement.

---

Q: Où trouve-t-on le DTO d'inscription côté back et quelles règles porte-t-il ?
R: `auth/dto/RegisterRequest.java` : `email` (`@NotBlank @Email`, max 320) et `password` (`@NotBlank`, 8 à 100 caractères), validés par `@Valid` dans `AuthController`.

---

Q: Où en sont US07, US08 et US10 ?
R: US07 (upload anonyme) et US08 (tags) ne sont pas traitées ; US10 (expiration auto) a une purge testée (`ExpiredFilePurger`) mais aucun `@Scheduled` ne la déclenche encore.
