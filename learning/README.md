# learning — apprentissage et révisions autour de DataShare

Espace de révision construit à partir du projet : fiches de cours, flashcards et
quizz. Il ne contient aucun code de l'application et n'est lu par aucun build.

## Contenu

| Dossier | Rôle | Format |
|---|---|---|
| [`fiches/`](fiches/) | une fiche par sujet : le concept, un tableau comparatif, le lien avec le code du projet | Markdown (sources) ; la fiche contraste reste en HTML |
| [`build/`](build/) | fichiers **générés** : ne pas les modifier à la main | PDF (fiches), CSV (flashcards) |
| [`flashcards/`](flashcards/) | une série de cartes par sujet, pour la mémorisation | Markdown, cartes `Q:` / `R:` séparées par `---` |
| [`quizz/`](quizz/) | questions à choix, avec correction | à définir |

## Conventions

- **Un sujet, un nom commun** : la fiche et les flashcards d'un même sujet portent le même
  préfixe (par exemple `tests-back-mockmvc`).
- **Ancrage dans le projet** : chaque fiche renvoie vers les fichiers réels
  (`FileControllerIT.java`, `TESTING.md`…), pour que le cours reste lié au code.
- **Markdown d'abord** : il se lit sur GitHub et se compare bien dans git. Les fiches `.md`
  (et le HTML de la fiche contraste) sont les sources ; les PDF de `build/` en dérivent.

## Génération des PDF et des CSV Anki

`learning/build.sh [source...]` produit les fichiers dans `build/` (toutes les sources sans
argument) :

- une fiche `.md` passe par `pandoc` et [`style.css`](style.css), puis Chrome ou Edge en mode
  headless imprime le HTML en PDF ; une fiche `.html` est imprimée directement ;
- un fichier de flashcards devient un CSV par [`anki_csv.py`](anki_csv.py) (`python3`).

Prérequis : `pandoc`, `python3` et un navigateur Chrome, Chromium ou Edge.

**Import dans Anki** : `Fichier > Importer`, puis le CSV de `build/`. Les en-têtes `#...` du
fichier choisissent le type de note (Basic) et le paquet (`DataShare::<sujet>`), et le code
entre accents graves devient du `<code>`. Réimporter après une modification met à jour les
cartes dont la question n'a pas changé.

Le hook `pre-commit` ([`.githooks/pre-commit`](../.githooks/pre-commit)) le fait
automatiquement : si un commit ajoute, modifie ou supprime une fiche ou un fichier de flashcards (ou
modifie `build.sh`, `anki_csv.py` ou `style.css`), les fichiers concernés sont régénérés et
ajoutés au commit. Activation, une fois par
clone :

```bash
git config core.hooksPath .githooks
```

Pour passer outre ponctuellement : `git commit --no-verify`.

## Sujets

| Sujet | Fiche | Flashcards |
|---|---|---|
| Tests back : MockMvc, RANDOM_PORT, RestAssured | [fiche](fiches/tests-back-mockmvc-restassured-randomport.md) · [PDF](build/tests-back-mockmvc-restassured-randomport.pdf) | [cartes](flashcards/tests-back-mockmvc.md) · [CSV Anki](build/tests-back-mockmvc.csv) |
| Contraste (accessibilité) | [fiche HTML](fiches/fiche-contraste-v2.html) · [PDF](build/fiche-contraste-v2.pdf) | — |
