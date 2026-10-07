# Among Us Réel — V3 multijoueur local

Cette version ajoute un vrai serveur de partie pour que plusieurs téléphones puissent jouer ensemble sur le même Wi‑Fi.

## Ce qui est maintenant synchronisé

- création et rejoindre une partie avec un code ;
- vraie liste de joueurs entre téléphones ;
- lancement par l'hôte ;
- attribution secrète des rôles côté serveur ;
- tâches individuelles ;
- validation des mini-jeux ;
- validation des défis QG par QR du meneur ;
- élimination d'un joueur ;
- état vivant/mort synchronisé ;
- signalement et réunion ;
- vote synchronisé ;
- conditions de victoire :
  - toutes les tâches des crewmates terminées ;
  - tous les imposteurs éliminés ;
  - imposteurs vivants >= crewmates vivants.

## Important

Pour ce premier test, la proximité de l'imposteur est encore **simulée** : l'imposteur voit les joueurs vivants de la partie. Le Bluetooth/BLE sera ajouté ensuite.

## Installation du serveur (sur le PC)

Ouvre une deuxième fenêtre de commande dans le dossier `server` (ou directement dans ce dossier si tu copies `server.js` et `server-package.json`).

1. Installer Node.js si ce n'est pas déjà fait.
2. Installer le module serveur :

```bash
npm install --package-lock=false --prefix server ws
```

Ou, plus simplement, dans le dossier du serveur :

```bash
npm install ws
```

3. Lancer :

```bash
node server.js
```

Le serveur affiche l'adresse Wi‑Fi à utiliser, par exemple :

```text
LAN: ws://192.168.1.82:3000
```

## Installation de l'application

Dans le dossier de l'application :

```bash
npm install
```

Puis :

```bash
npx expo start --clear
```

Ouvre l'application avec Expo Go.

Dans l'écran de départ, le champ **Serveur de partie** doit contenir l'adresse affichée par `node server.js`.

## Test à 4 téléphones

- Téléphone 1 : créer la partie.
- Téléphones 2, 3 et 4 : entrer le même code et rejoindre.
- L'hôte lance la partie.
- Chaque téléphone reçoit son rôle secret.
- Tester ensuite une élimination et une réunion.

## QR

Les QR existants sont dans `qr_codes/` :

- `QR_01_PHONE.png` à `QR_15_PHONE.png`
- `QR_16_HQ.png` à `QR_30_HQ.png`
- `QR_QG_VALIDATION.png`



V3 corrigée 3 : reconnexion d’un joueur autorisée pendant une partie pour éviter la perte de session lors d’une coupure WebSocket.
