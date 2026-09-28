# learning — apprentissage et révisions autour de DataShare

Espace de révision construit à partir du projet : fiches de cours, flashcards et
quizz. Il ne contient aucun code de l'application et n'est lu par aucun build.

## Contenu

| Dossier | Rôle | Format |
|---|---|---|
| [`fiches/`](fiches/) | une fiche par sujet : le concept, un tableau comparatif, le lien avec le code du projet | Markdown (sources) ; la fiche contraste reste en HTML |
| [`build/fiches/`](build/fiches/) | PDF des fiches, **générés** : ne pas les modifier à la main | PDF |
| [`build/flashcards/`](build/flashcards/) | CSV d'import Anki, **générés** : idem | CSV |
| [`flashcards/`](flashcards/) | une série de cartes par sujet, pour la mémorisation | Markdown, cartes `Q:` / `R:` séparées par `---` |
| [`quizz/`](quizz/) | questions à choix, avec correction | à définir |

## Conventions

- **Un sujet, un nom commun** : la fiche et les flashcards d'un même sujet portent le même
  préfixe (par exemple `tests-back-mockmvc`).
- **Ancrage dans le projet** : chaque fiche renvoie vers les fichiers réels
  (`FileControllerIT.java`, `TESTING.md`…), pour que le cours reste lié au code.
- **Markdown d'abord** : il se lit sur GitHub et se compare bien dans git. Les fiches `.md`
  (et le HTML de la fiche contraste) sont les sources ; les fichiers de `build/` en dérivent.

## Génération des PDF et des CSV Anki

`learning/build.sh [source...]` produit les fichiers dans `build/fiches/` (PDF) et
`build/flashcards/` (CSV) ; sans argument, toutes les sources sont traitées :

- une fiche `.md` passe par `pandoc` et [`style.css`](style.css), puis Chrome ou Edge en mode
  headless imprime le HTML en PDF ; une fiche `.html` est imprimée directement ;
- un fichier de flashcards devient un CSV par [`anki_csv.py`](anki_csv.py) (`python3`).

Prérequis : `pandoc`, `python3` et un navigateur Chrome, Chromium ou Edge.

Le hook `pre-commit` ([`.githooks/pre-commit`](../.githooks/pre-commit)) le fait
automatiquement : si un commit ajoute, modifie ou supprime une fiche ou un fichier de
flashcards (ou modifie `build.sh`, `anki_csv.py` ou `style.css`), les fichiers concernés sont
régénérés et ajoutés au commit. Activation, une fois par clone :

```bash
git config core.hooksPath .githooks
```

Pour passer outre ponctuellement : `git commit --no-verify`.

## Import des flashcards dans Anki

Le CSV à importer est dans [`build/flashcards/`](build/flashcards/). Ses en-têtes `#...`
choisissent le type de note (Basic) et le paquet (`DataShare::<sujet>`), et le code entre
accents graves devient du `<code>`.

### Sur ordinateur (Anki)

`Fichier > Importer`, puis sélectionner le CSV.

### Sur téléphone (AnkiDroid)

GitHub ne propose pas de téléchargement direct d'un fichier depuis l'application mobile : il
faut passer par le navigateur.

1. Dans l'application GitHub, ouvrir l'onglet **Code**, puis le dossier
   `learning/build/flashcards`.
2. **Partager** cette page vers **Chrome** : le dossier s'ouvre dans le navigateur.
3. Toucher le fichier CSV voulu, puis **`...` > Download**. Le fichier arrive dans les
   téléchargements du téléphone.
4. Dans AnkiDroid, menu **Importer**, choisir **Fichier texte (.txt, .csv)**, puis
   sélectionner le fichier téléchargé.

## Sujets

| Sujet | Fiche | Flashcards |
|---|---|---|
| Tests back : MockMvc, RANDOM_PORT, RestAssured | [fiche](fiches/tests-back-mockmvc-restassured-randomport.md) · [PDF](build/fiches/tests-back-mockmvc-restassured-randomport.pdf) | [cartes](flashcards/tests-back-mockmvc.md) · [CSV Anki](build/flashcards/tests-back-mockmvc.csv) |
| Contraste (accessibilité) | [fiche HTML](fiches/fiche-contraste-v2.html) · [PDF](build/fiches/fiche-contraste-v2.pdf) | — |
