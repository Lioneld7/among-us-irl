const http = require('http');
const os = require('os');
const { WebSocketServer } = require('ws');

const PORT = process.env.PORT || 3000;
const rooms = new Map();

const HQ = [
  'Apporter une chaussette au QG',
  'Composer un slam de 3 vers avec des rimes sur 3 prénoms de tes potes et le chanter',
  'Lancer 3 dés et obtenir 10 ou 11, recommencer si nécessaire',
  'Faire un flip de bouteille qui retombe debout',
  'Raconter la blague la plus marrante possible',
  'Gagner une manche de Pierre/Feuille/Ciseaux',
  'Créer une bulle de savon et la souffler à travers un cerceau',
  'Envoyer un sachet de thé sur la visière avec un mouvement de tête',
  'Lancer une balle dans une poubelle accrochée dans le dos',
  'Faire rouler une balle de ping-pong dans un verre posé au sol',
  'Construire un château de cartes',
  'Déplacer 5 papiers d’un verre à un autre avec une paille',
  'Faire deviner 3 mots uniquement en les mimant',
  'Faire deviner 3 animaux uniquement en les bruitant',
  'Empiler 5 jetons sur le dos de la main puis tous les rattraper'
];

function code() {
  let c;
  do {
    c = Math.random().toString(36).slice(2, 7).toUpperCase();
  } while (rooms.has(c));
  return c;
}

function id() {
  return Math.random().toString(36).slice(2, 10);
}

function shuffle(a) {
  return [...a].sort(() => Math.random() - 0.5);
}

function send(ws, msg) {
  if (ws.readyState === 1) {
    ws.send(JSON.stringify(msg));
  }
}

function broadcast(room, msg) {
  for (const p of room.players) {
    send(p.ws, msg);
  }
}

function publicPlayers(room) {
  return room.players.map(p => ({
    id: p.id,
    name: p.name,
    alive: p.alive,
    host: p.host
  }));
}

/*
  IMPORTANT :
  Les tâches et réussites des imposteurs existent bien,
  mais elles ne sont jamais comptées pour la victoire des Crewmates.
*/
function taskCount(room) {
  return room.players
    .filter(p => p.role === 'crewmate')
    .reduce((n, p) => n + p.tasks.length, 0);
}

function doneCount(room) {
  return room.players
    .filter(p => p.role === 'crewmate')
    .reduce((n, p) => n + p.done.length, 0);
}

function checkWin(room) {
  if (room.status !== 'playing') return null;

  const imps = room.players.filter(
    p => p.role === 'imposteur' && p.alive
  ).length;

  const crew = room.players.filter(
    p => p.role === 'crewmate' && p.alive
  ).length;

  if (room.players.filter(p => p.role === 'imposteur').length === 0) {
    return 'crewmates';
  }

  if (imps === 0) {
    return 'crewmates';
  }

  /*
    Seules les tâches des Crewmates comptent ici.
    Les tâches des imposteurs sont donc totalement ignorées
    pour cette condition de victoire.
  */
  if (doneCount(room) >= taskCount(room)) {
    return 'crewmates';
  }

  if (imps >= crew) {
    return 'impostors';
  }

  return null;
}

function snapshot(room, recipient) {
  const me = room.players.find(p => p.ws === recipient);

  return {
    type: 'STATE',
    room: room.code,
    status: room.status,
    hostId: room.hostId,

    config: {
      count: room.count,
      impostors: room.impostors,
      tasksPerCrewmate: room.tasksPerCrewmate
    },

    players: publicPlayers(room),

    self: me
      ? {
          id: me.id,
          name: me.name,
          role: me.role,
          alive: me.alive,
          done: me.done,
          tasks: me.tasks,
          pendingHQ: me.pendingHQ
        }
      : null,

    meeting: room.meeting
      ? {
          active: true,
          reportedBy: room.meeting.reportedBy,
          voted: !!(me && room.meeting.votes[me.id]),
          eligible: !!(me && me.alive)
        }
      : {
          active: false
        },

    win: room.win,
    lastResult: room.lastResult || null
  };
}

function push(room) {
  for (const p of room.players) {
    send(p.ws, snapshot(room, p.ws));
  }
}

function startGame(room) {
  const ps = shuffle(room.players);

  const impN = Math.min(
    room.impostors,
    Math.max(1, room.players.length - 1)
  );

  const pool = Array.from({ length: 30 }, (_, i) => i + 1);

  for (let i = 0; i < ps.length; i++) {
    const p = ps[i];

    p.alive = true;
    p.done = [];
    p.pendingHQ = null;

    p.role = i < impN
      ? 'imposteur'
      : 'crewmate';

    /*
      TOUS les joueurs reçoivent maintenant de vraies tâches QR.
      Les imposteurs aussi.
    */
    // TOUS les joueurs reçoivent de vraies tâches QR,
    // y compris les imposteurs. Les tâches des imposteurs
    // ne comptent pas dans la victoire des Crewmates.
    p.tasks = shuffle(pool).slice(
      0,
      Math.min(room.tasksPerCrewmate, 15)
    );

    console.log(
      'TACHES ASSIGNEES:',
      p.name,
      '| role =', p.role,
      '| tasks =', p.tasks.join(',')
    );
  }

  room.status = 'playing';
  room.meeting = null;
  room.win = null;
  room.lastResult = null;

  push(room);
}

function resolveMeeting(room) {
  const votes = room.meeting.votes;
  const counts = {};

  for (const v of Object.values(votes)) {
    counts[v] = (counts[v] || 0) + 1;
  }

  const entries = Object.entries(counts)
    .sort((a, b) => b[1] - a[1]);

  let eliminated = null;

  if (
    entries.length &&
    (!entries[1] || entries[0][1] > entries[1][1])
  ) {
    eliminated = room.players.find(
      p => p.id === entries[0][0]
    );
  }

  if (eliminated) {
    eliminated.alive = false;
  }

  room.meeting.result = eliminated
    ? {
        eliminated: eliminated.name,
        counts
      }
    : {
        eliminated: null,
        counts
      };

  room.lastResult = room.meeting.result;

  const win = checkWin(room);

  if (win) {
    room.status = 'ended';
    room.win = win;
  }

  push(room);

  setTimeout(() => {
    if (room.meeting) {
      room.meeting = null;

      if (room.status === 'playing') {
        push(room);
      }
    }
  }, 4500);
}

const server = http.createServer((req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/plain'
  });

  res.end('Among Us Réel server OK');
});

const wss = new WebSocketServer({
  server
});

wss.on('connection', ws => {
  ws.on('message', raw => {
    let m;

    try {
      m = JSON.parse(raw);
    } catch {
      return;
    }

    if (m.type === 'CREATE') {
      const r = {
        code: code(),
        count: Math.max(
          2,
          Math.min(15, +m.count || 6)
        ),

        impostors: Math.max(
          1,
          Math.min(4, +m.impostors || 1)
        ),

        tasksPerCrewmate: Math.max(
          1,
          Math.min(15, +m.tasksPerCrewmate || 5)
        ),

        status: 'lobby',
        hostId: null,
        players: [],
        meeting: null,
        win: null,
        lastResult: null
      };

      const p = {
        id: id(),
        name: String(m.name || 'Joueur')
          .trim()
          .slice(0, 20),

        host: true,
        ws,
        alive: true,
        role: null,
        tasks: [],
        done: [],
        pendingHQ: null
      };

      r.hostId = p.id;
      r.players.push(p);

      rooms.set(r.code, r);
      ws.room = r.code;

      send(ws, {
        type: 'JOINED',
        room: r.code
      });

      push(r);

    } else if (m.type === 'JOIN') {

      const r = rooms.get(
        String(m.room || '').toUpperCase()
      );

      if (!r) {
        return send(ws, {
          type: 'ERROR',
          message: 'Partie introuvable'
        });
      }

      if (r.status !== 'lobby') {
        return send(ws, {
          type: 'ERROR',
          message: 'La partie a déjà commencé'
        });
      }

      if (r.players.length >= r.count) {
        return send(ws, {
          type: 'ERROR',
          message: 'La partie est complète'
        });
      }

      const name = String(m.name || 'Joueur')
        .trim()
        .slice(0, 20);

      if (!name) {
        return send(ws, {
          type: 'ERROR',
          message: 'Nom requis'
        });
      }

      if (
        r.players.some(
          p => p.name.toLowerCase() === name.toLowerCase()
        )
      ) {
        return send(ws, {
          type: 'ERROR',
          message: 'Ce nom est déjà utilisé'
        });
      }

      const p = {
        id: id(),
        name,
        host: false,
        ws,
        alive: true,
        role: null,
        tasks: [],
        done: [],
        pendingHQ: null
      };

      r.players.push(p);
      ws.room = r.code;

      send(ws, {
        type: 'JOINED',
        room: r.code
      });

      push(r);

    } else {

      const r = rooms.get(ws.room);

      if (!r) {
        return send(ws, {
          type: 'ERROR',
          message: 'Aucune partie'
        });
      }

      const me = r.players.find(
        p => p.ws === ws
      );

      if (!me) return;

      /*
        Lancement de la partie.
        Pour notre test, 2 joueurs minimum suffisent.
      */
      if (m.type === 'START') {

        if (me.id !== r.hostId) {
          return send(ws, {
            type: 'ERROR',
            message: 'Seul le créateur peut lancer la partie'
          });
        }

        if (r.players.length < 2) {
          return send(ws, {
            type: 'ERROR',
            message: 'Il faut au moins 2 joueurs'
          });
        }

        startGame(r);

      /*
        Mini-jeu :
        CREWMATE ET IMPOSTEUR peuvent réussir leurs tâches.
        Mais seules les tâches Crewmates comptent dans checkWin().
      */
      } else if (
        m.type === 'FINISH_MINI' &&
        r.status === 'playing' &&
        me.alive
      ) {

        const n = +m.task;

        if (
          me.tasks.includes(n) &&
          !me.done.includes(n) &&
          n >= 1 &&
          n <= 15
        ) {
          me.done.push(n);

          push(r);

          const win = checkWin(r);

          if (win) {
            r.status = 'ended';
            r.win = win;
            push(r);
          }
        }

      /*
        Épreuve QG :
        CREWMATE ET IMPOSTEUR peuvent en avoir une.
      */
      } else if (
        m.type === 'START_HQ' &&
        r.status === 'playing' &&
        me.alive
      ) {

        const n = +m.task;

        if (
          me.tasks.includes(n) &&
          !me.done.includes(n) &&
          n >= 16 &&
          n <= 30
        ) {
          me.pendingHQ = n;
          push(r);
        }

      /*
        Validation QG :
        CREWMATE ET IMPOSTEUR peuvent valider.
        Les tâches de l'imposteur ne déclenchent jamais
        la victoire des Crewmates.
      */
      } else if (
        m.type === 'VALIDATE_HQ' &&
        r.status === 'playing' &&
        me.alive
      ) {

        const n = +m.task;

        if (
          me.pendingHQ === n &&
          me.tasks.includes(n) &&
          !me.done.includes(n)
        ) {
          me.done.push(n);
          me.pendingHQ = null;

          push(r);

          const win = checkWin(r);

          if (win) {
            r.status = 'ended';
            r.win = win;
            push(r);
          }
        }

      /*
        Élimination réservée aux imposteurs.
      */
      } else if (
        m.type === 'KILL' &&
        r.status === 'playing' &&
        me.alive &&
        me.role === 'imposteur'
      ) {

        const target = r.players.find(
          p => p.id === m.target
        );

        if (
          target &&
          target.alive &&
          target.id !== me.id
        ) {
          target.alive = false;

          push(r);

          const win = checkWin(r);

          if (win) {
            r.status = 'ended';
            r.win = win;
            push(r);
          }
        }

      /*
        Tout joueur vivant peut signaler un mort.
      */
      } else if (
        m.type === 'REPORT' &&
        r.status === 'playing' &&
        me.alive
      ) {

        r.meeting = {
          reportedBy: me.name,
          votes: {}
        };

        push(r);

      /*
        Vote.
      */
      } else if (
        m.type === 'VOTE' &&
        r.status === 'playing' &&
        r.meeting &&
        me.alive
      ) {

        if (!r.meeting.votes[me.id]) {

          const target = r.players.find(
            p => p.id === m.target
          );

          if (
            target &&
            target.alive &&
            target.id !== me.id
          ) {
            r.meeting.votes[me.id] = target.id;

            push(r);

            if (
              Object.keys(r.meeting.votes).length ===
              r.players.filter(p => p.alive).length
            ) {
              resolveMeeting(r);
            }
          }
        }

      /*
        Vote blanc.
      */
      } else if (
        m.type === 'SKIP_VOTE' &&
        r.status === 'playing' &&
        r.meeting &&
        me.alive
      ) {

        if (!r.meeting.votes[me.id]) {

          r.meeting.votes[me.id] = 'skip';

          push(r);

          if (
            Object.keys(r.meeting.votes).length ===
            r.players.filter(p => p.alive).length
          ) {
            resolveMeeting(r);
          }
        }
      }
    }
  });

  ws.on('close', () => {

    const r = rooms.get(ws.room);

    if (!r) return;

    const p = r.players.find(
      p => p.ws === ws
    );

    if (!p) return;

    if (r.status === 'lobby') {

      r.players = r.players.filter(
        x => x !== p
      );

      if (p.id === r.hostId) {

        if (r.players[0]) {
          r.hostId = r.players[0].id;
          r.players[0].host = true;
        } else {
          rooms.delete(r.code);
          return;
        }
      }

      push(r);

    } else {

      p.connected = false;
      push(r);
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {

  const ips = [];

  for (const n of Object.values(os.networkInterfaces())) {
    for (const x of n || []) {
      if (
        x.family === 'IPv4' &&
        !x.internal
      ) {
        ips.push(x.address);
      }
    }
  }

  console.log(
    `Among Us Réel server listening on port ${PORT}`
  );

  console.log(
    `LAN: ${
      ips.map(x => `ws://${x}:${PORT}`).join('  ') ||
      `ws://localhost:${PORT}`
    }`
  );
});