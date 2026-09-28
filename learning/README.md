# learning — apprentissage et révisions autour de DataShare

Espace de révision construit à partir du projet : fiches de cours, flashcards et
quizz. Il ne contient aucun code de l'application et n'est lu par aucun build.

## Contenu

| Dossier | Rôle | Format |
|---|---|---|
| [`fiches/`](fiches/) | une fiche par sujet : le concept, un tableau comparatif, le lien avec le code du projet | Markdown (les fiches plus anciennes sont en HTML + PDF) |
| [`flashcards/`](flashcards/) | une série de cartes par sujet, pour la mémorisation | Markdown, cartes `Q:` / `R:` séparées par `---` |
| [`quizz/`](quizz/) | questions à choix, avec correction | à définir |

## Conventions

- **Un sujet, un nom commun** : la fiche et les flashcards d'un même sujet portent le même
  préfixe (par exemple `tests-back-mockmvc`).
- **Ancrage dans le projet** : chaque fiche renvoie vers les fichiers réels
  (`FileControllerIT.java`, `TESTING.md`…), pour que le cours reste lié au code.
- **Markdown d'abord** : il se lit sur GitHub et se compare bien dans git. Pour produire un
  HTML ou un PDF : `pandoc fiche.md -o fiche.pdf`.
- **Import Anki** : les cartes `Q:` / `R:` se transforment facilement en CSV.

## Sujets

| Sujet | Fiche | Flashcards |
|---|---|---|
| Tests back : MockMvc, RANDOM_PORT, RestAssured | [fiche](fiches/tests-back-mockmvc-restassured-randomport.md) | [cartes](flashcards/tests-back-mockmvc.md) |
| Contraste (accessibilité) | [fiche HTML](fiches/fiche-contraste-v2.html) · [PDF](fiches/fiche-contraste-v2.pdf) | — |
