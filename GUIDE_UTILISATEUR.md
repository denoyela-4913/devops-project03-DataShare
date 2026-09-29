# Guide utilisateur — DataShare

DataShare permet d'envoyer un fichier à quelqu'un via un lien de téléchargement
temporaire, protégeable par un mot de passe — comme WeTransfer.

## 1. Créer un compte

Sur la page d'accueil, cliquez sur **Créer un compte**, renseignez un email et
un mot de passe (8 caractères minimum). Vous êtes automatiquement connecté·e
après l'inscription.

## 2. Se connecter

Avec votre email et votre mot de passe. La connexion dure 1 heure : passé ce
délai, il faut se reconnecter.

> Envoyer un fichier nécessite d'être connecté·e. En revanche, **recevoir**
> un fichier ne demande aucun compte : n'importe qui avec le lien peut le
> télécharger.

## 3. Envoyer un fichier

1. Choisissez le fichier à envoyer (1 Go maximum).
2. Durée de conservation : **1 jour**, **3 jours** ou **1 semaine**. Passé ce
   délai, le fichier n'est plus accessible.
3. Mot de passe (facultatif, 6 caractères minimum) si vous voulez protéger le
   téléchargement.
4. Validez : un lien de partage s'affiche, à copier et transmettre à qui vous
   voulez.

Certains types de fichiers (exécutables, scripts) sont refusés au dépôt, pour
la sécurité des destinataires.

## 4. Partager le lien

Le lien (`.../d/xxxxxxxx`) fonctionne pour n'importe qui, sans compte. S'il
est protégé par un mot de passe, communiquez ce mot de passe séparément (pas
dans le même message que le lien).

## 5. Télécharger un fichier reçu

Ouvrez le lien reçu : le nom du fichier, sa taille et sa date d'expiration
s'affichent. Si un mot de passe est demandé, saisissez-le puis cliquez sur
**Télécharger**.

## 6. Consulter son historique

Une fois connecté·e, **Mon espace** liste tous les fichiers envoyés :

- filtre **Tous / Actifs / Expirés** ;
- bouton **Accéder** pour rouvrir le lien de partage ;
- bouton **Supprimer** (avec confirmation) pour retirer un fichier avant son
  expiration.

Un fichier supprimé ou expiré n'est plus téléchargeable, même avec l'ancien
lien.

## 7. Messages que vous pouvez voir

| Message | Signification |
|---|---|
| « Ce lien a expiré » | Le délai de conservation choisi à l'envoi est dépassé. |
| « Lien introuvable » | Le lien est mal copié, ou le fichier a été supprimé. |
| « Mot de passe incorrect » | Le mot de passe saisi ne correspond pas à celui défini à l'envoi. |
| « Fichier trop volumineux » | Le fichier dépasse 1 Go. |
| « Type de fichier non autorisé » | L'extension (ou le contenu détecté) fait partie des types bloqués. |

---

Besoin de détail technique (API, sécurité, tests) ? Voir
[`README.md`](README.md) et les fichiers `.md` qu'il référence.
