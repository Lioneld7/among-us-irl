import React,{useEffect,useRef,useState}from'react';
import{View,Text,TextInput,Image,Pressable,StyleSheet,ScrollView,Alert}from'react-native';
import{SafeAreaView}from'react-native-safe-area-context';
import{StatusBar}from'expo-status-bar';
import{CameraView,useCameraPermissions}from'expo-camera';
import AsyncStorage from'@react-native-async-storage/async-storage';
import{useAudioPlayer,setAudioModeAsync}from'expo-audio';


const PLAYER_QR_IMAGES={
  P001:require('./assets/player_qr/P001.png'),P002:require('./assets/player_qr/P002.png'),P003:require('./assets/player_qr/P003.png'),
  P004:require('./assets/player_qr/P004.png'),P005:require('./assets/player_qr/P005.png'),P006:require('./assets/player_qr/P006.png'),
  P007:require('./assets/player_qr/P007.png'),P008:require('./assets/player_qr/P008.png'),P009:require('./assets/player_qr/P009.png'),
  P010:require('./assets/player_qr/P010.png'),P011:require('./assets/player_qr/P011.png'),P012:require('./assets/player_qr/P012.png'),
  P013:require('./assets/player_qr/P013.png'),P014:require('./assets/player_qr/P014.png'),P015:require('./assets/player_qr/P015.png'),
  P016:require('./assets/player_qr/P016.png'),P017:require('./assets/player_qr/P017.png'),P018:require('./assets/player_qr/P018.png'),
  P019:require('./assets/player_qr/P019.png'),P020:require('./assets/player_qr/P020.png'),P021:require('./assets/player_qr/P021.png'),
  P022:require('./assets/player_qr/P022.png'),P023:require('./assets/player_qr/P023.png'),P024:require('./assets/player_qr/P024.png'),
  P025:require('./assets/player_qr/P025.png'),P026:require('./assets/player_qr/P026.png'),P027:require('./assets/player_qr/P027.png'),
  P028:require('./assets/player_qr/P028.png'),P029:require('./assets/player_qr/P029.png'),P030:require('./assets/player_qr/P030.png')
};

const HQ=[
'Apporter une chaussette au QG','Composer un slam de 3 vers avec des rimes sur 3 prénoms de tes potes et le chanter','Lancer 3 dés et obtenir 10 ou 11, recommencer si nécessaire','Faire un flip de bouteille qui retombe debout','Raconter la blague la plus marrante possible','Gagner une manche de Pierre/Feuille/Ciseaux','Créer une bulle de savon et la souffler à travers un cerceau','Envoyer un sachet de thé sur la visière avec un mouvement de tête','Lancer une balle dans une poubelle accrochée dans le dos','Faire rouler une balle de ping-pong dans un verre posé au sol','Construire un château de cartes','Déplacer 5 papiers d’un verre à un autre avec une paille','Faire deviner 3 mots uniquement en les mimant','Faire deviner 3 animaux uniquement en les bruitant','Empiler 5 jetons sur le dos de la main puis tous les rattraper'
];

const MINI=['Mémoire éclair','Réaction','Calcul express','Suite de couleurs','Compter les intrus','Code secret','Cible mobile','Ordre croissant','Pair ou impair','Trouver le symbole','Mot à compléter','Pastilles piégées','Compte à rebours','Attrape le bon symbole','Séquence finale'];

const DEFAULT_SERVER='ws://192.168.1.82:3000';

export default function App(){
 const [server,setServer]=useState(DEFAULT_SERVER),[name,setName]=useState(''),[code,setCode]=useState(''),[screen,setScreen]=useState('home');
 const [count,setCount]=useState('6'),[imp,setImp]=useState('1'),[tc,setTc]=useState('5');
 const [state,setState]=useState(null),[task,setTask]=useState(null),[scan,setScan]=useState(false),[perm,ask]=useCameraPermissions();
 const [identityLoaded,setIdentityLoaded]=useState(false),[identityValidated,setIdentityValidated]=useState(false),[playerQr,setPlayerQr]=useState('');

const [memoryPhase,setMemoryPhase]=useState('show'),[memoryTarget,setMemoryTarget]=useState([]),[memoryChoices,setMemoryChoices]=useState([]);
 const [reactionPhase,setReactionPhase]=useState('ready'),[reactionStart,setReactionStart]=useState(0),[reactionRound,setReactionRound]=useState(0);
 const [calcQuestion,setCalcQuestion]=useState(null),[calcChoices,setCalcChoices]=useState([]),[calcAnswer,setCalcAnswer]=useState(null);
 const [colorSequence,setColorSequence]=useState([]),[colorChoices,setColorChoices]=useState([]),[colorIndex,setColorIndex]=useState(0);
 const [intruderCount,setIntruderCount]=useState(0),[intruderChoices,setIntruderChoices]=useState([]),[intruderPhase,setIntruderPhase]=useState('show'),[intruderSymbols,setIntruderSymbols]=useState([]);
 const [secretCode,setSecretCode]=useState(''),[secretInput,setSecretInput]=useState(''),[secretPhase,setSecretPhase]=useState('show');
 const [targetHits,setTargetHits]=useState(0),[targetPosition,setTargetPosition]=useState({top:160,left:100}),[targetVisible,setTargetVisible]=useState(false),[targetColor,setTargetColor]=useState('red');
 const [orderNumbers,setOrderNumbers]=useState([]),[orderNext,setOrderNext]=useState(1);
 const [evenNumber,setEvenNumber]=useState(0),[evenRound,setEvenRound]=useState(0),[evenVisible,setEvenVisible]=useState(true);
 const [symbolTarget,setSymbolTarget]=useState(''),[symbolChoices,setSymbolChoices]=useState([]),[symbolRound,setSymbolRound]=useState(0),[symbolTimeLeft,setSymbolTimeLeft]=useState(2);
 const [missingWord,setMissingWord]=useState(''),[missingAnswer,setMissingAnswer]=useState(''),[missingInput,setMissingInput]=useState('');
 const [bombPositions,setBombPositions]=useState([]),[bombScore,setBombScore]=useState(0),[bombChoices,setBombChoices]=useState([]);
 const [countdown,setCountdown]=useState(10),[countdownRunning,setCountdownRunning]=useState(false),[countdownStart,setCountdownStart]=useState(0),[countdownDisplay,setCountdownDisplay]=useState(true);
 const [symbolRound14,setSymbolRound14]=useState(0),[targetSymbol14,setTargetSymbol14]=useState(''),[choices14,setChoices14]=useState([]),[symbol14Phase,setSymbol14Phase]=useState('show');
 const [finalSequence,setFinalSequence]=useState([]),[finalChoices,setFinalChoices]=useState([]),[finalIndex,setFinalIndex]=useState(-1);
 const [message,setMessage]=useState('');
 const [bombSeconds,setBombSeconds]=useState(0),[killFlash,setKillFlash]=useState(false);
 const bombLocalDeadline=useRef(null);
const [connecting,setConnecting]=useState(false),[justDied,setJustDied]=useState(false),[roleIntro,setRoleIntro]=useState(false),[reportMode,setReportMode]=useState(false),[impostorMode,setImpostorMode]=useState(false),ws=useRef(null);
 const scanSound=useAudioPlayer(require('./assets/sounds/scan_bip.wav'));
 const alarmSound=useAudioPlayer(require('./assets/sounds/alarm_loop.wav'));
 const deathSound=useAudioPlayer(require('./assets/sounds/death_blade.wav'));
 const impostorWinSound=useAudioPlayer(require('./assets/sounds/victoire_imposteurs.wav'));
 const crewmateWinSound=useAudioPlayer(require('./assets/sounds/victoire_crewmates.wav'));
 const session=useRef({action:null,room:null,name:'',qr:''}),reconnectTimer=useRef(null);
 useEffect(()=>{
   (async()=>{
     try{
       await setAudioModeAsync({
         playsInSilentMode:true,
         interruptionMode:'mixWithOthers'
       });
       scanSound.volume=1;
       alarmSound.volume=1;
       deathSound.volume=1;
     }catch(e){
       console.warn('Impossible de configurer l’audio.',e);
     }
   })();
 },[scanSound,alarmSound,deathSound]);
 useEffect(()=>{
   alarmSound.loop=true;
   return()=>{try{alarmSound.pause();alarmSound.seekTo(0);}catch{}};
 },[alarmSound]);

 useEffect(()=>{
   if(state?.bomb?.active){
     try{alarmSound.loop=true;alarmSound.play();}catch{}
   }else{
     try{alarmSound.pause();alarmSound.seekTo(0);}catch{}
   }
 },[state?.bomb?.active,alarmSound]);

 useEffect(()=>{
   if(!state?.bomb?.active){
     bombLocalDeadline.current=null;
     setBombSeconds(0);
     return;
   }

   if(bombLocalDeadline.current===null){
     bombLocalDeadline.current=Date.now()+30000;
   }

   const update=()=>{
     const left=Math.max(0,Math.ceil((bombLocalDeadline.current-Date.now())/1000));
     setBombSeconds(left);
   };

   update();
   const timer=setInterval(update,100);
   return()=>clearInterval(timer);
 },[state?.bomb?.active]);

 useEffect(()=>{
   if(justDied){
     try{deathSound.seekTo(0);deathSound.play();}catch{}
   }
 },[justDied,deathSound]);
 useEffect(()=>{
   (async()=>{
     try{
       const saved=await AsyncStorage.getItem('@among_us_irl_player');
       if(saved){
         const data=JSON.parse(saved);
         if(data?.qr&&data?.name){
           setPlayerQr(String(data.qr));
           setName(String(data.name));
           setIdentityValidated(true);
         }
       }
     }catch(e){
       console.warn('Impossible de charger le joueur mémorisé.',e);
     }finally{
       setIdentityLoaded(true);
     }
   })();
 },[]);

 const lastWin=useRef(null),lastResult=useRef(null),pending=useRef(null),roleSeen=useRef(false);

 const send=(m)=>{
   if(ws.current?.readyState===1){
     ws.current.send(JSON.stringify(m));
     return true;
   }
   pending.current=m;
   reconnect();
   return false;
 };

 const reconnect=()=>{
   const room=state?.room||session.current.room;
   const nm=session.current.name||name.trim();
   const qrId=session.current.qr||playerQr.trim();
   const url=server.trim().replace(/\/$/,'');
   if(!room||!nm||!qrId||(!url.startsWith('ws://')&&!url.startsWith('wss://'))){
     Alert.alert('Connexion','La connexion au serveur est perdue.');
     return;
   }

   setConnecting(true);
   const sock=new WebSocket(url);
   ws.current=sock;

   sock.onopen=()=>{
     sock.send(JSON.stringify({type:'JOIN',name:nm,qr:qrId,room}));
   };

   sock.onmessage=e=>{
     let m;
     try{m=JSON.parse(e.data)}catch{return}

     if(m.type==='ERROR'){
       setConnecting(false);
       pending.current=null;
       Alert.alert('Connexion',m.message);
       return;
     }

     if(m.type==='JOINED'){
       setConnecting(false);
       session.current={action:'join',room:m.room,name:nm,qr:qrId};
       const p=pending.current;
       pending.current=null;
       if(p)setTimeout(()=>{
         if(ws.current?.readyState===1)ws.current.send(JSON.stringify(p));
       },50);
       return;
     }

     if(m.type==='STATE'){
       setState(m);

       if(m.status==='playing'&&m.self?.role&&!roleSeen.current){
         roleSeen.current=true;
         setRoleIntro(true);
         setReportMode(false);
         setImpostorMode(false);
       }

       // Une réunion doit toujours prendre la priorité sur l'écran de l'imposteur.
       // Tous les joueurs encore vivants, y compris l'imposteur, doivent y participer.
       if(m.meeting?.active&&m.self?.alive){
         setRoleIntro(false);
         setReportMode(false);
         setImpostorMode(false);
         setJustDied(false);
       }

       if(m.status==='lobby')
         setScreen('lobby');
       else if(m.status==='playing'||m.status==='ended')
         setScreen('game');
     }
   };

   sock.onerror=()=>{setConnecting(false)};
   sock.onclose=()=>{
     setConnecting(false);
     if(session.current.room&&session.current.name&&session.current.qr&&!reconnectTimer.current){
       reconnectTimer.current=setTimeout(()=>{
         reconnectTimer.current=null;
         reconnect();
       },1000);
     }
   };
 };

 const connect=async(action)=>{
   const url=server.trim().replace(/\/$/,'');

   if(!url.startsWith('ws://')&&!url.startsWith('wss://'))
     return Alert.alert('Adresse serveur','Utilise par exemple ws://192.168.1.82:3000');

   if(!name.trim())
     return Alert.alert('Nom requis','Entre ton nom.');

   let qrId=playerQr.trim();

   // Sécurité : relire l'identité directement depuis le stockage
   // afin de ne jamais perdre le QR entre l'écran d'identification
   // et la création/rejoint de partie.
   if(!qrId){
     try{
       const saved=await AsyncStorage.getItem('@among_us_irl_player');
       if(saved){
         const data=JSON.parse(saved);
         if(data?.qr){
           qrId=String(data.qr).trim();
           setPlayerQr(qrId);
         }
       }
     }catch(e){
       console.warn('Impossible de relire le joueur mémorisé.',e);
     }
   }

   if(!qrId)
     return Alert.alert('QR requis','Associe d’abord ton QR personnel.');

   setConnecting(true);
   setMessage('Connexion au serveur…');

   session.current={
     action,
     room:code.toUpperCase(),
     name:name.trim(),
     qr:qrId
   };

   const sock=new WebSocket(url);
   ws.current=sock;

   sock.onopen=()=>{
     setMessage('');
     setConnecting(false);

     if(action==='create')
       send({
         type:'CREATE',
         name:name.trim(),
         qr:qrId,
         count,
         impostors:imp,
         tasksPerCrewmate:tc
       });
     else
       send({
         type:'JOIN',
         name:name.trim(),
         qr:qrId,
         room:code.toUpperCase()
       });
   };

   sock.onmessage=e=>{
     let m;
     try{m=JSON.parse(e.data)}catch{return}

     if(m.type==='ERROR'){
       setConnecting(false);
       Alert.alert('Erreur',m.message);
       return;
     }

     if(m.type==='JOINED'){
       setCode(m.room);
       session.current={
         action:'join',
         room:m.room,
         name:name.trim(),
          qr:playerQr.trim()
       };
       setScreen('lobby');
       return;
     }

     if(m.type==='STATE'){
       setState(m);

       if(m.status==='playing'&&m.self?.role&&!roleSeen.current){
         roleSeen.current=true;
         setRoleIntro(true);
         setReportMode(false);
         setImpostorMode(false);
       }

       if(m.lastEvent?.type==='KILLED'&&m.lastEvent.targetId===m.self?.id)
         setJustDied(true);

       if(m.status==='lobby')
         setScreen('lobby');
       else if(m.status==='playing'||m.status==='ended')
         setScreen('game');

       if(m.win&&m.win!==lastWin.current){
         lastWin.current=m.win;
         try{
           const winSound=m.win==='crewmates'?crewmateWinSound:impostorWinSound;
           winSound.seekTo(0);
           winSound.play();
         }catch(e){
           console.warn('Impossible de jouer le son de victoire.',e);
         }
       }

       if(m.lastResult&&JSON.stringify(m.lastResult)!==JSON.stringify(lastResult.current)){
         lastResult.current=m.lastResult;
         const r=m.lastResult;

         Alert.alert(
           'Résultat du vote',
           r.eliminated
             ?`${r.eliminated} est éliminé.`
             :'Personne n’est éliminé.'
         );
       }
     }
   };

   sock.onerror=()=>{
     setConnecting(false);
     Alert.alert(
       'Connexion impossible',
       'Vérifie que le serveur est lancé sur le PC et que le téléphone est sur le même Wi-Fi.'
     );
   };

   sock.onclose=()=>{
     if(session.current.room&&session.current.name&&!reconnectTimer.current){
       reconnectTimer.current=setTimeout(()=>{
         reconnectTimer.current=null;
         reconnect();
       },1000);
     }
     if(screen!=='home')
       setMessage('Connexion au serveur fermée.');
   };
 };

 useEffect(()=>()=>ws.current?.close(),[]);


 const validateIdentity=async()=>{
   const nm=name.trim();
   const qrId=playerQr.trim();

   if(!qrId)
     return Alert.alert('QR requis','Scanne d’abord ton QR personnel.');

   if(!nm)
     return Alert.alert('Nom requis','Entre ton nom.');

   try{
     await AsyncStorage.setItem(
       '@among_us_irl_player',
       JSON.stringify({qr:qrId,name:nm})
     );
     setName(nm);
     setIdentityValidated(true);
     Alert.alert('Joueur enregistré',`QR ${qrId} associé à ${nm}.`,[
       {text:'CONTINUER'}
     ]);
   }catch(e){
     Alert.alert(
       'Erreur',
       'Impossible de mémoriser le joueur sur ce téléphone.'
     );
   }
 };

 const changePlayer=async()=>{
   try{
     await AsyncStorage.removeItem('@among_us_irl_player');
   }catch(e){
     console.warn('Impossible de supprimer le joueur mémorisé.',e);
   }
   setPlayerQr('');
   setName('');
   setIdentityValidated(false);
 };
 const openScan=async()=>{
   if(!perm?.granted){
     const r=await ask();
     if(!r.granted)return;
   }

   // Initialise le lecteur avant l'ouverture de la caméra.
   // Le démarrage est muet : aucun son supplémentaire n'est joué au joueur.
   try{
     scanSound.volume=0;
     scanSound.play();
     await new Promise(resolve=>setTimeout(resolve,300));
     scanSound.pause();
     scanSound.seekTo(0);
     scanSound.volume=1;
   }catch{}

   setScan(true);
 };

 const returnHome=()=>{
   if(reconnectTimer.current){clearTimeout(reconnectTimer.current);reconnectTimer.current=null;}
   ws.current?.close();
   ws.current=null;
   setState(null);
   setTask(null);
   setScan(false);
   setRoleIntro(false);
   setReportMode(false);
   setImpostorMode(false);
   setJustDied(false);
   setScreen('home');
   roleSeen.current=false;
   lastWin.current=null;
   lastResult.current=null;
   pending.current=null;
   session.current={action:null,room:null,name:''};
 };

 const qr=data=>{
   if(!data?.startsWith('AUR2:'))return;

   // Un QR joueur utilisé par un imposteur déclenche uniquement le couteau.
   // Les autres QR conservent le bip de scan.
   const isPlayerQr=data.startsWith('AUR2:PLAYER:');
   const isImpostorKill=state?.status==='playing'&&state?.self?.alive&&state?.self?.role==='imposteur'&&isPlayerQr;

   if(!isImpostorKill){
     try{scanSound.seekTo(0);scanSound.play();}catch{}
   }

   // Première identification : QR personnel.
   // Format retenu pour cette première version : AUR2:PLAYER:P001
   if(data.startsWith('AUR2:PLAYER:')){
     const qrId=data.slice('AUR2:PLAYER:'.length).trim();

     if(!qrId)
       return Alert.alert('QR invalide','Ce QR personnel est vide.');

     // En partie, un imposteur vivant peut utiliser le même scanner
     // pour éliminer le joueur dont le QR personnel vient d'être scanné.
     if(state?.status==='playing'&&state?.self?.alive){
       setScan(false);

       if(state.self.role==='imposteur'){
         send({
           type:'KILL_QR',
           qr:qrId
         });
         setKillFlash(true);
         setTimeout(()=>setKillFlash(false),1200);
         try{
           deathSound.seekTo(0);
           deathSound.play();
         }catch{}
       }else{
         Alert.alert(
           'QR joueur',
           'Ce QR appartient à un joueur. Seul un imposteur peut l’utiliser pour éliminer.'
         );
       }

       return;
     }

     // Hors partie : ce QR sert à enregistrer l'identité du téléphone.
     setPlayerQr(qrId);
     setScan(false);
     return;
   }

   // QR BOMBE : AUR2:BOMB:001
   // Seul l'imposteur vivant peut l'activer.
   if(data.startsWith('AUR2:BOMB:')){
     setScan(false);

     if(state?.status!=='playing'||!state?.self?.alive){
       return Alert.alert('Bombe','La bombe ne peut pas être utilisée maintenant.');
     }

     if(state.self.role==='imposteur'){
       if(state.bomb?.active){
         return Alert.alert('Bombe','La bombe est déjà activée.');
       }

       send({type:'BOMB_ACTIVATE',qr:data.slice('AUR2:BOMB:'.length).trim()});
       return;
     }

     // Un Crewmate peut scanner la bombe active pour la désactiver.
     if(state.self.role==='crewmate'){
       if(!state.bomb?.active){
         return Alert.alert('Bombe','Aucune bombe active.');
       }

       send({type:'BOMB_DEFUSE',qr:data.slice('AUR2:BOMB:'.length).trim()});
       return;
     }

     return;
   }

   const a=data.split(':');
   const kind=a[1];
   const n=+a[2];

   if(kind==='HQ_COMPLETE'){
     if(state?.self?.pendingHQ==null)
       return Alert.alert('QR meneur','Aucune épreuve QG en attente.');

     send({
       type:'VALIDATE_HQ',
       task:state.self.pendingHQ
     });

     setScan(false);
     return;
   }

   if(
     n<1||
     n>30||
     !state?.self?.tasks?.includes(n)||
     state.self.done.includes(n)
   ){
     return Alert.alert(
       'QR non assigné',
       'Ce QR n’est pas une tâche disponible pour toi.'
     );
   }

   setScan(false);

   if(kind==='PHONE')
     setTask(n);
   else{
     send({
       type:'START_HQ',
       task:n
     });

     Alert.alert(
       'Rendez-vous au QG',
       HQ[n-16]||'Épreuve QG'
     );
   }
 };
const finishMini=()=>{
   send({type:'FINISH_MINI',task});
   setTask(null);
 };

 const shuffle=a=>[...a].sort(()=>Math.random()-0.5);
 const roman=n=>['I','II','III','IV','V','VI','VII','VIII','IX','X'][n-1]||String(n);

 useEffect(()=>{
   if(task!==1)return;
   const symbols=['🍎','🚀','⭐','🐱','🎲','⚽','🍕','🌈','🎯','🐸','🎸','🔥'];
   const shuffled=shuffle(symbols), target=shuffled.slice(0,4), choices=shuffle([...target,...shuffled.slice(4,8)]);
   setMemoryTarget(target); setMemoryChoices(choices.map(v=>({value:v,selected:false}))); setMemoryPhase('show');
   const timer=setTimeout(()=>setMemoryPhase('choose'),2000);
   return()=>clearTimeout(timer);
 },[task]);

 useEffect(()=>{
   if(task!==2)return;
   setReactionRound(0); setReactionPhase('ready'); setReactionStart(0);
 },[task]);

 useEffect(()=>{
   if(task!==2)return;
   setReactionPhase('ready'); setReactionStart(0);
   const delay=1000+Math.random()*2000;
   const timer=setTimeout(()=>{setReactionStart(Date.now());setReactionPhase('go');},delay);
   return()=>clearTimeout(timer);
 },[task,reactionRound]);

 useEffect(()=>{
   if(task!==3)return;

   const ops=['+','-','×','÷'];
   let a,b,c,op1,op2,answer;

   for(let attempt=0;attempt<100;attempt++){
     a=Math.floor(Math.random()*12)+4;
     b=Math.floor(Math.random()*9)+2;
     c=Math.floor(Math.random()*9)+2;
     op1=ops[Math.floor(Math.random()*4)];
     op2=ops[Math.floor(Math.random()*4)];

     // Division entière uniquement.
     if(op2==='÷') b=c*(Math.floor(Math.random()*4)+2);
     if(op1==='÷') a=b*(Math.floor(Math.random()*5)+2);

     // Priorité mathématique normale : × et ÷ avant + et -.
     const prec=op=> (op==='×'||op==='÷') ? 2 : 1;
     const apply=(x,op,y)=> op==='+'?x+y:op==='-'?x-y:op==='×'?x*y:x/y;
     if(prec(op1) >= prec(op2)){
       const first=apply(a,op1,b);
       answer=apply(first,op2,c);
     }else{
       const right=apply(b,op2,c);
       answer=apply(a,op1,right);
     }

     if(Number.isInteger(answer) && answer>=0) break;
   }

   // Cas de secours garanti entier.
   if(!Number.isInteger(answer)){
     a=12;b=7;c=3;op1='+';op2='×';answer=33;
   }

   setCalcAnswer(answer);
   setCalcQuestion(`${a} ${op1} ${b} ${op2} ${c} = ?`);
   setCalcChoices(shuffle([answer,answer+1,answer-1,answer+3]));
 },[task]);

 useEffect(()=>{
   if(task!==4)return;
   const colors=['🔴','🟢','🔵','🟡'], sequence=Array.from({length:5},()=>colors[Math.floor(Math.random()*colors.length)]);
   setColorSequence(sequence); setColorChoices(colors); setColorIndex(-1);
   const timer=setTimeout(()=>setColorIndex(0),5000);
   return()=>clearTimeout(timer);
 },[task]);

 useEffect(()=>{
   if(task!==5)return;
   const count=Math.floor(Math.random()*3)+3;
   const normals=['🔵','🟢','🟡','🟣','🟠','⚪','🩷'];
   const normalCount=12-count;
   const symbols=shuffle([
     ...Array.from({length:normalCount},(_,i)=>normals[i%normals.length]),
     ...Array(count).fill('🔴')
   ]);
   setIntruderCount(count);setIntruderSymbols(symbols);setIntruderChoices([1,2,3,4,5]);setIntruderPhase('show');
   const timer=setTimeout(()=>setIntruderPhase('choose'),1000);
   return()=>clearTimeout(timer);
 },[task]);

 useEffect(()=>{
   if(task!==6)return;
   const code=String(Math.floor(100000+Math.random()*900000));
   setSecretCode(code);setSecretInput('');setSecretPhase('show');
   const timer=setTimeout(()=>setSecretPhase('input'),2000);
   return()=>clearTimeout(timer);
 },[task]);

 useEffect(()=>{
   if(task!==7)return;
   setTargetHits(0);
   setTargetColor(Math.random()<0.5?'red':'blue');
   setTargetPosition({top:120+Math.random()*350,left:20+Math.random()*250});
   setTargetVisible(true);
 },[task]);
 useEffect(()=>{
   if(task!==7)return;
   if(targetVisible){
     const timer=setTimeout(()=>setTargetVisible(false),1000);
     return()=>clearTimeout(timer);
   }
   const timer=setTimeout(()=>{
     setTargetColor(Math.random()<0.5?'red':'blue');
     setTargetPosition({top:120+Math.random()*350,left:20+Math.random()*250});
     setTargetVisible(true);
   },250);
   return()=>clearTimeout(timer);
 },[task,targetVisible]);

 useEffect(()=>{
   if(task!==8)return;
   const nums=shuffle([1,2,3,4,5,6,7,8,9,10]).slice(0,5); setOrderNumbers(nums);setOrderNext(1);
 },[task]);

 useEffect(()=>{
   if(task!==9)return;
   setEvenNumber(Math.floor(Math.random()*20)+1);
   setEvenRound(0);
   setEvenVisible(true);
 },[task]);

 useEffect(()=>{
   if(task!==9 || evenRound===0)return;
   setEvenNumber(Math.floor(Math.random()*20)+1);
   setEvenVisible(true);
 },[task,evenRound]);

 useEffect(()=>{
   if(task!==9)return;
   setEvenVisible(true);
   const timer=setTimeout(()=>{
     setEvenVisible(false);
     Alert.alert('Perdu','Chiffre non répondu à temps. Il faut rescanner le QR code pour rejouer.',[{text:'OK',onPress:()=>setTask(null)}]);
   },2000);
   return()=>clearTimeout(timer);
 },[task,evenRound]);

 useEffect(()=>{
   if(task!==10)return;
   const symbols=['⭐','🌟','✨','⚡','☀️','🌙','🔺','🔻','🔷','🔶','🔹','🔸','🍀','🌿','🍃','💎','🟦','🟩','🟪','🟥'];
   const target=symbols[Math.floor(Math.random()*symbols.length)];
   setSymbolTarget(target);setSymbolChoices(shuffle(symbols));setSymbolTimeLeft(2);
   const timer=setTimeout(()=>{
     setSymbolTimeLeft(0);
     Alert.alert('Temps écoulé','2 secondes sont passées. Retour à 0/5.');
     setSymbolRound(0);
   },2000);
   return()=>clearTimeout(timer);
 },[task,symbolRound]);

 useEffect(()=>{
   if(task!==11)return;
   const words=[['CH_ _SE','CHAISE'],['V_ _TURE','VOITURE'],['M_ _SON','MAISON'],['ÉC_ _E','ÉCOLE'],['P_ _TE','PIRATE'],['GÂ_ _AU','GÂTEAU'],['B_ _LON','BALLON'],['J_ _DIN','JARDIN'],['M_ _TAGNE','MONTAGNE'],['C_ _UR','COEUR']];
   const [mask,answer]=words[Math.floor(Math.random()*words.length)]; setMissingWord(mask);setMissingAnswer(answer);
 },[task]);

 useEffect(()=>{
   if(task!==12)return;
   const positions=shuffle([...Array(12).keys()]);setBombPositions(positions.slice(0,5));setBombScore(0);setBombChoices(Array(12).fill(false));
 },[task]);

 useEffect(()=>{
   if(task!==13)return;
   setCountdown(10);setCountdownRunning(false);setCountdownDisplay(true);setCountdownStart(0);
 },[task]);
 useEffect(()=>{
   if(!countdownRunning)return;
   if(countdown<=1){
     const timer=setTimeout(()=>{setCountdownRunning(false);setCountdown(10);setCountdownDisplay(true);},1000);
     return()=>clearTimeout(timer);
   }
   const timer=setTimeout(()=>{const next=countdown-1;setCountdown(next);setCountdownDisplay(next>=8);},1000);
   return()=>clearTimeout(timer);
 },[countdownRunning,countdown]);

 useEffect(()=>{
   if(task!==14)return;
   // Chaque nouvelle ouverture de QR14 commence toujours à 0,
   // y compris après une partie précédente ou un échec.
   setSymbolRound14(0);
 },[task]);

 useEffect(()=>{
   if(task!==14)return;
   const pool=['🔴','🟠','🟡','🟢','🔵','🟣','🟥','🟧','🟨','🟩','🟦','🟪','⭐','🌟','✨','⚡','☀️','🌙','🔺','🔻','🔷','🔶','💎','🍀'];
   const target=pool[Math.floor(Math.random()*pool.length)];
   setTargetSymbol14(target);
   setChoices14(shuffle(pool));
   setSymbol14Phase('show');
   const timer=setTimeout(()=>setSymbol14Phase('grid'),500);
   return()=>clearTimeout(timer);
 },[task,symbolRound14]);

 useEffect(()=>{
   if(task!==14 || symbol14Phase!=='grid')return;
   const timer=setTimeout(()=>{
     Alert.alert('Perdu','Temps dépassé. Il faut rescanner le QR code pour rejouer.',[{text:'OK',onPress:()=>setTask(null)}]);
   },2000);
   return()=>clearTimeout(timer);
 },[task,symbolRound14,symbol14Phase]);

 useEffect(()=>{
   if(task!==15)return;
   const symbols=['🔴','🟢','🔵','🟡','🟣','🟠'];const sequence=Array.from({length:5},()=>symbols[Math.floor(Math.random()*symbols.length)]);
   setFinalSequence(sequence);setFinalChoices(symbols);setFinalIndex(-1);
 },[task]);

 if(scan)
   return(
     <>
       <StatusBar style="light"/>
       <SafeAreaView style={s.scanScreen}>
         <CameraView
           style={s.camera}
           facing="back"
           barcodeScannerSettings={{barcodeTypes:['qr']}}
           onBarcodeScanned={({data})=>qr(data)}
         />

         <View style={s.scanTop}>
           <Text style={s.scanTitle}>SCANNER UN QR</Text>
           <Text style={s.scanSubtitle}>Place le QR code au centre du cadre</Text>
         </View>

         <View style={s.scanFrame}>
           <View style={[s.scanCorner,s.scanCornerTL]}/>
           <View style={[s.scanCorner,s.scanCornerTR]}/>
           <View style={[s.scanCorner,s.scanCornerBL]}/>
           <View style={[s.scanCorner,s.scanCornerBR]}/>
           <View style={s.scanLine}/>
         </View>

         <View style={s.scanBottom}>
           <Pressable
             style={s.scanCancelButton}
             onPress={()=>setScan(false)}
           >
             <Text style={s.scanCancelText}>ANNULER</Text>
           </Pressable>
         </View>
       </SafeAreaView>
     </>
   );


if(task===1)
  return(
    <>
      <StatusBar style="light"/>
      <SafeAreaView style={s.c}>
        <Pressable style={s.backSmall} onPress={()=>setTask(null)}>
          <Text style={s.bt}>← RETOUR</Text>
        </Pressable>
        <ScrollView contentContainerStyle={s.sc}>
          <Text style={s.big}>🧠 Mémoire éclair</Text>
          {memoryPhase==='show'?<View style={s.card}><Text style={s.sec}>Mémorise ces 4 symboles</Text><View style={{flexDirection:'row',flexWrap:'wrap',justifyContent:'center',gap:10}}>{memoryTarget.map((x,i)=><Text key={i} style={{fontSize:40,padding:8}}>{x}</Text>)}</View><Text style={s.muted}>Tu as 2 secondes.</Text></View>:
          <View style={s.card}><Text style={s.sec}>Retrouve les 4 symboles</Text><View style={{flexDirection:'row',flexWrap:'wrap',justifyContent:'center',gap:8}}>{memoryChoices.map((x,i)=><Pressable key={i} onPress={()=>setMemoryChoices(prev=>prev.map((v,j)=>j===i?{...v,selected:!v.selected}:v))} style={{width:72,height:72,borderRadius:12,backgroundColor:x.selected?'#e53b4f':'#242833',alignItems:'center',justifyContent:'center'}}><Text style={{fontSize:34}}>{x.value}</Text></Pressable>)}</View><Pressable style={s.primary} onPress={()=>{const selected=memoryChoices.filter(x=>x.selected).map(x=>x.value);const ok=selected.length===4&&selected.every(x=>memoryTarget.includes(x));if(ok){finishMini();}else{Alert.alert('Perdu','Mauvaise réponse. Il faut rescanner le QR code pour rejouer.',[{text:'OK',onPress:()=>setTask(null)}]);}}}><Text style={s.bt}>VALIDER</Text></Pressable></View>}
        </ScrollView>
      </SafeAreaView>
    </>
  );
if(task===2)
  return(
    <>
      <StatusBar style="light"/>
      <SafeAreaView style={s.c}>
        <Pressable style={s.backSmall} onPress={()=>setTask(null)}>
          <Text style={s.bt}>← RETOUR</Text>
        </Pressable>
        <ScrollView contentContainerStyle={s.sc}><Text style={s.big}>⚡ Réaction</Text><View style={s.card}><Text style={s.sec}>Progression : {reactionRound}/3</Text>{reactionPhase==='ready'?<Text style={s.sec}>PRÉPARE-TOI...</Text>:<Pressable style={s.primary} onPress={()=>{const ms=Date.now()-reactionStart;if(ms<=600){const next=reactionRound+1;setReactionRound(next);if(next>=3){setTimeout(()=>finishMini(),0);}else{setReactionPhase('ready');setReactionStart(0);}}else{Alert.alert('Trop lent !',`${ms} ms — il faut 600 ms maximum.`,[{text:'OK',onPress:()=>{setReactionRound(0);setTask(null);setTimeout(()=>setTask(2),50);}}]);}}}><Text style={s.bt}>🟢 APPUIE !</Text></Pressable>}<Text style={s.muted}>Temps maximum : 600 ms.</Text></View></ScrollView>
      </SafeAreaView>
    </>
  );
if(task===3)
  return(
    <>
      <StatusBar style="light"/>
      <SafeAreaView style={s.c}>
        <Pressable style={s.backSmall} onPress={()=>setTask(null)}>
          <Text style={s.bt}>← RETOUR</Text>
        </Pressable>
        <ScrollView contentContainerStyle={s.sc}><Text style={s.big}>🧮 Calcul express</Text><View style={s.card}><Text style={s.sec}>{calcQuestion}</Text>{calcChoices.map((choice,i)=><Pressable key={i} style={s.primary} onPress={()=>choice===calcAnswer?finishMini():Alert.alert('Perdu','Mauvaise réponse. Il faut rescanner le QR code pour rejouer.',[{text:'OK',onPress:()=>setTask(null)}])}><Text style={s.bt}>{choice}</Text></Pressable>)}</View></ScrollView>
      </SafeAreaView>
    </>
  );
if(task===4)
  return(
    <>
      <StatusBar style="light"/>
      <SafeAreaView style={s.c}>
        <Pressable style={s.backSmall} onPress={()=>setTask(null)}>
          <Text style={s.bt}>← RETOUR</Text>
        </Pressable>
        <ScrollView contentContainerStyle={s.sc}><Text style={s.big}>🌈 Suite de couleurs</Text><View style={s.card}>{colorIndex===-1?<><Text style={s.sec}>Mémorise rapidement</Text><Text style={{fontSize:42,textAlign:'center',marginVertical:25}}>{colorSequence.join(' ')}</Text><Text style={s.muted}>La suite disparaît après 5 secondes.</Text></>:<><Text style={s.sec}>Reproduis la suite</Text><Text style={s.muted}>Couleur {colorIndex+1}/{colorSequence.length}</Text>{colorChoices.map((c,i)=><Pressable key={i} style={s.primary} onPress={()=>{if(c===colorSequence[colorIndex]){if(colorIndex===colorSequence.length-1)finishMini();else setColorIndex(colorIndex+1);}else{Alert.alert('Raté','Nouvelle suite.',[{text:'OK',onPress:()=>{setTask(null);setTimeout(()=>setTask(4),50);}}]);}}}><Text style={s.bt}>{c}</Text></Pressable>)}</>}</View></ScrollView>
      </SafeAreaView>
    </>
  );
if(task===5)
  return(
    <>
      <StatusBar style="light"/>
      <SafeAreaView style={s.c}>
        <Pressable style={s.backSmall} onPress={()=>setTask(null)}>
          <Text style={s.bt}>← RETOUR</Text>
        </Pressable>
        <ScrollView contentContainerStyle={s.sc}><Text style={s.big}>👀 Compter les intrus</Text><View style={s.card}>{intruderPhase==='show'?<><Text style={s.sec}>Regarde pendant 1 seconde !</Text><View style={{flexDirection:'row',flexWrap:'wrap',justifyContent:'center'}}>{intruderSymbols.map((x,i)=><Text key={i} style={{fontSize:40,margin:8}}>{x}</Text>)}</View></>:<><Text style={s.sec}>Combien y avait-il de pastilles rouges ?</Text>{intruderChoices.map(c=><Pressable key={c} style={s.primary} onPress={()=>c===intruderCount?finishMini():Alert.alert('Raté','Mauvais nombre. Nouvelle disposition.',[{text:'OK',onPress:()=>{setTask(null);setTimeout(()=>setTask(5),50);}}])}><Text style={s.bt}>{c}</Text></Pressable>)}</>}</View></ScrollView>
      </SafeAreaView>
    </>
  );
if(task===6)
  return(
    <>
      <StatusBar style="light"/>
      <SafeAreaView style={s.c}>
        <Pressable style={s.backSmall} onPress={()=>setTask(null)}>
          <Text style={s.bt}>← RETOUR</Text>
        </Pressable>
        <ScrollView contentContainerStyle={s.sc}><Text style={s.big}>🔐 Code secret</Text><View style={s.card}>{secretPhase==='show'?<><Text style={s.sec}>Mémorise ce code pendant 2 secondes</Text><Text style={{fontSize:48,fontWeight:'900',textAlign:'center',marginVertical:30,color:'#fff'}}>{secretCode}</Text></>:<><Text style={s.sec}>Quel était le code ?</Text><TextInput style={[s.input,{fontSize:32,textAlign:'center',letterSpacing:8,color:'#fff'}]} value={secretInput} onChangeText={setSecretInput} keyboardType="number-pad" maxLength={6} autoFocus/><Pressable style={s.primary} onPress={()=>secretInput===secretCode?finishMini():Alert.alert('Raté','Code incorrect. Recommence.') }><Text style={s.bt}>VALIDER</Text></Pressable></>}</View></ScrollView>
      </SafeAreaView>
    </>
  );
if(task===7)
  return(
    <>
      <StatusBar style="light"/>
      <SafeAreaView style={s.c}>
        <Pressable style={s.backSmall} onPress={()=>setTask(null)}>
          <Text style={s.bt}>← RETOUR</Text>
        </Pressable>
        <View style={{flex:1}}><Text style={[s.big,{margin:20}]}>🎯 Cibles rouges</Text><Text style={[s.muted,{textAlign:'center'}]}>Touche 5 cibles rouges. Chaque cible reste 1 seconde. Une autre couleur = perdu.</Text>{targetVisible&&<Pressable onPress={()=>{if(targetColor!=='red'){Alert.alert('Perdu','Mauvaise couleur. Il faut rescanner le QR code pour rejouer.',[{text:'OK',onPress:()=>setTask(null)}]);return;}const hits=targetHits+1;setTargetHits(hits);setTargetVisible(false);if(hits>=5){setTimeout(()=>finishMini(),0);}}} style={{position:'absolute',top:targetPosition.top,left:targetPosition.left,width:70,height:70,borderRadius:35,backgroundColor:targetColor==='red'?'#e53b4f':'#3b82f6',alignItems:'center',justifyContent:'center'}}><Text style={{fontSize:32}}>🎯</Text></Pressable>}<Text style={{position:'absolute',bottom:40,alignSelf:'center',color:'#fff',fontSize:18,fontWeight:'800'}}>{targetHits}/5</Text></View>
      </SafeAreaView>
    </>
  );
if(task===8)
  return(
    <>
      <StatusBar style="light"/>
      <SafeAreaView style={s.c}>
        <Pressable style={s.backSmall} onPress={()=>setTask(null)}>
          <Text style={s.bt}>← RETOUR</Text>
        </Pressable>
        <ScrollView contentContainerStyle={s.sc}><Text style={s.big}>🔢 Ordre croissant</Text><Text style={s.muted}>Appuie sur les chiffres romains dans l'ordre croissant.</Text><View style={{flexDirection:'row',flexWrap:'wrap',justifyContent:'center'}}>{orderNumbers.map((n,i)=><Pressable key={i} style={{width:80,height:80,margin:8,borderRadius:15,backgroundColor:'#242833',alignItems:'center',justifyContent:'center'}} onPress={()=>{const sorted=[...orderNumbers].sort((a,b)=>a-b);const expected=sorted[orderNext-1];if(n===expected){if(orderNext===5){setOrderNext(6);finishMini();}else setOrderNext(orderNext+1);}else{Alert.alert('Raté','Mauvais ordre. Nouvelle série.',[{text:'OK',onPress:()=>{setTask(null);setTimeout(()=>setTask(8),50);}}]);}}}><Text style={{color:'#fff',fontSize:25,fontWeight:'900'}}>{roman(n)}</Text></Pressable>)}</View><Text style={s.muted}>Prochain : {roman(orderNext)}</Text></ScrollView>
      </SafeAreaView>
    </>
  );
if(task===9)
  return(
    <>
      <StatusBar style="light"/>
      <SafeAreaView style={s.c}>
        <Pressable style={s.backSmall} onPress={()=>setTask(null)}>
          <Text style={s.bt}>← RETOUR</Text>
        </Pressable>
        <ScrollView contentContainerStyle={s.sc}><Text style={s.big}>🔵 Pair ou impair</Text><View style={s.card}><Text style={s.sec}>Manche {evenRound+1}/5</Text><Text style={{fontSize:80,fontWeight:'900',textAlign:'center',marginVertical:20,color:'#fff'}}>{evenVisible?evenNumber:'?'}</Text><Text style={s.muted}>Chaque chiffre reste 2 secondes.</Text><Pressable style={s.primary} onPress={()=>{if(!evenVisible)return;const ok=evenNumber%2===0;if(ok){const r=evenRound+1;if(r>=5){setEvenRound(r);finishMini();}else setEvenRound(r);}else{Alert.alert('Perdu','Mauvaise réponse. Il faut rescanner le QR code pour rejouer.',[{text:'OK',onPress:()=>setTask(null)}]);}}}><Text style={s.bt}>PAIR</Text></Pressable><Pressable style={s.primary} onPress={()=>{if(!evenVisible)return;const ok=evenNumber%2!==0;if(ok){const r=evenRound+1;if(r>=5){setEvenRound(r);finishMini();}else setEvenRound(r);}else{Alert.alert('Perdu','Mauvaise réponse. Il faut rescanner le QR code pour rejouer.',[{text:'OK',onPress:()=>setTask(null)}]);}}}><Text style={s.bt}>IMPAIR</Text></Pressable></View></ScrollView>
      </SafeAreaView>
    </>
  );
if(task===10)
  return(
    <>
      <StatusBar style="light"/>
      <SafeAreaView style={s.c}>
        <Pressable style={s.backSmall} onPress={()=>setTask(null)}>
          <Text style={s.bt}>← RETOUR</Text>
        </Pressable>
        <ScrollView contentContainerStyle={s.sc}><Text style={s.big}>🔎 Trouver le symbole</Text><View style={s.card}><Text style={s.sec}>Trouve exactement :</Text><Text style={{fontSize:55,textAlign:'center',marginVertical:12}}>{symbolTarget}</Text><Text style={s.muted}>Manche {symbolRound+1}/5 • 20 symboles • {symbolTimeLeft} s</Text><View style={{flexDirection:'row',flexWrap:'wrap',justifyContent:'center'}}>{symbolChoices.map((sym,i)=><Pressable key={i} style={{width:62,height:62,margin:4,borderRadius:10,backgroundColor:'#242833',alignItems:'center',justifyContent:'center'}} onPress={()=>{if(sym===symbolTarget){const r=symbolRound+1;setSymbolRound(r);if(r>=5){setTimeout(()=>finishMini(),0);}}else{Alert.alert('Raté','Mauvais symbole. Retour à 0/5.');setSymbolRound(0);}}}><Text style={{fontSize:30}}>{sym}</Text></Pressable>)}</View></View></ScrollView>
      </SafeAreaView>
    </>
  );
if(task===11)
  return(
    <>
      <StatusBar style="light"/>
      <SafeAreaView style={s.c}>
        <Pressable style={s.backSmall} onPress={()=>setTask(null)}>
          <Text style={s.bt}>← RETOUR</Text>
        </Pressable>
        <ScrollView contentContainerStyle={s.sc}><Text style={s.big}>✏️ Mot à compléter</Text><View style={s.card}><Text style={s.sec}>Complète le mot :</Text><Text style={{fontSize:34,fontWeight:'900',textAlign:'center',marginVertical:25,color:'#fff'}}>{missingWord}</Text><TextInput style={[s.input,{fontSize:24,textAlign:'center',color:'#fff'}]} value={missingInput} onChangeText={setMissingInput} autoCapitalize="none" autoCorrect={false}/><Pressable style={s.primary} onPress={()=>{if(missingInput.trim().toLocaleUpperCase('fr-FR')===missingAnswer.toLocaleUpperCase('fr-FR')){finishMini();}else{Alert.alert('Raté','Un autre mot apparaît.');setTask(null);setTimeout(()=>setTask(11),50);setMissingInput('');}}}><Text style={s.bt}>VALIDER</Text></Pressable></View></ScrollView>
      </SafeAreaView>
    </>
  );
if(task===12)
  return(
    <>
      <StatusBar style="light"/>
      <SafeAreaView style={s.c}>
        <Pressable style={s.backSmall} onPress={()=>setTask(null)}>
          <Text style={s.bt}>← RETOUR</Text>
        </Pressable>
        <ScrollView contentContainerStyle={s.sc}><Text style={s.big}>🟣 Pastilles piégées</Text><View style={s.card}><Text style={s.sec}>Trouve 5 pastilles sûres d'affilée</Text><Text style={s.muted}>{bombScore}/5</Text><View style={{flexDirection:'row',flexWrap:'wrap',justifyContent:'center'}}>{bombChoices.map((value,i)=><Pressable key={i} style={{width:65,height:65,margin:6,borderRadius:33,backgroundColor:'#6b7280',alignItems:'center',justifyContent:'center'}} onPress={()=>{if(bombPositions.includes(i)){Alert.alert('💣 BOUM !','Série remise à 0. Recommence en mémorisant les pastilles sûres.');setBombScore(0);setBombChoices(Array(12).fill(false));}else{const next=bombScore+1;if(next>=5)finishMini();else{setBombScore(next);setBombChoices(prev=>prev.map((v,j)=>j===i?true:v));}}}}><Text style={{fontSize:26}}>{value===true?'✓':'●'}</Text></Pressable>)}</View></View></ScrollView>
      </SafeAreaView>
    </>
  );
if(task===13)
  return(
    <>
      <StatusBar style="light"/>
      <SafeAreaView style={s.c}>
        <Pressable style={s.backSmall} onPress={()=>setTask(null)}>
          <Text style={s.bt}>← RETOUR</Text>
        </Pressable>
        <ScrollView contentContainerStyle={s.sc}><Text style={s.big}>⏳ Compte à rebours</Text><View style={s.card}><Text style={{fontSize:80,fontWeight:'900',textAlign:'center',marginVertical:20,color:'#fff'}}>{countdownDisplay?countdown:'?'}</Text>{!countdownRunning?<Pressable style={s.primary} onPress={()=>{setCountdown(10);setCountdownDisplay(true);setCountdownStart(Date.now());setCountdownRunning(true);}}><Text style={s.bt}>DÉMARRER</Text></Pressable>:<><Text style={s.muted}>Appuie exactement quand le compteur atteint 1.</Text><Pressable style={s.primary} onPress={()=>{const remaining=countdown;if(countdown===1){Alert.alert('Bravo !',`Temps restant : ${remaining} seconde`);finishMini();}else{Alert.alert('Trop tôt !',`Temps restant : ${remaining} secondes`);setCountdownRunning(false);setCountdown(10);setCountdownDisplay(true);}}}><Text style={s.bt}>STOP</Text></Pressable></>}</View></ScrollView>
      </SafeAreaView>
    </>
  );
if(task===14)
  return(
    <>
      <StatusBar style="light"/>
      <SafeAreaView style={s.c}>
        <Pressable style={s.backSmall} onPress={()=>setTask(null)}>
          <Text style={s.bt}>← RETOUR</Text>
        </Pressable>
        <ScrollView contentContainerStyle={s.sc}><Text style={s.big}>🎯 Attrape le bon symbole</Text><View style={s.card}>{symbol14Phase==='show'?<><Text style={s.sec}>Mémorise ce symbole :</Text><Text style={{fontSize:60,textAlign:'center',marginVertical:20}}>{targetSymbol14}</Text><Text style={s.muted}>Il va disparaître...</Text></>:<><Text style={s.sec}>Trouve le symbole mémorisé</Text><Text style={s.muted}>Manche {symbolRound14+1}/5 • 24 symboles</Text><View style={{flexDirection:'row',flexWrap:'wrap',justifyContent:'center'}}>{choices14.map((sym,i)=><Pressable key={i} style={{width:58,height:58,margin:3,borderRadius:10,backgroundColor:'#242833',alignItems:'center',justifyContent:'center'}} onPress={()=>{if(sym===targetSymbol14){const r=symbolRound14+1;setSymbolRound14(r);if(r>=5){setTimeout(()=>finishMini(),0);}}else{Alert.alert('Perdu','Mauvais symbole. Il faut rescanner le QR code pour rejouer.',[{text:'OK',onPress:()=>setTask(null)}]);}}}><Text style={{fontSize:26}}>{sym}</Text></Pressable>)}</View></>}</View></ScrollView>
      </SafeAreaView>
    </>
  );
if(task===15)
  return(
    <>
      <StatusBar style="light"/>
      <SafeAreaView style={s.c}>
        <Pressable style={s.backSmall} onPress={()=>setTask(null)}>
          <Text style={s.bt}>← RETOUR</Text>
        </Pressable>
        <ScrollView contentContainerStyle={s.sc}><Text style={s.big}>🎯 Séquence finale</Text><View style={s.card}>{finalIndex===-1?<><Text style={s.sec}>Mémorise la séquence !</Text><Text style={{fontSize:42,textAlign:'center',marginVertical:25}}>{finalSequence.join(' ')}</Text><Pressable style={s.primary} onPress={()=>setFinalIndex(0)}><Text style={s.bt}>J'ai mémorisé</Text></Pressable></>:<><Text style={s.sec}>Symbole {finalIndex+1}/5</Text>{finalChoices.map((symbol,i)=><Pressable key={i} style={s.primary} onPress={()=>{if(symbol===finalSequence[finalIndex]){if(finalIndex===4)finishMini();else setFinalIndex(finalIndex+1);}else{Alert.alert('Raté','Nouvelle séquence.');setTask(null);setTimeout(()=>setTask(15),50);}}}><Text style={s.bt}>{symbol}</Text></Pressable>)}</>}</View></ScrollView>
      </SafeAreaView>
    </>
  );
if(!identityLoaded)
   return(
     <>
       <StatusBar style="light"/>
       <SafeAreaView style={s.c}>
         <Text style={s.notice}>Chargement du joueur…</Text>
       </SafeAreaView>
     </>
   );

 if(!identityValidated)
   return(
     <>
       <StatusBar style="light"/>
       <SafeAreaView style={s.c}>
         <ScrollView contentContainerStyle={s.sc}>
           <Text style={s.identityIcon}>👨‍🚀</Text>
           <Text style={s.identityTitle}>AMONG US IRL</Text>
           <Text style={s.identitySubtitle}>IDENTIFICATION DU JOUEUR</Text>

           <View style={s.identityStep}>
             <View style={s.identityStepHeader}>
               <View style={s.identityStepNumber}><Text style={s.identityStepNumberText}>1</Text></View>
               <View style={s.identityStepTextBox}>
                 <Text style={s.identityStepTitle}>SCANNE TON QR PERSONNEL</Text>
                 <Text style={s.identityStepHint}>Il permet d’identifier ton joueur.</Text>
               </View>
             </View>

             <Pressable
               style={s.identityScanButton}
               onPress={openScan}
             >
               <Text style={s.identityScanText}>📷  SCANNER MON QR</Text>
             </Pressable>

             {playerQr?
               <View style={s.identityDetected}>
                 <Text style={s.identityDetectedLabel}>✓ QR PERSONNEL DÉTECTÉ</Text>
                 <Text style={s.identityDetectedValue}>{playerQr}</Text>
               </View>
             :
               <Text style={s.identityNote}>
                 Utilise uniquement ton QR personnel.
               </Text>
             }
           </View>

           <View style={s.identityStep}>
             <View style={s.identityStepHeader}>
               <View style={s.identityStepNumber}><Text style={s.identityStepNumberText}>2</Text></View>
               <View style={s.identityStepTextBox}>
                 <Text style={s.identityStepTitle}>ENTRE TON NOM</Text>
                 <Text style={s.identityStepHint}>Ce nom sera affiché aux autres joueurs.</Text>
               </View>
             </View>

             <TextInput
               style={s.identityInput}
               value={name}
               onChangeText={setName}
               placeholder="Ex. Thomas"
               placeholderTextColor="#777"
             />

             <Pressable
               style={s.identityValidateButton}
               onPress={validateIdentity}
             >
               <Text style={s.identityValidateText}>VALIDER LE JOUEUR</Text>
             </Pressable>
           </View>

           <Pressable
             style={s.secondary}
             onPress={()=>
               Alert.alert(
                 'Changer de joueur',
                 'Cette action effacera le joueur mémorisé sur ce téléphone.',
                 [
                   {text:'ANNULER',style:'cancel'},
                   {text:'CONTINUER',style:'destructive',onPress:changePlayer}
                 ]
               )
             }
           >
             <Text style={s.bt}>CHANGER DE JOUEUR</Text>
           </Pressable>

           {message?<Text style={s.notice}>{message}</Text>:null}
         </ScrollView>
       </SafeAreaView>
     </>
   );

 if(screen==='home')
   return(
     <>
       <StatusBar style="light"/>
       <SafeAreaView style={s.c}>
         <ScrollView contentContainerStyle={s.sc}>
           <Text style={s.homeIcon}>🚀</Text>
           <Text style={s.homeTitle}>AMONG US IRL</Text>
           <Text style={s.homeSubtitle}>CENTRE DE CONTRÔLE</Text>

           <View style={s.homePlayerCard}>
             <View style={s.homePlayerAvatar}>
               <Text style={s.homePlayerAvatarText}>👨‍🚀</Text>
             </View>
             <View style={s.homePlayerInfo}>
               <Text style={s.homePlayerLabel}>JOUEUR CONNECTÉ</Text>
               <Text style={s.homePlayerName}>{name}</Text>
             </View>
             <View style={s.homeReadyBadge}>
               <Text style={s.homeReadyText}>PRÊT</Text>
             </View>
           </View>

           <View style={s.homeSection}>
             <View style={s.homeSectionHeader}>
               <Text style={s.homeSectionTitle}>⚙️  SERVEUR</Text>
               <Text style={s.homeSectionHint}>RÉSEAU LOCAL</Text>
             </View>

             <TextInput
               style={s.homeInput}
               value={server}
               onChangeText={setServer}
               autoCapitalize="none"
               autoCorrect={false}
             />

             <Text style={s.homeHint}>
               Le serveur doit être lancé sur le PC avec node server.js.
             </Text>
           </View>

           <View style={s.homeSection}>
             <View style={s.homeSectionHeader}>
               <Text style={s.homeSectionTitle}>🚀  CRÉER UNE PARTIE</Text>
               <Text style={s.homeSectionHint}>HÔTE</Text>
             </View>

             <View style={s.homeConfigRow}>
               <View style={s.homeConfigBox}>
                 <Text style={s.homeConfigValue}>{count}</Text>
                 <Text style={s.homeConfigLabel}>JOUEURS</Text>
               </View>
               <View style={s.homeConfigBox}>
                 <Text style={s.homeConfigValue}>{imp}</Text>
                 <Text style={s.homeConfigLabel}>IMPOSTEURS</Text>
               </View>
               <View style={s.homeConfigBox}>
                 <Text style={s.homeConfigValue}>{tc}</Text>
                 <Text style={s.homeConfigLabel}>TÂCHES</Text>
               </View>
             </View>

             <Text style={s.homeFieldLabel}>Nombre de joueurs</Text>
             <TextInput style={s.homeInput} value={count} onChangeText={setCount} keyboardType="number-pad"/>

             <Text style={s.homeFieldLabel}>Nombre d’imposteurs</Text>
             <TextInput style={s.homeInput} value={imp} onChangeText={setImp} keyboardType="number-pad"/>

             <Text style={s.homeFieldLabel}>Tâches par crewmate</Text>
             <TextInput style={s.homeInput} value={tc} onChangeText={setTc} keyboardType="number-pad"/>

             <Pressable style={s.homeCreateButton} onPress={()=>connect('create')}>
               <Text style={s.homeCreateText}>{connecting?'CONNEXION…':'🚀  CRÉER LA PARTIE'}</Text>
             </Pressable>
           </View>

           <View style={s.homeSection}>
             <View style={s.homeSectionHeader}>
               <Text style={s.homeSectionTitle}>🎮  REJOINDRE UNE PARTIE</Text>
               <Text style={s.homeSectionHint}>JOUEUR</Text>
             </View>

             <TextInput
               style={s.homeCodeInput}
               value={code}
               onChangeText={v=>setCode(v.toUpperCase())}
               placeholder="CODE DE PARTIE"
               placeholderTextColor="#666d7c"
               autoCapitalize="characters"
             />

             <Pressable style={s.homeJoinButton} onPress={()=>connect('join')}>
               <Text style={s.homeJoinText}>REJOINDRE LA PARTIE</Text>
             </Pressable>
           </View>

           <Pressable
             style={s.secondary}
             onPress={()=>
               Alert.alert(
                 'Changer de joueur',
                 'Cette action effacera le joueur mémorisé sur ce téléphone.',
                 [
                   {text:'ANNULER',style:'cancel'},
                   {
                     text:'CONTINUER',
                     style:'destructive',
                     onPress:changePlayer
                   }
                 ]
               )
             }
           >
             <Text style={s.bt}>CHANGER DE JOUEUR</Text>
           </Pressable>

           {message?<Text style={s.notice}>{message}</Text>:null}
         </ScrollView>
       </SafeAreaView>
     </>
   );

 if(!state)
   return(
     <SafeAreaView style={s.c}>
       <Text style={s.notice}>Connexion…</Text>
     </SafeAreaView>
   );

 if(state.status==='lobby')
   return(
     <>
       <StatusBar style="light"/>
       <SafeAreaView style={s.c}>
         <ScrollView contentContainerStyle={s.sc}>
           <Text style={s.sm}>SALLE D’ATTENTE</Text>

           <Text style={s.code}>{state.room}</Text>

           <Text style={s.center}>
             {state.players.length}/{state.config.count} joueurs • {state.config.impostors} imposteur(s) • {state.config.tasksPerCrewmate} tâche(s)
           </Text>

           <View style={s.card}>
             {state.players.map(p=>
               <View style={s.row} key={p.id}>
                 <Text style={s.player}>{p.name}</Text>
                 {p.host&&<Text style={s.you}>HÔTE</Text>}
               </View>
             )}
           </View>

           {state.self?.id===state.hostId?
             <Pressable
               style={s.primary}
               onPress={()=>{
                 if(state.players.length<2)
                   return Alert.alert(
                     'Test',
                     'Il faut au moins 2 joueurs pour ce test.'
                   );

                 send({type:'START'});
               }}
             >
               <Text style={s.bt}>LANCER LA PARTIE</Text>
             </Pressable>
           :
             <Text style={s.center}>
               Attends que l’hôte lance la partie.
             </Text>
           }

           <Pressable
             onPress={returnHome}
             style={{alignItems:'center',marginTop:26,paddingVertical:8}}
           >
             <Text style={s.secondaryText}>Retour</Text>
           </Pressable>
         </ScrollView>
       </SafeAreaView>
     </>
   );

 const me=state.self;
 const alive=state.players.filter(p=>p.alive);
 const near=alive.filter(p=>p.id!==me.id);

 if(!me)return null;

 if(roleIntro&&state.status==='playing'&&me.alive)
   return(
     <>
       <StatusBar style="light"/>
       <SafeAreaView style={s.dead}>
         <Text style={s.roleIcon}>
           {me.role==='imposteur'?'🔴':'🔵'}
         </Text>

         <Text style={s.roleTitle}>
           {me.role==='imposteur'
             ?'TU ES IMPOSTEUR'
             :'TU ES CREWMATE'}
         </Text>

         <Text style={s.roleHint}>
           Mémorise ton rôle, puis appuie sur OK.
         </Text>

         <Pressable
           style={s.primary}
           onPress={()=>setRoleIntro(false)}
         >
           <Text style={s.bt}>OK</Text>
         </Pressable>
       </SafeAreaView>
     </>
   );

 if(state.status==='ended')
   return(
     <>
       <StatusBar style="light"/>
       <SafeAreaView style={s.dead}>
         <Text style={s.skull}>
           {state.win==='crewmates'?'🎉':'☠️'}
         </Text>
         <Text style={s.deadT}>
           {state.win==='crewmates'
             ?'CREWMATES GAGNENT'
             :'IMPOSTEURS GAGNENT'}
         </Text>
         <Text style={s.deadTxt}>
           La partie {state.room} est terminée.
         </Text>

         <Pressable
           style={s.primary}
           onPress={returnHome}
         >
           <Text style={s.bt}>← RETOUR À L'ACCUEIL</Text>
         </Pressable>
       </SafeAreaView>
     </>
   );

 if(state.meeting?.active&&me.alive)
   return(
     <>
       <StatusBar style="light"/>
       <SafeAreaView style={s.c}>
         <ScrollView contentContainerStyle={s.sc}>
           <Text style={s.meetingIcon}>🚨</Text>
           <Text style={s.meetingTitle}>RÉUNION D’URGENCE</Text>
           <Text style={s.meetingSubtitle}>
             Signalée par {state.meeting.reportedBy}
           </Text>
           <Text style={s.meetingHint}>Qui doit être éliminé ?</Text>

           <View style={s.card}>
             {alive.filter(p=>p.id!==me.id).map(p=>
               <Pressable
                 style={s.voteCard}
                 key={p.id}
                 onPress={()=>
                    Alert.alert(
                      'Confirmer ton vote ?',
                      `Éliminer ${p.name} ?`,
                      [
                        {text:'NON',style:'cancel'},
                        {text:'OUI',onPress:()=>send({type:'VOTE',target:p.id})}
                      ]
                    )
                  }
               >
                 <View style={s.voteAvatar}>
                   <Text style={s.voteAvatarText}>👤</Text>
                 </View>
                 <View style={s.voteInfo}>
                   <Text style={s.voteName}>{p.name}</Text>
                   <Text style={s.voteAction}>
                     {state.meeting.voted?'VOTE ENVOYÉ':'VOTER POUR CE JOUEUR'}
                   </Text>
                 </View>
                 <Text style={s.voteArrow}>›</Text>
               </Pressable>
             )}

             <Pressable
               style={s.secondary}
               onPress={()=>
                  Alert.alert(
                    'Voter BLANC ?',
                    'Confirmer ton vote blanc ?',
                    [
                      {text:'NON',style:'cancel'},
                      {text:'OUI',onPress:()=>send({type:'SKIP_VOTE'})}
                    ]
                  )
                }
             >
               <Text style={s.whiteVoteText}>○  VOTER BLANC</Text>
             </Pressable>
           </View>
         </ScrollView>
       </SafeAreaView>
     </>
   );

 if(justDied||!me.alive)
   return(
     <>
       <StatusBar style="light"/>
       <SafeAreaView style={s.deadScreen}>
         <View style={s.deadGlow}>
           <Text style={s.deadSkull}>💀</Text>
         </View>
         <Text style={s.deadTitle}>TU ES MORT</Text>
         <View style={s.deadDivider}/>
         <Text style={s.deadMessage}>
           Tu peux observer la partie,
         </Text>
         <Text style={s.deadMessage}>
           mais tu ne peux plus agir ni voter.
         </Text>
         <View style={s.deadObserve}>
           <Text style={s.deadObserveTitle}>👁 MODE OBSERVATEUR</Text>
           <Text style={s.deadObserveText}>
             Reste attentif à la partie jusqu’à la fin.
           </Text>
         </View>
       </SafeAreaView>
     </>
   );


 return(
   <>
     <StatusBar style="light"/>

     <SafeAreaView style={s.c}>
       <ScrollView contentContainerStyle={s.sc}>

         {killFlash&&
           <View style={{
             position:'absolute',
             top:0,
             left:0,
             right:0,
             zIndex:20,
             backgroundColor:'#7f0d1b',
             borderBottomWidth:2,
             borderBottomColor:'#ff4058',
             paddingVertical:18,
             alignItems:'center'
           }}>
             <Text style={{color:'#fff',fontSize:22,fontWeight:'900',letterSpacing:1.5}}>
               🔪 ÉLIMINATION
             </Text>
           </View>
         }

         <View style={s.gameHeader}>
           <View style={s.gameHeaderLeft}>
             <Text style={s.gameMiniIcon}>👨‍🚀</Text>
             <View>
               <Text style={s.sm}>PARTIE {state.room}</Text>
               <Text style={s.big}>{name || "Joueur"}</Text>
             </View>
           </View>
           <View style={s.liveBadge}>
             <View style={s.liveDot}/>
             <Text style={s.liveText}>EN JEU</Text>
           </View>
         </View>

         <View style={s.playerQrOnly}>
           {playerQr
             ? <Image source={PLAYER_QR_IMAGES[playerQr.replace('AUR2:PLAYER:','')]} style={s.playerQrImage}/>
             : <Text style={s.playerQrCode}>QR JOUEUR</Text>}
         </View>

         {state.bomb?.active&&
           <View style={{
             backgroundColor:'#32131a',
             borderWidth:3,
             borderColor:'#ff304f',
             borderRadius:16,
             padding:18,
             marginBottom:4,
             shadowColor:'#ff304f',
             shadowOpacity:.45,
             shadowRadius:12,
             elevation:8
           }}>
             <Text style={{
               color:'#ff596b',
               fontSize:20,
               fontWeight:'900',
               textAlign:'center',
               letterSpacing:1.2
             }}>🚨 💣 BOMBE ACTIVÉE 🚨</Text>
             <Text style={{
               color:'#fff',
               fontSize:58,
               fontWeight:'900',
               textAlign:'center',
               marginVertical:4
             }}>
               {bombSeconds}s
             </Text>
             <Text style={{
               color:'#fff',
               fontSize:14,
               fontWeight:'800',
               textAlign:'center',
               lineHeight:20
             }}>
               {me.role==='crewmate'
                 ?'TROUVE LA BOMBE ET SCANNE SON QR !'
                 :'LA BOMBE EST ACTIVE.'}
             </Text>
           </View>
         }

         <Pressable style={s.scannerButton} onPress={openScan}>
           <Text style={s.scannerButtonText}>📷 SCANNER UN QR</Text>
         </Pressable>

         <Pressable
           style={s.alert}
           onPress={()=>{ send({type:'REPORT'}); }}
         >
           <Text style={s.alertT}>🚨 RÉUNION D’URGENCE</Text>
         </Pressable>

         <View style={[s.taskSection,{marginTop:28}]}>
           <View style={s.taskHeader}>
             <View>
               <Text style={s.sec}>MES TÂCHES</Text>
               <Text style={s.taskCount}>{me.done.length}/{me.tasks.length} terminées</Text>
             </View>
             <Text style={s.taskPercent}>{me.tasks.length ? Math.round((me.done.length/me.tasks.length)*100) : 0}%</Text>
           </View>

           <View style={s.progressTrack}>
             <View style={[s.progressFill,{width:`${me.tasks.length ? Math.round((me.done.length/me.tasks.length)*100) : 0}%`}]}/>
           </View>

           {me.tasks.map(n=>
             <View style={[s.taskRow,me.done.includes(n)&&s.taskRowDone]} key={n}>
               <View style={[s.taskCheck,me.done.includes(n)&&s.taskCheckDone]}>
                 <Text style={s.taskCheckText}>{me.done.includes(n)?'✓':'○'}</Text>
               </View>
               <View style={s.taskMain}>
                 <Text style={[s.player,s.taskLabel,me.done.includes(n)&&s.taskLabelDone]}>QR {String(n).padStart(2,'0')}</Text>
                 <Text style={[s.taskStatus,me.done.includes(n)&&s.taskStatusDone]}>{me.done.includes(n)?'TÂCHE TERMINÉE':'À FAIRE'}</Text>
               </View>
               <Text style={[s.taskArrow,me.done.includes(n)&&s.taskArrowDone]}>{me.done.includes(n)?'✓':'›'}</Text>
             </View>
           )}

           {me.pendingHQ&&
             <View style={s.hq}>
               <Text style={s.sec}>📍 Épreuve QG en cours</Text>
               <Text style={s.muted}>{HQ[me.pendingHQ-16]}</Text>
             </View>
           }
         </View>

       </ScrollView>
     </SafeAreaView>
   </>
 );
}

const s=StyleSheet.create({
  playerQrOnly:{alignItems:'center',justifyContent:'center',marginTop:14,marginBottom:4,paddingVertical:4},


playerQrHint:{color:'#858c9c',fontSize:9,marginTop:3},


playerQrImage:{width:194,height:194,alignSelf:'center'},
playerQrCode:{color:'#fff',fontSize:13,fontWeight:'900',letterSpacing:1},

 c:{flex:1,backgroundColor:'#08090d'},
 sc:{padding:20,paddingBottom:50},
 logo:{fontSize:58,textAlign:'center',marginTop:25},
 title:{color:'#fff',fontSize:29,fontWeight:'900',textAlign:'center',marginTop:8},
 sub:{color:'#858a99',fontSize:12,textAlign:'center',marginTop:6,fontWeight:'800'},
 identityIcon:{fontSize:48,textAlign:'center',marginTop:2},
identityTitle:{color:'#fff',fontSize:27,fontWeight:'900',letterSpacing:1,textAlign:'center',marginTop:2},
identitySubtitle:{color:'#7f8798',fontSize:10,fontWeight:'900',letterSpacing:1.8,textAlign:'center',marginTop:4,marginBottom:18},
identityStep:{backgroundColor:'#171b26',borderWidth:1,borderColor:'#2d3443',borderRadius:15,padding:14,marginBottom:10},
identityStepHeader:{flexDirection:'row',alignItems:'center'},
identityStepNumber:{width:30,height:30,borderRadius:15,backgroundColor:'#2a3140',alignItems:'center',justifyContent:'center',marginRight:10},
identityStepNumberText:{color:'#fff',fontSize:12,fontWeight:'900'},
identityStepTextBox:{flex:1},
identityStepTitle:{color:'#fff',fontSize:12,fontWeight:'900',letterSpacing:.6},
identityStepHint:{color:'#858c9c',fontSize:10,marginTop:3},
identityScanButton:{backgroundColor:'#e53b4f',borderWidth:2,borderColor:'#ff6475',padding:17,borderRadius:13,alignItems:'center',marginTop:14},
identityScanText:{color:'#fff',fontSize:14,fontWeight:'900',letterSpacing:.6},
identityDetected:{backgroundColor:'#14261d',borderWidth:1,borderColor:'#315a43',borderRadius:10,padding:10,marginTop:10,alignItems:'center'},
identityDetectedLabel:{color:'#63d18b',fontSize:9,fontWeight:'900',letterSpacing:.7},
identityDetectedValue:{color:'#d9e5de',fontSize:11,fontWeight:'800',marginTop:3},
identityNote:{color:'#858c9c',fontSize:10,textAlign:'center',marginTop:11},
identityInput:{backgroundColor:'#10141d',borderWidth:1,borderColor:'#3a4252',borderRadius:11,padding:14,color:'#fff',fontSize:16,marginTop:14},
identityValidateButton:{backgroundColor:'#e53b4f',borderWidth:2,borderColor:'#ff6475',padding:16,borderRadius:13,alignItems:'center',marginTop:11},
identityValidateText:{color:'#fff',fontSize:13,fontWeight:'900',letterSpacing:.6},
homeIcon:{fontSize:50,textAlign:'center',marginTop:2},
homeTitle:{color:'#fff',fontSize:29,fontWeight:'900',letterSpacing:1,textAlign:'center',marginTop:2},
homeSubtitle:{color:'#7f8798',fontSize:10,fontWeight:'900',letterSpacing:2,textAlign:'center',marginTop:4,marginBottom:17},
homePlayerCard:{flexDirection:'row',alignItems:'center',backgroundColor:'#171b26',borderWidth:1,borderColor:'#303747',borderRadius:15,padding:12},
homePlayerAvatar:{width:46,height:46,borderRadius:23,backgroundColor:'#252c3a',alignItems:'center',justifyContent:'center',marginRight:11},
homePlayerAvatarText:{fontSize:25},
homePlayerInfo:{flex:1},
homePlayerLabel:{color:'#858c9c',fontSize:8,fontWeight:'900',letterSpacing:1},
homePlayerName:{color:'#fff',fontSize:16,fontWeight:'900',marginTop:3},
homeReadyBadge:{backgroundColor:'#14261d',borderWidth:1,borderColor:'#315a43',borderRadius:999,paddingVertical:6,paddingHorizontal:9},
homeReadyText:{color:'#63d18b',fontSize:8,fontWeight:'900',letterSpacing:.7},
homeSection:{backgroundColor:'#171b26',borderWidth:1,borderColor:'#2d3443',borderRadius:15,padding:14,marginTop:10},
homeSectionHeader:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:10},
homeSectionTitle:{color:'#fff',fontSize:12,fontWeight:'900',letterSpacing:.5},
homeSectionHint:{color:'#858c9c',fontSize:8,fontWeight:'900',letterSpacing:.8},
homeInput:{backgroundColor:'#10141d',borderWidth:1,borderColor:'#3a4252',borderRadius:11,padding:13,color:'#fff',fontSize:14,marginBottom:4},
homeHint:{color:'#777f90',fontSize:10,lineHeight:16,marginTop:5},
homeConfigRow:{flexDirection:'row',gap:7,marginBottom:3},
homeConfigBox:{flex:1,backgroundColor:'#202634',borderWidth:1,borderColor:'#303849',borderRadius:10,paddingVertical:9,alignItems:'center'},
homeConfigValue:{color:'#fff',fontSize:17,fontWeight:'900'},
homeConfigLabel:{color:'#858c9c',fontSize:7,fontWeight:'900',letterSpacing:.4,marginTop:2,textAlign:'center'},
homeFieldLabel:{color:'#aeb5c4',fontSize:10,fontWeight:'800',marginTop:8,marginBottom:5},
homeCreateButton:{backgroundColor:'#e53b4f',borderWidth:2,borderColor:'#ff6475',padding:16,borderRadius:13,alignItems:'center',marginTop:12},
homeCreateText:{color:'#fff',fontSize:13,fontWeight:'900',letterSpacing:.7},
homeCodeInput:{backgroundColor:'#10141d',borderWidth:2,borderColor:'#3a4252',borderRadius:12,padding:15,color:'#fff',fontSize:20,fontWeight:'900',letterSpacing:3,textAlign:'center'},
homeJoinButton:{backgroundColor:'#242936',borderWidth:1,borderColor:'#596071',padding:15,borderRadius:12,alignItems:'center',marginTop:10},
homeJoinText:{color:'#fff',fontSize:12,fontWeight:'900',letterSpacing:.7},
card:{backgroundColor:'#14161d',borderRadius:18,padding:18,marginTop:16,borderWidth:1,borderColor:'#272b36'},
 sec:{color:'#fff',fontSize:18,fontWeight:'900',marginBottom:12},
 lab:{color:'#c9ccd5',fontWeight:'700',marginTop:8,marginBottom:5},
 input:{backgroundColor:'#0e1015',borderRadius:11,borderWidth:1,borderColor:'#2b2f3a',color:'#fff',padding:13,marginBottom:4},
 primary:{backgroundColor:'#e53b4f',padding:16,borderRadius:12,alignItems:'center',marginTop:14},
 scannerButton:{backgroundColor:'#e53b4f',padding:19,borderRadius:14,alignItems:'center',marginTop:16,borderWidth:2,borderColor:'#ff6475'},
 scannerButtonText:{color:'#fff',fontSize:16,fontWeight:'900',letterSpacing:.8},
 secondary:{backgroundColor:'#242833',padding:16,borderRadius:12,alignItems:'center',marginTop:10},
 bt:{color:'#fff',fontSize:17,fontWeight:'900',letterSpacing:.8},
 secondaryText:{color:'#fff',fontSize:19,fontWeight:'800'},
 muted:{color:'#858a99',lineHeight:21},
 center:{color:'#858a99',textAlign:'center'},
 sm:{color:'#858a99',fontSize:12,fontWeight:'900',letterSpacing:1.4},
 big:{color:'#fff',fontSize:25,fontWeight:'900',marginTop:4},
 code:{color:'#fff',fontSize:42,fontWeight:'900',letterSpacing:7,textAlign:'center',marginVertical:10},
 row:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingVertical:12,borderBottomWidth:1,borderBottomColor:'#252833'},
 playerName:{color:'#fff',fontSize:22,fontWeight:'900',marginBottom:8},
 player:{color:'#fff',fontSize:15,fontWeight:'800'},
 you:{color:'#858a99',fontSize:11,fontWeight:'900'},
 top:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},
 gameHeader:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',backgroundColor:'#14161d',borderRadius:18,padding:14,borderWidth:1,borderColor:'#272b36'},
 gameHeaderLeft:{flexDirection:'row',alignItems:'center'},
 gameMiniIcon:{fontSize:28,marginRight:10},
 liveBadge:{flexDirection:'row',alignItems:'center',backgroundColor:'#101d17',borderWidth:1,borderColor:'#214d37',borderRadius:999,paddingVertical:7,paddingHorizontal:10},
 liveDot:{width:7,height:7,borderRadius:4,backgroundColor:'#36d27c',marginRight:6},
 liveText:{color:'#6ee7a4',fontSize:10,fontWeight:'900',letterSpacing:1},
 badge:{color:'#fff',fontSize:11,fontWeight:'900',padding:9,borderRadius:9,overflow:'hidden'},
 red:{backgroundColor:'#4b1720'},
 blue:{backgroundColor:'#17384b'},
 hint:{color:'#777c8b',fontSize:12,lineHeight:18,marginBottom:6},
 target:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingVertical:12,borderTopWidth:1,borderTopColor:'#252833'},
 kill:{backgroundColor:'#e53b4f',padding:11,borderRadius:9},
 alert:{backgroundColor:'#32131a',borderWidth:2,borderColor:'#ff4b5f',padding:17,borderRadius:14,alignItems:'center',marginTop:15},
 alertT:{color:'#ff6b7a',fontSize:15,fontWeight:'900',letterSpacing:.5},
 meetingIcon:{fontSize:48,marginTop:4,marginBottom:4,textAlign:'center'},
meetingTitle:{color:'#ff596b',fontSize:24,fontWeight:'900',letterSpacing:1,textAlign:'center'},
meetingSubtitle:{color:'#aeb4c2',fontSize:13,textAlign:'center',marginTop:6},
meetingHint:{color:'#fff',fontSize:14,fontWeight:'800',textAlign:'center',marginTop:16,marginBottom:8},
voteCard:{flexDirection:'row',alignItems:'center',backgroundColor:'#1a1f2b',borderWidth:1,borderColor:'#343b4b',borderRadius:14,padding:13,marginBottom:9},
voteAvatar:{width:42,height:42,borderRadius:21,backgroundColor:'#272e3d',alignItems:'center',justifyContent:'center',marginRight:12},
voteAvatarText:{fontSize:20},
voteInfo:{flex:1},
voteName:{color:'#fff',fontSize:16,fontWeight:'900'},
voteAction:{color:'#8f96a6',fontSize:9,fontWeight:'900',letterSpacing:.5,marginTop:3},
voteArrow:{color:'#ff596b',fontSize:30,fontWeight:'300',marginLeft:8},
whiteVoteButton:{backgroundColor:'#242936',borderWidth:1,borderColor:'#596071',padding:15,borderRadius:12,alignItems:'center',marginTop:6},
whiteVoteText:{color:'#dfe3ec',fontSize:13,fontWeight:'900',letterSpacing:.7},
vote:{flexDirection:'row',justifyContent:'space-between',padding:15,borderTopWidth:1,borderTopColor:'#252833'},
 icon:{fontSize:60,textAlign:'center',marginBottom:12},
 scanScreen:{flex:1,backgroundColor:'#000'},
scanTop:{position:'absolute',top:22,left:20,right:20,alignItems:'center'},
scanTitle:{color:'#fff',fontSize:20,fontWeight:'900',letterSpacing:1},
scanSubtitle:{color:'#d0d4dc',fontSize:11,fontWeight:'700',marginTop:5,textAlign:'center'},
scanFrame:{position:'absolute',width:250,height:250,left:'50%',top:'50%',marginLeft:-125,marginTop:-145},
scanCorner:{position:'absolute',width:32,height:32,borderColor:'#fff'},
scanCornerTL:{top:0,left:0,borderTopWidth:4,borderLeftWidth:4},
scanCornerTR:{top:0,right:0,borderTopWidth:4,borderRightWidth:4},
scanCornerBL:{bottom:0,left:0,borderBottomWidth:4,borderLeftWidth:4},
scanCornerBR:{bottom:0,right:0,borderBottomWidth:4,borderRightWidth:4},
scanLine:{position:'absolute',left:12,right:12,top:'50%',height:2,backgroundColor:'#ff4b5f'},
scanBottom:{position:'absolute',left:18,right:18,bottom:52},





scanCancelButton:{backgroundColor:'#242833',borderWidth:1,borderColor:'#596071',padding:15,borderRadius:12,alignItems:'center',marginTop:9},
scanCancelText:{color:'#fff',fontSize:12,fontWeight:'900',letterSpacing:.7},
camera:{flex:1},
 deadScreen:{flex:1,backgroundColor:'#10070a',alignItems:'center',justifyContent:'center',paddingHorizontal:24},
deadGlow:{width:150,height:150,borderRadius:75,backgroundColor:'#3a1018',borderWidth:3,borderColor:'#ff304f',alignItems:'center',justifyContent:'center',marginBottom:22,elevation:10,shadowColor:'#ff304f',shadowOpacity:.5,shadowRadius:16},
deadSkull:{fontSize:76},
deadTitle:{color:'#ff4058',fontSize:36,fontWeight:'900',letterSpacing:2,textAlign:'center'},
deadDivider:{width:70,height:2,backgroundColor:'#7f2634',marginVertical:18},
deadMessage:{color:'#c3aeb3',fontSize:14,textAlign:'center',lineHeight:21},
deadObserve:{width:'100%',backgroundColor:'#211218',borderWidth:1,borderColor:'#4b2831',borderRadius:14,padding:15,marginTop:26,alignItems:'center'},
deadObserveTitle:{color:'#ff8a98',fontSize:12,fontWeight:'900',letterSpacing:.7},
deadObserveText:{color:'#93838a',fontSize:11,marginTop:5,textAlign:'center'},
dead:{flex:1,backgroundColor:'#050507',alignItems:'center',justifyContent:'center',padding:30},
 skull:{fontSize:80},
 deadT:{color:'#ff334d',fontSize:36,fontWeight:'900',marginVertical:18,textAlign:'center'},
 deadTxt:{color:'#a4a8b4',textAlign:'center',fontSize:16,lineHeight:24},
 roleIcon:{fontSize:70,marginBottom:12},
 roleTitle:{color:'#fff',fontSize:34,fontWeight:'900',textAlign:'center',marginVertical:12},
 roleHint:{color:'#a4a8b4',fontSize:15,textAlign:'center',lineHeight:22,marginBottom:18},
 backSmall:{backgroundColor:'#242833',padding:10,borderRadius:9},
 hq:{backgroundColor:'#10131a',borderRadius:12,padding:14,marginTop:14,borderWidth:1,borderColor:'#303542'},
 taskHeader:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},
 taskCount:{color:'#858a99',fontSize:12,fontWeight:'700',marginTop:-7,marginBottom:10},
 taskPercent:{color:'#fff',fontSize:22,fontWeight:'900'},
 progressTrack:{height:8,backgroundColor:'#292d37',borderRadius:99,overflow:'hidden',marginBottom:6},
 progressFill:{height:'100%',backgroundColor:'#e53b4f',borderRadius:99},
 taskRow:{flexDirection:'row',alignItems:'center',paddingVertical:11,borderBottomWidth:1,borderBottomColor:'#252833'},
 taskCheck:{width:28,height:28,borderRadius:14,backgroundColor:'#242833',alignItems:'center',justifyContent:'center',marginRight:10},
 taskCheckDone:{backgroundColor:'#214d37'},
 taskCheckText:{color:'#fff',fontSize:15,fontWeight:'900'},
 taskLabel:{flex:1},
 taskLabelDone:{color:'#8fa596'},
 taskStatus:{color:'#a3a9b8',fontSize:9,fontWeight:'900',letterSpacing:.7,marginTop:3},
 taskStatusDone:{color:'#63d18b'},taskRowDone:{backgroundColor:'#15251d',borderColor:'#315a43'},taskMain:{flex:1},taskArrow:{color:'#858a99',fontSize:27,fontWeight:'300',marginLeft:8},taskArrowDone:{color:'#63d18b',fontWeight:'900'},
 statusCard:{backgroundColor:'#10131a',borderRadius:18,padding:18,marginTop:16,borderWidth:1,borderColor:'#272b36'},
 statusLine:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingVertical:9},
 statusLabel:{color:'#b7bbc5',fontSize:14,fontWeight:'700'},
 statusValue:{color:'#fff',fontSize:15,fontWeight:'900'},
 notice:{color:'#fff',textAlign:'center',marginTop:15}
});