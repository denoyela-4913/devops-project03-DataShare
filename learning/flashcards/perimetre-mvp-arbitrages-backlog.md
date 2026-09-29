# Flashcards — Périmètre produit et arbitrages

Fiche associée : [perimetre-mvp-arbitrages-backlog](../fiches/perimetre-mvp-arbitrages-backlog.md)

Q: Que signifie MVP ?
R: Minimum Viable Product : la plus petite version du produit qui remplit le besoin de base. Pour DataShare : US01 à US06.

---

Q: Que signifie US ?
R: User Story : une exigence formulée du point de vue de l'utilisateur. DataShare en compte dix (US01 à US10).

---

Q: Que signifie JWT ?
R: JSON Web Token : un jeton signé qui transporte l'identité de l'utilisateur de façon vérifiable, sans session côté serveur.

---

Q: Que signifie JWKS ?
R: JSON Web Key Set : un endpoint qui publie les clés publiques de vérification des JWT. Il permet une rotation propre de clés avec RS256.

---

Q: Que signifie `kid` dans un JWT ?
R: Key ID : identifiant de la clé de signature utilisée. Il permet de gérer un jeu de clés à validité recouvrante pendant une rotation.

---

Q: Quel est le périmètre du MVP obligatoire ?
R: US01 à US06 : upload avec compte, téléchargement via lien, création de compte, connexion, historique et suppression.

---

Q: Quelles US sont optionnelles et où en sont-elles ?
R: US07 upload anonyme (non traité), US08 tags (non traité), US09 mot de passe fichier (livré), US10 expiration automatique (partiel : purge testée, déclenchement manuel).

---

Q: Que manque-t-il exactement pour finir US10 ?
R: Un `@Scheduled` qui appelle `ExpiredFilePurger.purge()`. La logique existe et est testée (`ExpiredFilePurgerIT`) ; seul le déclencheur manque.

---

Q: Pourquoi US10 a-t-elle été mise hors MVP ?
R: La purge manuelle (`deploy/purge-expired.sh`) suffit pour une évaluation. Elle deviendrait nécessaire pour les comptes abandonnés, et sera câblée avec la PR de déploiement.

---

Q: Pourquoi la rotation de la clé JWT toutes les 24 h a-t-elle été écartée ?
R: Elle invalide tous les tokens en cours (sauf jeu de clés `kid`) ; avec des tokens courts et sans refresh token, elle déconnecte souvent les utilisateurs. Un secret stable bien géré suffit pour un MVP.

---

Q: Quelles alternatives à la rotation quotidienne le backlog cite-t-il ?
R: Un secret stable géré par variable d'environnement ou gestionnaire de secrets ; ou RS256 avec un endpoint JWKS et une rotation propre (ancienne clé conservée le temps du recouvrement).

---

Q: Comment se comporte aujourd'hui le secret JWT en production ?
R: Il vient de la variable `DATASHARE_JWT_SECRET` (aucune valeur par défaut). Le changer invalide tous les jetons et déconnecte tout le monde.

---

Q: Pourquoi SpotBugs a-t-il été écarté du MVP ?
R: Essai fait : 9 findings, dont 8 de bruit (`EI_EXPOSE_REP*`, injection par constructeur Spring) et un seul signal réel (`DM_EXIT`). Cela ne justifie pas de maintenir l'outil.

---

Q: Pourquoi la PR nginx gzip + cache (#108) est-elle restée non mergée ?
R: Elle est prête et verte, mais Lighthouse était déjà à 99/100 sans elle : non requise pour le MVP. La branche `perf/nginx-gzip-cache` est conservée.

---

Q: Quel schéma suivre pour justifier un choix de scope à l'oral ?
R: Nommer ce qui n'est pas fait, donner la raison, montrer le filet actuel, dire le déclencheur qui ferait passer le sujet en priorité.
