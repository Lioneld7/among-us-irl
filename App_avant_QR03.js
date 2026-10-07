import React,{useEffect,useRef,useState}from'react';
import{View,Text,TextInput,Pressable,StyleSheet,ScrollView,Alert}from'react-native';
import{SafeAreaView}from'react-native-safe-area-context';
import{StatusBar}from'expo-status-bar';
import{CameraView,useCameraPermissions}from'expo-camera';

const HQ=[
'Apporter une chaussette au QG','Composer un slam de 3 vers avec des rimes sur 3 prénoms de tes potes et le chanter','Lancer 3 dés et obtenir 10 ou 11, recommencer si nécessaire','Faire un flip de bouteille qui retombe debout','Raconter la blague la plus marrante possible','Gagner une manche de Pierre/Feuille/Ciseaux','Créer une bulle de savon et la souffler à travers un cerceau','Envoyer un sachet de thé sur la visière avec un mouvement de tête','Lancer une balle dans une poubelle accrochée dans le dos','Faire rouler une balle de ping-pong dans un verre posé au sol','Construire un château de cartes','Déplacer 5 papiers d’un verre à un autre avec une paille','Faire deviner 3 mots uniquement en les mimant','Faire deviner 3 animaux uniquement en les bruitant','Empiler 5 jetons sur le dos de la main puis tous les rattraper'
];

const MINI=['Mémoire éclair','Réaction','Calcul express','Suite de couleurs','Compter les intrus','Code secret','Cible mobile','Ordre croissant','Pair ou impair','Trouver le symbole','Mot à compléter','Pastilles piégées','Compte à rebours','Attrape le bon symbole','Séquence finale'];

const DEFAULT_SERVER='ws://192.168.1.82:3000';

export default function App(){
 const [server,setServer]=useState(DEFAULT_SERVER),[name,setName]=useState(''),[code,setCode]=useState(''),[screen,setScreen]=useState('home');
 const [count,setCount]=useState('6'),[imp,setImp]=useState('1'),[tc,setTc]=useState('5');
 const [state,setState]=useState(null),[task,setTask]=useState(null),[scan,setScan]=useState(false),[perm,ask]=useCameraPermissions();
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
const [connecting,setConnecting]=useState(false),[justDied,setJustDied]=useState(false),[roleIntro,setRoleIntro]=useState(false),[reportMode,setReportMode]=useState(false),[impostorMode,setImpostorMode]=useState(false),ws=useRef(null);
 const session=useRef({action:null,room:null,name:''});
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
   const url=server.trim().replace(/\/$/,'');
   if(!room||!nm||(!url.startsWith('ws://')&&!url.startsWith('wss://'))){
     Alert.alert('Connexion','La connexion au serveur est perdue.');
     return;
   }

   setConnecting(true);
   const sock=new WebSocket(url);
   ws.current=sock;

   sock.onopen=()=>{
     sock.send(JSON.stringify({type:'JOIN',name:nm,room}));
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
       session.current={action:'join',room:m.room,name:nm};
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

       if(m.status==='lobby')
         setScreen('lobby');
       else if(m.status==='playing'||m.status==='ended')
         setScreen('game');
     }
   };

   sock.onerror=()=>{setConnecting(false)};
   sock.onclose=()=>{setConnecting(false)};
 };

 const connect=(action)=>{
   const url=server.trim().replace(/\/$/,'');

   if(!url.startsWith('ws://')&&!url.startsWith('wss://'))
     return Alert.alert('Adresse serveur','Utilise par exemple ws://192.168.1.82:3000');

   if(!name.trim())
     return Alert.alert('Nom requis','Entre ton nom.');

   setConnecting(true);
   setMessage('Connexion au serveur…');

   session.current={
     action,
     room:code.toUpperCase(),
     name:name.trim()
   };

   const sock=new WebSocket(url);
   ws.current=sock;

   sock.onopen=()=>{
     setMessage('');
     setConnecting(false);

     if(action==='create')
       send({
         type:'CREATE',
         name,
         count,
         impostors:imp,
         tasksPerCrewmate:tc
       });
     else
       send({
         type:'JOIN',
         name,
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
         name:name.trim()
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
         Alert.alert(
           'Fin de partie',
           m.win==='crewmates'
             ?'Les crewmates gagnent !'
             :'Les imposteurs gagnent !'
         );
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
     if(screen!=='home')
       setMessage('Connexion au serveur fermée.');
   };
 };

 useEffect(()=>()=>ws.current?.close(),[]);

 const openScan=async()=>{
   if(!perm?.granted){
     const r=await ask();
     if(!r.granted)return;
   }
   setScan(true);
 };

 const qr=data=>{
   if(!data?.startsWith('AUR2:'))return;

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
   let a=Math.floor(Math.random()*12)+4,b=Math.floor(Math.random()*9)+2,c=Math.floor(Math.random()*9)+2,op1=ops[Math.floor(Math.random()*4)],op2=ops[Math.floor(Math.random()*4)];
   if(op1==='÷') a=b*(Math.floor(Math.random()*5)+2);
   if(op2==='÷') b=c*(Math.floor(Math.random()*4)+2);
   let answer;
   if(op1==='+' ) answer=a + (op2==='+'?b+c:op2==='-'?b-c:op2==='×'?b*c:b/c);
   else if(op1==='-') answer=a - (op2==='+'?b+c:op2==='-'?b-c:op2==='×'?b*c:b/c);
   else if(op1==='×') answer=a * (op2==='+'?b+c:op2==='-'?b-c:op2==='×'?b*c:b/c);
   else answer=a / (op2==='+'?b+c:op2==='-'?b-c:op2==='×'?b*c:b/c);
   if(!Number.isInteger(answer)){ a=12;b=7;c=3;op1='+';op2='×';answer=33; }
   setCalcAnswer(answer); setCalcQuestion(`${a} ${op1} ${b} ${op2} ${c} = ?`);
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
     Alert.alert('Perdu','Temps dépassé. Le score revient à 0. Il faut rescanner le QR code pour rejouer.',[{text:'OK',onPress:()=>{setSymbolRound14(0);setTask(null);}}]);
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
       <SafeAreaView style={s.c}>
         <CameraView
           style={s.camera}
           facing="back"
           barcodeScannerSettings={{barcodeTypes:['qr']}}
           onBarcodeScanned={({data})=>qr(data)}
         />

         <Pressable
           style={s.secondary}
           onPress={()=>setScan(false)}
         >
           <Text style={s.bt}>Annuler</Text>
         </Pressable>
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
        <ScrollView contentContainerStyle={s.sc}><Text style={s.big}>🎯 Attrape le bon symbole</Text><View style={s.card}>{symbol14Phase==='show'?<><Text style={s.sec}>Mémorise ce symbole :</Text><Text style={{fontSize:60,textAlign:'center',marginVertical:20}}>{targetSymbol14}</Text><Text style={s.muted}>Il va disparaître...</Text></>:<><Text style={s.sec}>Trouve le symbole mémorisé</Text><Text style={s.muted}>Manche {symbolRound14+1}/5 • 24 symboles</Text><View style={{flexDirection:'row',flexWrap:'wrap',justifyContent:'center'}}>{choices14.map((sym,i)=><Pressable key={i} style={{width:58,height:58,margin:3,borderRadius:10,backgroundColor:'#242833',alignItems:'center',justifyContent:'center'}} onPress={()=>{if(sym===targetSymbol14){const r=symbolRound14+1;setSymbolRound14(r);if(r>=5){setTimeout(()=>finishMini(),0);}}else{Alert.alert('Perdu','Mauvais symbole. Le score revient à 0. Il faut rescanner le QR code pour rejouer.',[{text:'OK',onPress:()=>{setSymbolRound14(0);setTask(null);}}]);}}}><Text style={{fontSize:26}}>{sym}</Text></Pressable>)}</View></>}</View></ScrollView>
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
if(screen==='home')
   return(
     <>
       <StatusBar style="light"/>
       <SafeAreaView style={s.c}>
         <ScrollView contentContainerStyle={s.sc}>
           <Text style={s.logo}>🚀</Text>
           <Text style={s.title}>AMONG US RÉEL</Text>
           <Text style={s.sub}>VERSION 3 • MULTIJOUEUR</Text>

           <View style={s.card}>
             <Text style={s.sec}>Serveur de partie</Text>

             <TextInput
               style={s.input}
               value={server}
               onChangeText={setServer}
               autoCapitalize="none"
               autoCorrect={false}
             />

             <Text style={s.hint}>
               Sur le PC : lance le serveur avec `node server.js`. Tous les téléphones doivent être sur le même Wi-Fi pour ce premier test.
             </Text>
           </View>

           <View style={s.card}>
             <Text style={s.sec}>Créer une partie</Text>

             <Text style={s.lab}>Ton nom</Text>

             <TextInput
               style={s.input}
               value={name}
               onChangeText={setName}
               placeholder="Ex. Thomas"
               placeholderTextColor="#777"
             />

             <Text style={s.lab}>Nombre de joueurs</Text>

             <TextInput
               style={s.input}
               value={count}
               onChangeText={setCount}
               keyboardType="number-pad"
             />

             <Text style={s.lab}>Nombre d’imposteurs</Text>

             <TextInput
               style={s.input}
               value={imp}
               onChangeText={setImp}
               keyboardType="number-pad"
             />

             <Text style={s.lab}>Tâches par crewmate</Text>

             <TextInput
               style={s.input}
               value={tc}
               onChangeText={setTc}
               keyboardType="number-pad"
             />

             <Pressable
               style={s.primary}
               onPress={()=>connect('create')}
             >
               <Text style={s.bt}>
                 {connecting?'Connexion…':'Créer la partie'}
               </Text>
             </Pressable>
           </View>

           <View style={s.card}>
             <Text style={s.sec}>Rejoindre une partie</Text>

             <TextInput
               style={s.input}
               value={code}
               onChangeText={v=>setCode(v.toUpperCase())}
               placeholder="Code de partie"
               placeholderTextColor="#777"
               autoCapitalize="characters"
             />

             <TextInput
               style={s.input}
               value={name}
               onChangeText={setName}
               placeholder="Ton nom"
               placeholderTextColor="#777"
             />

             <Pressable
               style={s.secondary}
               onPress={()=>connect('join')}
             >
               <Text style={s.bt}>Rejoindre</Text>
             </Pressable>
           </View>

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
               <Text style={s.bt}>Lancer la partie</Text>
             </Pressable>
           :
             <Text style={s.center}>
               Attends que l’hôte lance la partie.
             </Text>
           }
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

 if(state.meeting?.active&&me.alive)
   return(
     <>
       <StatusBar style="light"/>
       <SafeAreaView style={s.c}>
         <ScrollView contentContainerStyle={s.sc}>
           <Text style={s.logo}>🚨</Text>
           <Text style={s.title}>RÉUNION</Text>

           <Text style={s.center}>
             Signalée par {state.meeting.reportedBy}
           </Text>

           <View style={s.card}>
             {alive.filter(p=>p.id!==me.id).map(p=>
               <Pressable
                 style={s.vote}
                 key={p.id}
                 onPress={()=>send({type:'VOTE',target:p.id})}
               >
                 <Text style={s.player}>{p.name}</Text>
                 <Text style={s.muted}>
                   {state.meeting.voted?'Vote envoyé':''}
                 </Text>
               </Pressable>
             )}

             <Pressable
               style={s.secondary}
               onPress={()=>send({type:'SKIP_VOTE'})}
             >
               <Text style={s.bt}>Voter blanc</Text>
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
       <SafeAreaView style={s.dead}>
         <Text style={s.skull}>💀</Text>
         <Text style={s.deadT}>TU ES MORT</Text>
         <Text style={s.deadTxt}>
           Tu peux observer la partie, mais tu ne peux plus agir ni voter.
         </Text>
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
       </SafeAreaView>
     </>
   );

 if(impostorMode&&me.role==='imposteur')
   return(
     <>
       <StatusBar style="light"/>
       <SafeAreaView style={s.c}>
         <ScrollView contentContainerStyle={s.sc}>
           <View style={s.top}>
             <Text style={s.big}>Élimination</Text>

             <Pressable
               style={s.backSmall}
               onPress={()=>setImpostorMode(false)}
             >
               <Text style={s.bt}>← RETOUR</Text>
             </Pressable>
           </View>

           <View style={s.card}>
             <Text style={s.sec}>Choisir une cible</Text>

             {near.length===0?
               <Text style={s.muted}>
                 Aucun joueur vivant disponible.
               </Text>
             :
               near.map(p=>
                 <View style={s.target} key={p.id}>
                   <Text style={s.player}>{p.name}</Text>

                   <Pressable
                     style={s.kill}
                     onPress={()=>
                       Alert.alert(
                         'Élimination',
                         `Éliminer ${p.name} ?`,
                         [
                           {text:'Annuler',style:'cancel'},
                           {
                             text:'Éliminer',
                             style:'destructive',
                             onPress:()=>{
                               send({type:'KILL',target:p.id});
                               setImpostorMode(false);
                             }
                           }
                         ]
                       )
                     }
                   >
                     <Text style={s.bt}>ÉLIMINER</Text>
                   </Pressable>
                 </View>
               )
             }
           </View>
         </ScrollView>
       </SafeAreaView>
     </>
   );

 if(reportMode&&me.role==='crewmate')
   return(
     <>
       <StatusBar style="light"/>
       <SafeAreaView style={s.c}>
         <ScrollView contentContainerStyle={s.sc}>
           <View style={s.top}>
             <Text style={s.big}>Un mort ?</Text>

             <Pressable
               style={s.backSmall}
               onPress={()=>setReportMode(false)}
             >
               <Text style={s.bt}>← RETOUR</Text>
             </Pressable>
           </View>

           <View style={s.card}>
             <Text style={s.sec}>🚨 Signaler un mort</Text>

             <Text style={s.muted}>
               Si tu as trouvé un joueur mort, signale-le pour lancer la réunion.
             </Text>

             <Pressable
               style={s.alert}
               onPress={()=>{
                 setReportMode(false);
                 send({type:'REPORT'});
               }}
             >
               <Text style={s.alertT}>🚨 SIGNALER UN MORT</Text>
             </Pressable>
           </View>
         </ScrollView>
       </SafeAreaView>
     </>
   );

 return(
   <>
     <StatusBar style="light"/>

     <SafeAreaView style={s.c}>
       <ScrollView contentContainerStyle={s.sc}>

         <View style={s.top}>
           <View>
             <Text style={s.sm}>PARTIE {state.room}</Text>
             <Text style={s.big}>Mission</Text>
           </View>
         </View>

         <View style={s.card}>
           <Text style={s.sec}>Mes tâches</Text>

           {me.tasks.map(n=>
             <View style={s.row} key={n}>
               <Text style={s.player}>
                 {me.done.includes(n)?'✓':'○'} QR {String(n).padStart(2,'0')}
               </Text>

             </View>
           )}

           <Pressable
             style={s.primary}
             onPress={openScan}
           >
             <Text style={s.bt}>📷 Scanner un QR</Text>
           </Pressable>

           {me.pendingHQ&&
             <View style={s.hq}>
               <Text style={s.sec}>📍 Épreuve QG en cours</Text>

               <Text style={s.muted}>
                 {HQ[me.pendingHQ-16]}
               </Text>

               <Text style={s.hint}>
                 Après réussite, scanne le QR du meneur.
               </Text>

               <Pressable
                 style={s.secondary}
                 onPress={openScan}
               >
                 <Text style={s.bt}>Scanner le QR du meneur</Text>
               </Pressable>
             </View>
           }
         </View>

         <Pressable
           style={s.alert}
           onPress={()=>{
             if(me.role==='imposteur'){
               setImpostorMode(true);
             }else{
               setReportMode(true);
             }
           }}
         >
           <Text style={s.alertT}>❓ UN MORT ?</Text>
         </Pressable>

         <View style={s.card}>
           <Text style={s.sec}>État</Text>

           <Text style={s.muted}>
             Tâches : {me.done.length}/{me.tasks.length}
           </Text>

           <Text style={s.muted}>
             Joueurs vivants : {alive.length}/{state.players.length}
           </Text>
         </View>

       </ScrollView>
     </SafeAreaView>
   </>
 );
}

const s=StyleSheet.create({
 c:{flex:1,backgroundColor:'#08090d'},
 sc:{padding:20,paddingBottom:50},
 logo:{fontSize:58,textAlign:'center',marginTop:25},
 title:{color:'#fff',fontSize:29,fontWeight:'900',textAlign:'center',marginTop:8},
 sub:{color:'#858a99',fontSize:12,textAlign:'center',marginTop:6,fontWeight:'800'},
 card:{backgroundColor:'#14161d',borderRadius:18,padding:18,marginTop:16,borderWidth:1,borderColor:'#272b36'},
 sec:{color:'#fff',fontSize:18,fontWeight:'900',marginBottom:12},
 lab:{color:'#c9ccd5',fontWeight:'700',marginTop:8,marginBottom:5},
 input:{backgroundColor:'#0e1015',borderRadius:11,borderWidth:1,borderColor:'#2b2f3a',color:'#fff',padding:13,marginBottom:4},
 primary:{backgroundColor:'#e53b4f',padding:16,borderRadius:12,alignItems:'center',marginTop:14},
 secondary:{backgroundColor:'#242833',padding:16,borderRadius:12,alignItems:'center',marginTop:10},
 bt:{color:'#fff',fontWeight:'900'},
 muted:{color:'#858a99',lineHeight:21},
 center:{color:'#858a99',textAlign:'center'},
 sm:{color:'#858a99',fontSize:12,fontWeight:'900',letterSpacing:1.4},
 big:{color:'#fff',fontSize:25,fontWeight:'900',marginTop:4},
 code:{color:'#fff',fontSize:42,fontWeight:'900',letterSpacing:7,textAlign:'center',marginVertical:10},
 row:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingVertical:12,borderBottomWidth:1,borderBottomColor:'#252833'},
 player:{color:'#fff',fontSize:15,fontWeight:'800'},
 you:{color:'#858a99',fontSize:11,fontWeight:'900'},
 top:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},
 badge:{color:'#fff',fontSize:11,fontWeight:'900',padding:9,borderRadius:9,overflow:'hidden'},
 red:{backgroundColor:'#4b1720'},
 blue:{backgroundColor:'#17384b'},
 hint:{color:'#777c8b',fontSize:12,lineHeight:18,marginBottom:6},
 target:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingVertical:12,borderTopWidth:1,borderTopColor:'#252833'},
 kill:{backgroundColor:'#e53b4f',padding:11,borderRadius:9},
 alert:{borderWidth:1,borderColor:'#a52b3a',padding:15,borderRadius:12,alignItems:'center',marginTop:15},
 alertT:{color:'#ff6575',fontWeight:'900'},
 vote:{flexDirection:'row',justifyContent:'space-between',padding:15,borderTopWidth:1,borderTopColor:'#252833'},
 icon:{fontSize:60,textAlign:'center',marginBottom:12},
 camera:{flex:1},
 dead:{flex:1,backgroundColor:'#050507',alignItems:'center',justifyContent:'center',padding:30},
 skull:{fontSize:80},
 deadT:{color:'#ff334d',fontSize:36,fontWeight:'900',marginVertical:18,textAlign:'center'},
 deadTxt:{color:'#a4a8b4',textAlign:'center',fontSize:16,lineHeight:24},
 roleIcon:{fontSize:70,marginBottom:12},
 roleTitle:{color:'#fff',fontSize:34,fontWeight:'900',textAlign:'center',marginVertical:12},
 roleHint:{color:'#a4a8b4',fontSize:15,textAlign:'center',lineHeight:22,marginBottom:18},
 backSmall:{backgroundColor:'#242833',padding:10,borderRadius:9},
 hq:{backgroundColor:'#10131a',borderRadius:12,padding:14,marginTop:14,borderWidth:1,borderColor:'#303542'},
 notice:{color:'#fff',textAlign:'center',marginTop:15}
});