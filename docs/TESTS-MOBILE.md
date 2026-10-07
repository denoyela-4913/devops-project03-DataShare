# Tester DataShare depuis un mobile (Wi-Fi local, 5G)

Ce guide explique comment ouvrir l'application lancée sur le PC (Windows + WSL2) depuis un
mobile, dans trois situations. Chaque scénario donne les commandes à lancer, comment vérifier
que ça marche, et comment tout remettre comme avant.

| Scénario | Appareil | Réseau | Accès par | Pare-feu à ouvrir ? |
|---|---|---|---|---|
| [A](#scénario-a--pc-en-local) | PC | — | `http://localhost:4200` | non |
| [B](#scénario-b--mobile-sur-le-wi-fi-local) | mobile | même Wi-Fi que le PC | `http://<IP du PC>:4200` | **oui** (`lan-setup enable`) |
| [C](#scénario-c--mobile-en-5g-ou-tout-réseau-extérieur) | mobile | 5G ou autre réseau | `https://xxx.trycloudflare.com` | non (tunnel sortant) |

> Les commandes sont à lancer **depuis la racine du dépôt, dans un terminal WSL**. Sous Windows
> natif, utiliser les équivalents `.ps1` (voir [`scripts/README.md`](../scripts/README.md)).

## Comment les liens de partage s'adaptent

Le lien affiché après un dépôt (et le lien « Accéder » de l'historique) est construit avec
l'adresse **réellement ouverte dans le navigateur** :

| Application ouverte sur… | Lien de partage généré |
|---|---|
| `http://localhost:4200` | `http://localhost:4200/d/abc123` |
| `http://192.168.0.76:4200` | `http://192.168.0.76:4200/d/abc123` |
| `https://xxx.trycloudflare.com` | `https://xxx.trycloudflare.com/d/abc123` |

Le backend renvoie un chemin relatif (`/d/abc123`) et le frontend y ajoute son origine. Aucune
adresse IP n'est écrite en dur, et rien n'est à configurer.

Pour **imposer** une adresse (production : https garanti, domaine unique), définir la variable
optionnelle `DATASHARE_DOWNLOAD_BASE_URL` côté backend, par exemple
`https://datashare.example/d` : les liens sont alors toujours absolus et identiques, quelle que
soit l'adresse d'accès. Voir [`MAINTENANCE.md`](../MAINTENANCE.md).

## À faire une seule fois

| Quoi | Pour quel scénario | Comment |
|---|---|---|
| WSL en mode « mirrored » | B | `networkingMode=mirrored` dans `%USERPROFILE%\.wslconfig` (section `[wsl2]`), puis `wsl --shutdown` dans PowerShell. WSL partage alors l'adresse IP de Windows. |
| Réseau Wi-Fi classé « Privé » | B | Paramètres Windows → Réseau → propriétés du Wi-Fi → profil « Privé ». `lan-setup status` l'affiche. |
| Installer `cloudflared` | C | PowerShell : `winget install Cloudflare.cloudflared` |
| Ouvrir le pare-feu | B | `./scripts/lan-setup enable` (voir [`lan-setup`](#lan-setup--ouvrir-et-fermer-le-pare-feu)) |

## Scénario A — PC en local

```bash
./scripts/start-backend-dev
./scripts/start-frontend-dev           # http://localhost:4200
```

Rien d'autre. Si le pare-feu n'est pas ouvert, l'application reste de fait locale, même si le
serveur du frontend écoute sur toutes les interfaces.

## Scénario B — mobile sur le Wi-Fi local

Le mobile et le PC doivent être sur **le même réseau Wi-Fi** (réseau principal de la box, pas un
réseau « invité »), données mobiles coupées et sans VPN.

```bash
./scripts/lan-setup enable             # une fois ; fenêtre de confirmation Windows (UAC)
./scripts/start-backend-dev
./scripts/start-frontend-dev           # écoute sur 0.0.0.0 : http://localhost:4200 reste valable
./scripts/lan-check                    # diagnostic + URL à ouvrir sur le mobile
```

`lan-check` affiche l'adresse du PC (trouvée automatiquement, jamais écrite en dur), vérifie
que les ports écoutent bien sur toutes les interfaces, et donne l'URL à saisir sur le mobile,
par exemple `http://192.168.0.76:4200`. Il accepte aussi `--ping <ip du mobile>` pour tester la
liaison, et `--serve` pour lancer un petit serveur de test quand l'application n'est pas démarrée.

**Pour interdire cet accès** tout en travaillant sur le PC : `./scripts/start-frontend-dev --local`.

### L'option `--local` de `start-frontend-dev`

| | Sans option (défaut) | Avec `--local` |
|---|---|---|
| Serveur du frontend | `ng serve --host 0.0.0.0` : écoute sur toutes les interfaces | `ng serve` : écoute seulement sur `localhost` |
| Ouvert depuis le PC (`localhost:4200`) | oui | oui |
| Ouvert depuis le mobile en Wi-Fi | oui, **si** le pare-feu est ouvert (`lan-setup enable`) | **non** |
| Tunnel Cloudflare (scénario C) | oui | oui (le tunnel se connecte à `localhost`) |

L'option n'est acceptée que par `start-frontend-dev` ; `start-backend-dev --local` renvoie une
erreur. Le backend n'a pas de variante : ses liens de partage ne dépendent plus de l'adresse
d'accès.

Elle ne sert donc plus que dans **un seul cas de test : l'accès depuis un mobile en Wi-Fi**, qu'elle
empêche. Elle est une ceinture de sécurité : le vrai verrou reste le pare-feu. Sans règle
ouverte, le frontend à `0.0.0.0` n'est de toute façon pas joignable depuis le Wi-Fi.

### Le bouton « Copier le lien » sur mobile en Wi-Fi

Sur `http://192.168.0.76:4200`, la page n'est **pas un contexte sécurisé** (HTTP sur une adresse
IP, ce n'est ni HTTPS ni `localhost`) : le navigateur n'y fournit pas `navigator.clipboard`.
L'application utilise alors un repli (`document.execCommand('copy')`) qui ne fait qu'écrire dans
le presse-papiers, sur un clic de l'utilisateur. Si la copie échoue quand même, le bouton
affiche « Copie impossible » : il reste possible de sélectionner le lien à la main.

## Scénario C — mobile en 5G (ou tout réseau extérieur)

Le tunnel Cloudflare relaie une adresse publique en HTTPS vers le PC, par une connexion
**sortante** : pas de réglage de la box, pas de pare-feu à ouvrir, et ça fonctionne même derrière
un CGNAT (adresse IP partagée par l'opérateur).

```bash
./scripts/start-backend-dev
./scripts/start-frontend-docker        # nginx + build de production sur :8082
./scripts/start-tunnel                 # affiche https://xxx.trycloudflare.com
```

Sur le mobile, ouvrir l'adresse affichée **sans numéro de port** (`https://xxx.trycloudflare.com`,
et non `…:8082`). L'adresse change à chaque lancement du tunnel. Elle reste valable depuis le
Wi-Fi maison comme depuis la 5G.

`start-tunnel` vise toujours `http://localhost:<port>` (jamais l'IP du PC : voir le dépannage)
et refuse de démarrer si rien n'écoute sur ce port. Pour passer par `ng serve` au lieu de nginx :

```bash
cd frontend && npx ng serve --host 0.0.0.0 --allowed-hosts .trycloudflare.com
./scripts/start-tunnel --port 4200
```

(Sans `--allowed-hosts`, Angular répond « Blocked request. This host is not allowed » : il refuse
les noms d'hôte qu'il ne connaît pas. nginx accepte tous les noms.)

## `lan-setup` : ouvrir et fermer le pare-feu

```bash
./scripts/lan-setup status             # état, sans droits administrateur
./scripts/lan-setup enable             # ouvre les ports 4200 et 8082
./scripts/lan-setup disable            # supprime les règles créées
```

Équivalent PowerShell : `.\scripts\lan-setup.ps1 enable|disable|status` (ou
`scripts\lan-setup.cmd`). Le lanceur bash `./scripts/lan-setup` appelle `powershell.exe` depuis
WSL (`wslpath -w` convertit le chemin du script en chemin Windows).

En mode « mirrored », le trafic entrant vers WSL traverse **deux** pare-feux : celui de Windows
et celui de Hyper-V. Le script crée une règle dans chacun, pour les ports 4200 (`ng serve`) et
8082 (nginx en conteneur). Le backend (8080) n'est pas ouvert : l'API passe par le proxy du
frontend.

### La fenêtre de confirmation Windows (UAC)

Créer une règle de pare-feu demande les droits d'administrateur. Un processus ne pouvant pas
s'élever lui-même, `enable` et `disable` en relancent un autre en administrateur :

1. Un message prévient qu'une fenêtre de confirmation va s'ouvrir sur Windows (elle peut passer
   derrière d'autres fenêtres : cliquer sur la barre des tâches).
2. Après confirmation, une **fenêtre PowerShell séparée** applique les règles et reste ouverte
   jusqu'à `Entrée`. Son affichage n'apparaît pas dans le terminal WSL.
3. Le script attend la fin de cette fenêtre, puis affiche l'état (`status`) dans le terminal
   d'origine, et renvoie le code de retour.
4. Si la confirmation est refusée, rien n'est modifié et le script le dit.

Le script élevé est dans le dépôt, donc modifiable par ton compte : tout programme capable de le
modifier obtiendrait les droits administrateur à ta prochaine confirmation. C'est un risque
accepté sur un poste de développement personnel ; pour l'éviter, ouvrir un PowerShell administrateur
à la main et y lancer `.\scripts\lan-setup.ps1 enable`.

## Tout défaire

```bash
# Ctrl+C dans le terminal du tunnel
./scripts/stop-frontend-docker
./scripts/stop-frontend ; ./scripts/stop-backend
./scripts/lan-setup disable            # referme le pare-feu (confirmation UAC)
```

Vérifier ensuite : `./scripts/status-appli` (ce qui tourne) et `./scripts/lan-setup status`
(ports : les deux colonnes doivent indiquer « absent »).

## Sécurité

- **Wi-Fi local en HTTP** : le trafic (mot de passe, jeton de connexion, jeton du lien) circule
  **en clair** sur le réseau. À réserver au Wi-Fi domestique de confiance et aux données de test.
  Sur un réseau partagé ou public, préférer le tunnel (HTTPS).
- **Tunnel public** : l'application devient joignable par quiconque connaît l'adresse. L'inscription
  est ouverte (`POST /api/auth/register`), donc un tiers pourrait créer un compte et déposer des
  fichiers sur ton disque ; Swagger et `/v3/api-docs` sont publics dans le profil dev. Données de
  test uniquement, et `Ctrl+C` dès la fin du test. L'adresse aléatoire est difficile à deviner,
  mais ce n'est pas un secret.
- **Ports ouverts** : `lan-setup status` les liste ; `lan-setup disable` les referme.

## Dépannage

| Symptôme | Cause probable | Que faire |
|---|---|---|
| Le ping PC ↔ mobile passe, mais la page ne charge pas depuis le mobile | pare-feu Hyper-V ou règle Windows manquants | `./scripts/lan-setup status` puis `enable` ; réseau Wi-Fi en profil « Privé » |
| Le ping échoue dans un sens | isolation des clients (réseau « invité », bande 2,4/5 GHz séparée) | mobile sur le réseau principal ; `./scripts/lan-check --ping <ip du mobile>` |
| `lan-check` : « n'écoute que sur localhost » | serveur lancé sans `--host 0.0.0.0` | relancer `./scripts/start-frontend-dev` (sans `--local`) |
| `lan-check` : « rien n'écoute » | le service n'est pas démarré | lancer les `start-*` |
| `lan-check` : IP en `172.x` ou `10.255.x` | WSL en mode NAT, pas « mirrored » | voir « À faire une seule fois » |
| `Test-NetConnection 192.168.x.x -Port 4200` renvoie `False` depuis Windows | **normal** en mode mirrored : Windows ne joint pas sa propre IP LAN vers WSL | tester avec `localhost`, et surtout depuis le mobile |
| Tunnel : page qui ne répond pas (timeout) | `cloudflared` vise l'IP du PC au lieu de `localhost` | utiliser `./scripts/start-tunnel` |
| Tunnel : l'adresse avec `:8082` ne marche pas | le tunnel n'écoute qu'en HTTPS (443) | retirer le numéro de port |
| « Blocked request. This host is not allowed » | `ng serve` refuse les noms d'hôte inconnus | `--allowed-hosts .trycloudflare.com`, ou passer par nginx (`start-frontend-docker`) |
| Le lien de partage commence par `localhost` | l'application a été ouverte en `localhost` | l'ouvrir avec l'adresse de l'appareil qui doit utiliser le lien |
| Confirmation UAC introuvable | fenêtre derrière les autres | barre des tâches Windows |

## Les scripts

| Script | Rôle |
|---|---|
| [`scripts/lan-setup`](../scripts/lan-setup) (`.ps1`, `.cmd`) | ouvre / ferme / affiche l'état du pare-feu (Windows + Hyper-V) |
| [`scripts/lan-check`](../scripts/lan-check) | diagnostic réseau côté WSL, URL à ouvrir sur le mobile |
| [`scripts/start-tunnel`](../scripts/start-tunnel) | tunnel public Cloudflare vers `localhost` |
| `scripts/start-frontend-dev [--local]` | `ng serve`, sur `0.0.0.0` par défaut |
| `scripts/start-frontend-docker` | frontend nginx (build de production) sur `:8082` |
