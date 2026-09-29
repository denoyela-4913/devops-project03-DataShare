# Flashcards — Sécurité : surface d'attaque, IDOR et token de téléchargement

Fiche associée : [securite-surface-attaque-idor-token](../fiches/securite-surface-attaque-idor-token.md)

Q: Que signifie IDOR ?
R: Insecure Direct Object Reference : accéder à la ressource d'un autre utilisateur en modifiant un identifiant (id) dans la requête, faute de contrôle de propriété.

---

Q: Que signifie JWT ?
R: JSON Web Token : un jeton signé qui transporte l'identité de l'utilisateur de façon vérifiable, sans session stockée côté serveur.

---

Q: Que signifie TTL ?
R: Time To Live : durée de vie d'une donnée ou d'un jeton avant expiration. Ici, l'access token JWT vit 1 h.

---

Q: Que signifie OWASP ?
R: Open Worldwide Application Security Project : communauté qui publie des références de sécurité applicative (Top 10) et l'outil `dependency-check`.

---

Q: Que signifie CVE ?
R: Common Vulnerabilities and Exposures : identifiant public unique d'une vulnérabilité connue (ex. CVE-2026-39414).

---

Q: Que signifie SAST ?
R: Static Application Security Testing : analyse du code source sans l'exécuter pour trouver des failles. DataShare utilise CodeQL.

---

Q: Que signifie DoS ?
R: Denial of Service : attaque qui rend un service indisponible, par exemple en saturant le disque avec des fichiers énormes.

---

Q: Que signifie BCrypt ?
R: Fonction de hachage de mots de passe volontairement lente et salée, qui résiste au bruteforce hors-ligne. DataShare l'utilise pour les mots de passe de compte et de fichier.

---

Q: Pourquoi le token de téléchargement fait-il 192 bits et non séquentiel ?
R: Le lien est une capacité : qui le connaît télécharge. 192 bits d'aléa `SecureRandom` rendent le devinage et l'énumération infaisables ; des ids séquentiels permettraient de deviner les voisins.

---

Q: Comment `DownloadTokens.generate()` produit-il le token ?
R: 24 octets (192 bits) tirés d'un `SecureRandom`, encodés en base64url sans padding : 32 caractères utilisables dans une URL. La colonne est `UNIQUE`.

---

Q: Pourquoi `SecureRandom` et pas `java.util.Random` ?
R: `SecureRandom` est cryptographiquement sûr ; `java.util.Random` est prédictible à partir de quelques sorties, donc inadapté à un secret.

---

Q: Pourquoi le fichier d'un autre utilisateur répond-il 404 et non 403 ?
R: Un 403 confirmerait que l'id existe. Avec 404, un fichier d'autrui est indiscernable d'un id inconnu : on ne révèle pas l'existence des ressources d'autrui.

---

Q: Comment le code garantit-il qu'on ne supprime que ses propres fichiers ?
R: `FileService.delete` appelle `findByIdAndOwnerId(id, ownerId)` : le filtre est dans la requête, le fichier d'autrui n'est jamais chargé, et `ownerId` vient du sujet du JWT.

---

Q: D'où vient l'`owner_id` d'un fichier uploadé ?
R: Du sujet (`sub`) du JWT, jamais d'un paramètre fourni par le client : pas d'usurpation de propriétaire.

---

Q: Pourquoi l'upload combine-t-il liste noire d'extensions et détection par octets ?
R: La liste noire seule est contournée en renommant un `.exe` en `.txt`. `tika-core` détecte le type réel par signature ; le `Content-Type` servi vient de cette détection, jamais du client.

---

Q: Quelle limite de la détection `tika-core` SECURITY.md reconnaît-il ?
R: Elle ne détecte pas `.msi`, `.jar` ni les scripts texte sans signature (`ps1`, `vbs`, `js`). Pour ceux-là, seule la liste noire par nom protège.

---

Q: Pourquoi le message de connexion est-il identique pour un email inconnu et un mot de passe faux ?
R: Pour empêcher l'énumération de comptes : un message différent révélerait quels emails sont inscrits. La vraie cause n'est visible que dans `debug`.
