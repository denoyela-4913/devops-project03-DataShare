# Flashcards — CI GitHub Actions : déclencheurs, jobs, commitlint

Fiche associée : [ci-github-actions](../fiches/ci-github-actions.md)

Q: Sur quels événements la CI de DataShare se déclenche-t-elle ?
R: `pull_request` (sans filtre, toute PR) et `push` vers `master` uniquement.

---

Q: Un push sur une branche de travail sans PR ouverte déclenche-t-il la CI ?
R: Non. `push` n'est configuré que pour `branches: [master]`.

---

Q: Que fait `concurrency.group: ci-${{ github.ref }}` avec `cancel-in-progress: true` ?
R: Un nouveau push sur la même branche annule automatiquement le run CI en cours sur cette branche.

---

Q: Les jobs du pipeline dépendent-ils les uns des autres (`needs:`) ?
R: Non, aucun `needs:` n'est utilisé : tous les jobs tournent en parallèle.

---

Q: Que vérifie exactement le job `commitlint` ?
R: Le titre de la Pull Request au format Conventional Commits, via l'action `amannn/action-semantic-pull-request`. Il ne lit aucun commit individuel.

---

Q: Quels types Conventional Commits sont autorisés dans le titre de PR ?
R: `feat, fix, docs, test, chore, ci, refactor, perf, build, style`.

---

Q: Pourquoi le job `commitlint` a-t-il `if: github.event_name == 'pull_request'` ?
R: Parce qu'un push vers `master` n'a pas de « titre de PR » à valider.

---

Q: Pourquoi valider le titre de PR suffit-il, sans vérifier chaque commit de la branche ?
R: `master` impose un merge squash uniquement : GitHub utilise le titre de la PR comme message du commit final sur `master`, donc les commits intermédiaires disparaissent au squash.

---

Q: Y a-t-il un fichier `commitlint.config.js` ou un hook Husky `commit-msg` dans ce dépôt ?
R: Non. La convention de commit n'est contrôlée qu'en CI, sur le titre de PR, via une action GitHub tierce.

---

Q: Quelles règles de protection s'appliquent à la branche `master` ?
R: PR obligatoire, historique linéaire, pas de force-push ni de suppression, merge squash uniquement, CI verte obligatoire.

---

Q: Que faut-il faire manuellement après avoir ajouté un nouveau job au workflow CI ?
R: L'ajouter à la liste des *required status checks* de `master`, une fois qu'il a tourné au moins une fois (GitHub n'expose son nom qu'après un run).

---

Q: Quel workflow séparé fait de l'analyse statique de sécurité (SAST), et à quelle fréquence tourne-t-il en plus des PR et push master ?
R: `codeql.yml` (CodeQL), en plus chaque lundi 04:17 UTC pour rejouer les nouvelles règles sur du code inchangé.
