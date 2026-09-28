# Flashcards — Tests back : MockMvc, RANDOM_PORT, RestAssured

Fiche associée : [tests-back-mockmvc-restassured-randomport](../fiches/tests-back-mockmvc-restassured-randomport.md)

Q: Qu'est-ce que MockMvc ?
R: Un client de test fourni par Spring (`spring-test`). Il simule des requêtes HTTP en les envoyant directement à la `DispatcherServlet`, sans serveur ni réseau.

---

Q: Avec MockMvc, qu'est-ce qui passe par Spring et qu'est-ce qui est court-circuité ?
R: Passent par Spring : routage, désérialisation JSON, validation, sécurité, `@ExceptionHandler`. Court-circuité : la couche réseau (Tomcat, sockets).

---

Q: Quelle est la valeur par défaut de `webEnvironment` dans `@SpringBootTest` ?
R: `MOCK` : un environnement web simulé, sans serveur. C'est le mode à utiliser avec MockMvc.

---

Q: Que fait `RANDOM_PORT` ?
R: Il démarre un vrai serveur embarqué (Tomcat) sur un port libre choisi au hasard.

---

Q: Pourquoi le port est-il aléatoire avec `RANDOM_PORT` ?
R: Pour éviter les conflits de port quand plusieurs tests ou builds tournent en parallèle.

---

Q: Quelle annotation récupère le port choisi par `RANDOM_PORT` ?
R: `@LocalServerPort`, sur un champ `int port`.

---

Q: Citez les quatre valeurs de `webEnvironment`.
R: `MOCK` (défaut), `RANDOM_PORT`, `DEFINED_PORT` (port de la configuration) et `NONE` (pas d'environnement web).

---

Q: RestAssured a-t-il besoin d'un serveur qui tourne ? Que doit-on lui associer ?
R: Oui, car il envoie de vraies requêtes HTTP. On l'associe donc à `RANDOM_PORT`.

---

Q: Quel outil choisir pour tester une limite d'upload appliquée par Tomcat ? Pourquoi ?
R: RestAssured avec `RANDOM_PORT`. MockMvc court-circuite Tomcat et ne voit donc pas cette limite.

---

Q: Lequel est le plus rapide, MockMvc ou RestAssured + `RANDOM_PORT` ?
R: MockMvc : pas de serveur à démarrer, pas de réseau.

---

Q: Quel outil les tests d'intégration du back de DataShare utilisent-ils ?
R: MockMvc en mode `MOCK` (voir `AbstractIntegrationTest` et `FileControllerIT`). RestAssured n'est pas dans le `pom.xml`.
