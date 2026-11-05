// engine.js — audio, physics, AI, fatality logic
cv.width=LW;cv.height=LH;

// === AUDIO ===
let AC,bgNodes=[];
function aud(){if(AC)return;try{AC=new AudioContext()}catch(e){}}
function snd(t){
  if(!AC)return;
  const g=AC.createGain(),dst=AC.destination;
  function osc(fr,type,dur,gain){
    const o=AC.createOscillator(),gn=AC.createGain();
    o.type=type||'square';o.frequency.value=fr;
    gn.gain.setValueAtTime(gain||0.3,AC.currentTime);
    gn.gain.exponentialRampToValueAtTime(0.0001,AC.currentTime+dur);
    o.connect(gn);gn.connect(dst);o.start();o.stop(AC.currentTime+dur);
  }
  if(t=='punch'){osc(180,'square',.08,.25);osc(90,'sawtooth',.12,.15)}
  else if(t=='kick'){osc(80,'sawtooth',.15,.3);osc(50,'square',.2,.2)}
  else if(t=='ko'){osc(220,'square',.08,.3);osc(110,'sawtooth',.2,.2);osc(80,'sawtooth',.4,.15);osc(55,'square',.6,.1)}
  else if(t=='hit'){osc(300,'square',.06,.2);osc(150,'sawtooth',.1,.1)}
  else if(t=='fatality'){
    [0,.1,.2,.3,.5].forEach((d,i)=>{
      const b=AC.createOscillator(),gn=AC.createGain();
      b.type='sawtooth';b.frequency.value=[440,550,660,880,1100][i];
      gn.gain.setValueAtTime(0,AC.currentTime+d);
      gn.gain.linearRampToValueAtTime(.4,AC.currentTime+d+.05);
      gn.gain.exponentialRampToValueAtTime(.0001,AC.currentTime+d+.4);
      b.connect(gn);gn.connect(dst);b.start(AC.currentTime+d);b.stop(AC.currentTime+d+.5);
    });
  }
  else if(t=='fatbar'){osc(600+fatBar*4,'square',.05,.15)}
  else if(t=='select'){osc(440,'square',.1,.2);osc(660,'square',.1,.15)}
  else if(t=='win'){
    [0,.12,.24,.36].forEach((d,i)=>{
      const o=AC.createOscillator(),gn=AC.createGain();
      o.type='square';o.frequency.value=[523,659,784,1046][i];
      gn.gain.setValueAtTime(.3,AC.currentTime+d);
      gn.gain.exponentialRampToValueAtTime(.0001,AC.currentTime+d+.3);
      o.connect(gn);gn.connect(dst);o.start(AC.currentTime+d);o.stop(AC.currentTime+d+.4);
    });
  }
}

function startBgMusic(){
  if(!AC||bgNodes.length)return;
  const pattern=[220,0,196,0,220,0,165,0,196,0,220,0,165,0,0];
  let beat=0;
  const bpm=160,spb=60/bpm;
  function playBeat(){
    if(!bgNodes.length)return;
    const freq=pattern[beat%pattern.length];
    if(freq>0){
      const o=AC.createOscillator(),g=AC.createGain(),ws=AC.createWaveShaper();
      o.type='square';o.frequency.value=freq;
      const curve=new Float32Array(256);for(let i=0;i<256;i++){const x=i/128-1;curve[i]=x<0?-Math.pow(-x,.4):Math.pow(x,.4)}
      ws.curve=curve;
      g.gain.setValueAtTime(.07,AC.currentTime);
      o.connect(ws);ws.connect(g);g.connect(AC.destination);
      o.start();o.stop(AC.currentTime+spb*.45);
      bgNodes.push(o,g,ws);
    }
    // Bass
    if(beat%4===0){
      const b=AC.createOscillator(),bg=AC.createGain();
      b.type='sawtooth';b.frequency.value=55+Math.floor(beat/4)%4*5;
      bg.gain.setValueAtTime(.12,AC.currentTime);bg.gain.exponentialRampToValueAtTime(.001,AC.currentTime+spb*.9);
      b.connect(bg);bg.connect(AC.destination);b.start();b.stop(AC.currentTime+spb*.9);
      bgNodes.push(b,bg);
    }
    beat++;
    const id=setTimeout(playBeat,spb*1000);
    bgNodes.push({stop:()=>clearTimeout(id)});
  }
  bgNodes.push({stop:()=>{}});
  playBeat();
}

function stopBgMusic(){
  bgNodes.forEach(n=>{try{if(n.stop)n.stop()}catch(e){}});
  bgNodes=[];
}

// === LOAD IMAGES ===
let imgs=0;
const need=D.c.length;
function countImgs(){return D.c.filter(ch=>ch._aOk&&ch._pOk).length;}

const B64PFX='data:image/png;base64,';
D.c.forEach(ch=>{
  ch._aOk=false;ch._pOk=false;
  ch.A=new Image();
  ch.A.onload=()=>{ch._aOk=true;};
  ch.A.onerror=()=>{ch._aOk=true;};
  ch.P=new Image();
  ch.P.onload=()=>{ch._pOk=true;};
  ch.P.onerror=()=>{ch._pOk=true;};
  // Add data URI prefix if missing
  ch.A.src=ch.img.startsWith('data:')?ch.img:B64PFX+ch.img;
  ch.P.src=ch.por.startsWith('data:')?ch.por:B64PFX+ch.por;
  if(ch.A.complete)ch._aOk=true;
  if(ch.P.complete)ch._pOk=true;
});

// === STATE ===
let sc='title'; // title,select,intro,fight,roundend,end,fatready,fatality,fatend,win,lose,ranking
let me=1,foes=[],fi=0,P,E,round=1,roundWinsP=0,roundWinsE=0,roundResult='';
let bl=0,mt=0,msg='',shake=0,tm=ROUND_TIME;
let sp=[];
let comboCount=0,comboTimer=0,comboStr='';
let fatPhase=0,fatBar=0,fatActive=false,fatParticles=[],fatTimer=0;
let bossUnlocked=false;

// RANKING
let playerScore=0;
let playerName='';
let savedScores=[];
try{
  bossUnlocked=localStorage.getItem('sf_boss')==='1';
  savedScores=JSON.parse(localStorage.getItem('sf_scores')||'[]');
}catch(e){}

// === FIT / RESIZE ===
function fit(){
  cv.width=LW;cv.height=LH;
  cv.style.position='fixed';
  // Letterbox: scale to fit keeping aspect ratio
  const scale=Math.min(innerWidth/LW,innerHeight/LH);
  const w=Math.floor(LW*scale),h=Math.floor(LH*scale);
  cv.style.width=w+'px';cv.style.height=h+'px';
  cv.style.left=Math.floor((innerWidth-w)/2)+'px';
  cv.style.top=Math.floor((innerHeight-h)/2)+'px';
}
fit();
window.addEventListener('resize',fit);

// === PHYSICS ===
const LV=[.55,.68,.82,.95];
function mk(ci,x,face){
  const c=D.c[ci];
  return{c,x,y:0,vx:0,vy:0,face,hp:300,mh:300,st:'idle',t:0,wind:.12,
    atk:0,lastAtk:0,at:0,plan:'',air:false,type:'p',idx:0}
}

function setS(f,s){
  if(f.st==s)return;
  f.st=s;f.t=0;
  if(s=='atk'){f.wind=.12;f.atk=.32;f.air=f.y<0}
}

function phys(f){
  f.y+=f.vy*DT;
  if(f.y>=0){f.y=0;f.vy=0;f.air=false}
  else{f.vy+=1600*DT;f.air=true}
  f.x=Math.max(60,Math.min(840,f.x+f.vx*DT));
  if(f.st!='walk'&&f.st!='jump')f.vx*=.65;
  f.t+=DT;
}

function hitbox(f){
  return{x:f.x-(f.face>0?30:60),y:G+f.y-180,w:90,h:180}
}

function atkbox(f){
  const r=f.face>0;
  return{x:f.x+(r?20:-80),y:G+f.y-140,w:80,h:100}
}

function overlap(a,b){
  return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y
}

function strike(f,o){
  if(f.st!='atk'||f.t<f.wind||f.t>f.atk)return;
  if(bl-f.lastAtk<0.18)return;
  if(!overlap(atkbox(f),hitbox(o)))return;
  f.lastAtk=bl;
  const bl_=o.st=='guard';
  const dmg=bl_?8:30+Math.random()*20|0;
  o.hp=Math.max(0,o.hp-dmg);
  sp.push({x:(f.x+o.x)/2,y:G+Math.min(f.y,o.y)-120,b:bl_,t:0});
  shake=bl_?4:9;

  // Combo management
  if(f===P&&!bl_){
    // Player landed hit — accumulate combo
    if(bl-P.lastAtk<0.5){comboCount++;comboTimer=1.8;}
    else{comboCount=1;comboTimer=1.8;}
    if(comboCount>=3)comboStr=comboCount>=8?'BRUTAL!!':comboCount>=5?'IMPARABLE!':'COMBO!';
    // Score for hit
    playerScore+=1000;
    snd(f.type=='k'?'kick':'punch');
  } else if(f===E&&!bl_){
    // Enemy hit the player — RESET player's combo
    comboCount=0;comboStr='';comboTimer=0;
    snd('hit');
  }

  if(!bl_)setS(o,'hit');
}

function upd(f,o,I){
  if(f.st=='ko'||f.st=='win')return;
  strike(f,o);
  if(f.st=='hit'&&f.t>.18)setS(f,'idle');
  if(f.st=='atk'&&f.t>f.atk)setS(f,'idle');
  if(f.st=='jump'&&f.y>=0)setS(f,'idle');
  if(f.st=='ko')return;
  const mv=(I.r?1:0)-(I.l?1:0),back=mv*f.face<0;
  if(I.g&&f.st!='jump'){setS(f,'guard');f.vx=0;return}
  if(f.st=='idle'||f.st=='walk'||f.st=='crouch'){
    if((I.p||I.k)&&f.st!='atk'){setS(f,'atk');f.type=I.k?'k':'p';f.idx=0}
    else if(I.d&&!I.u){setS(f,'crouch')}
    else if(I.u){setS(f,'jump');f.vy=-720;f.vx=mv*200*f.sp}
    else if(mv){setS(f,'walk');f.vx=mv*(back?120:170)*f.face*f.face}
    else setS(f,'idle');
    if(f.st!='walk'&&f.st!='jump'&&f.st!='atk')f.vx=0;
  }else if((I.p||I.k)&&f.st=='jump')setS(f,'atk');
  phys(f);
}

function ai(f,o,L){
  const I={},dx=o.x-f.x,d=Math.abs(dx),to=dx>0?'r':'l',aw=dx>0?'l':'r';
  f.at-=DT;
  if(f.at<=0){
    f.at=.08+Math.random()*.25*(1.1-L); // react faster
    const r=Math.random();
    // Block if opponent is attacking close
    if(o.st=='atk'&&d<200&&r<.2+.4*L){f.plan='g';}
    // Far away — always approach aggressively
    else if(d>160){f.plan=r<.08?'j':'a';}
    // In range — attack mostly
    else{
      if(r<.45+.2*L)f.plan='p';       // punch
      else if(r<.75+.1*L)f.plan='k';  // kick
      else if(r<.85)f.plan='a';        // step closer
      else if(r<.93)f.plan='c';        // crouch
      else f.plan='g';                  // guard rarely
    }
  }
  const p=f.plan;
  if(p=='a')I[to]=1;
  else if(p=='b')I[aw]=1;
  else if(p=='g')I.g=1;
  else if(p=='c')I.d=1;
  else if(p=='p'||p=='k'){I[p]=1;f.plan='';}
  else if(p=='j'){I.u=1;I[to]=1;f.plan='a';}
  return I;
}

// === ROUNDS ===
function startRound(){
  P=mk(me,280,1);E=mk(foes[fi],620,-1);
  P.sp=1;E.sp=1;
  P.hp=P.mh;E.hp=E.mh;
  tm=ROUND_TIME;sp=[];
  comboCount=0;comboTimer=0;comboStr='';
  fatPhase=0;fatBar=0;fatActive=false;fatParticles=[];fatTimer=0;
  sc='intro';mt=1.8;
  msg='RONDA '+round+(foes[fi]===0?' - JEFE FINAL':'');
}

function startFight(){
  round=1;roundWinsP=0;roundWinsE=0;
  startRound();
}

// === FATALITY ===
function doFatality(){
  const ci=me; // Player's character
  fatParticles=[];

  switch(ci){
    case 0: // LINO-O as player - helicoptero kamikaze
    case -1:
      fatParticles.push({x:900,y:40,vx:-4,vy:1.2,t:0,life:3,type:'heli',col:'#ff2200',size:60,rot:0,targeting:false});
      for(let i=0;i<35;i++){
        fatParticles.push({
          x:E.x,y:G+E.y-80,
          vx:(Math.random()-0.5)*7,vy:-Math.random()*5-1,
          t:0,delay:1.5,life:2,type:'explosion',
          col:i%3==0?'#ff4400':i%3==1?'#ff9900':'#ffff00',
          size:15+Math.random()*25
        });
      }
      break;
    case 1: // ESGAY - ataque de ira / brutality
      for(let i=0;i<50;i++){
        const angle=Math.random()*Math.PI*2;
        const spd=2+Math.random()*8;
        fatParticles.push({
          x:E.x+(Math.random()-0.5)*40,y:G+E.y-90,
          vx:Math.cos(angle)*spd,vy:Math.sin(angle)*spd-3,
          t:-Math.random()*0.3,life:1.5+Math.random(),
          type:'rage',col:i%4==0?'#ff0000':i%4==1?'#ff4400':i%4==2?'#cc00ff':'#ff0088',
          size:8+Math.random()*20
        });
      }
      break;
    case 2: // CARTER - derrama whisky y prende fuego
      for(let i=0;i<40;i++){
        fatParticles.push({
          x:E.x+Math.random()*120-60,y:G+E.y-20,
          vx:(Math.random()-0.5)*2,vy:-Math.random()*4-0.5,
          t:-Math.random()*0.5,life:2.5+Math.random(),
          type:'fire',col:i%3==0?'#ff6600':i%3==1?'#ffaa00':'#ffff00',
          size:5+Math.random()*18,flicker:Math.random()
        });
      }
      break;
    case 3: // SANTI - llama por teléfono, cae bomba con estrella de David
      fatParticles.push({x:E.x,y:-30,vx:0,vy:3.5,t:0,life:2.2,type:'bomb',col:'#222',size:36});
      for(let i=0;i<25;i++){
        fatParticles.push({
          x:E.x,y:G+E.y-80,
          vx:(Math.random()-0.5)*6,vy:-Math.random()*5-1,
          t:0,delay:0.7,life:1.5,
          type:'explosion',col:i%2==0?'#ff8800':'#ffff00',
          size:12+Math.random()*22
        });
      }
      break;
    case 4: // VAZQUEZ - lluvia de guaraníes/billetes
      for(let i=0;i<60;i++){
        fatParticles.push({
          x:Math.random()*900,y:-30-Math.random()*120,
          vx:(Math.random()-0.5)*1.5,vy:2.5+Math.random()*3,
          t:0,life:4,type:'bill',
          col:i%3==0?'#90EE90':i%3==1?'#FFD700':'#4CAF50',
          size:16,rot:Math.random()*Math.PI*2
        });
      }
      // Final CRUSH boulder of bills
      fatParticles.push({x:E.x,y:-60,vx:0,vy:4.5,t:0,delay:0.8,life:2,type:'boulder',col:'#2d8a2d',size:70});
      break;
  }
  fatPhase=2;fatTimer=3.5;
  snd('fatality');
}

function updateFatParticles(){
  fatParticles.forEach(p=>{
    p.t+=DT;
    if(p.t<(p.delay||0))return;
    const relT=p.t-(p.delay||0);
    if(p.type=='heli'){
      // Helicopter homes toward enemy
      if(relT>0.8){
        p.vx+=(E.x-p.x)*0.015;
        p.vy+=(G+E.y-80-p.y)*0.015;
        p.rot+=0.15;
      }
      p.x+=p.vx;p.y+=p.vy;
    } else if(p.type=='bill'){
      p.x+=p.vx;p.y+=p.vy;
      p.rot+=0.05;
    } else if(p.type=='boulder'){
      p.y+=p.vy;p.vy+=0.2;
    } else if(p.type=='bomb'){
      p.y+=p.vy;
    } else if(p.type=='fire'){
      p.x+=p.vx;p.y+=p.vy-(0.5+Math.sin(relT*8+p.flicker)*0.3);
      p.vx*=0.98;
    } else {
      p.x+=p.vx;p.y+=p.vy;p.vy+=0.4;
    }
  });
}

function drawFatParticles(){
  fatParticles.forEach(p=>{
    const relT=p.t-(p.delay||0);
    if(relT<0)return;
    const alpha=Math.max(0,1-relT/p.life);
    ctx.globalAlpha=alpha;

    if(p.type=='bill'){
      ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot+p.t*1.5);
      ctx.fillStyle='#1a5c1a';ctx.fillRect(-p.size/2,-p.size/4,p.size,p.size/2);
      ctx.fillStyle=p.col;ctx.fillRect(-p.size/2+2,-p.size/4+2,p.size-4,p.size/2-4);
      ctx.fillStyle='#FFD700';ctx.font='9px sans-serif';ctx.textAlign='center';
      ctx.fillText('₲',0,3);ctx.restore();
    } else if(p.type=='boulder'){
      // Huge stack of bills falling
      ctx.fillStyle='#1a5c1a';ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#FFD700';ctx.font='bold 20px sans-serif';ctx.textAlign='center';
      ctx.fillText('₲₲₲',p.x,p.y+7);
    } else if(p.type=='heli'){
      ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot);
      // Body
      ctx.fillStyle='#cc0000';ctx.fillRect(-p.size/2,-p.size/4,p.size,p.size/2);
      // Windows
      ctx.fillStyle='#aaddff';ctx.fillRect(-p.size/4,-p.size/8,p.size/5,p.size/4);
      // Rotor (spinning)
      ctx.fillStyle='#aaa';
      ctx.save();ctx.rotate(p.t*15);
      ctx.fillRect(-p.size*0.8,-3,p.size*1.6,6);ctx.restore();
      // Fire trail
      ctx.fillStyle='rgba(255,100,0,0.9)';ctx.fillRect(p.size/2-5,-p.size/4,p.size/2,p.size/2);
      ctx.restore();
    } else if(p.type=='bomb'){
      ctx.fillStyle=p.col;ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);ctx.fill();
      // Fuse
      ctx.strokeStyle='#aaa';ctx.lineWidth=3;
      ctx.beginPath();ctx.moveTo(p.x,p.y-p.size);ctx.quadraticCurveTo(p.x+20,p.y-p.size-20,p.x+15,p.y-p.size-35);ctx.stroke();
      // Spark
      ctx.fillStyle='#ff0';ctx.beginPath();ctx.arc(p.x+15,p.y-p.size-35,5+Math.sin(p.t*20)*3,0,Math.PI*2);ctx.fill();
      // Star of David (✡)
      ctx.fillStyle='#4169E1';ctx.font='bold '+(p.size*0.9)+'px serif';
      ctx.textAlign='center';ctx.fillText('✡',p.x,p.y+p.size*0.35);
    } else if(p.type=='explosion'){
      const r=p.size*(1-relT/p.life)*0.8+3;
      ctx.fillStyle=p.col;ctx.beginPath();ctx.arc(p.x,p.y,r,0,Math.PI*2);ctx.fill();
    } else if(p.type=='fire'){
      const r=(p.size*(1-relT/p.life)*0.6+2);
      ctx.fillStyle=p.col;ctx.beginPath();ctx.arc(p.x,p.y,r,0,Math.PI*2);ctx.fill();
    } else {
      // rage / generic
      const r=p.size*(1-relT/p.life)*0.5+2;
      ctx.fillStyle=p.col;ctx.beginPath();ctx.arc(p.x,p.y,r,0,Math.PI*2);ctx.fill();
    }
    ctx.globalAlpha=1;
  });
}

// === FIN DE ROUND ===
function finRound(){
  stopBgMusic();
  let winner;
  if(E.hp<=0){winner='P';roundWinsP++;}
  else if(P.hp<=0){winner='E';roundWinsE++;}
  else{
    if(P.hp>E.hp){winner='P';roundWinsP++;}
    else if(E.hp>P.hp){winner='E';roundWinsE++;}
    else{winner='draw';}
  }
  roundResult=winner;

  if(winner=='P'){setS(E,'ko');setS(P,'win');msg='K.O.';}
  else if(winner=='E'){setS(P,'ko');setS(E,'win');msg='K.O.';}
  else{msg='EMPATE';}

  shake=12;snd('ko');

  if(winner=='P'&&(roundWinsP>=2||round>=MAX_ROUNDS)){
    // Player won the FIGHT — trigger fatality
    fatPhase=0;fatBar=0;fatActive=true;fatTimer=4.5;
    sc='fatready';mt=0;
  } else if(winner=='P'){
    // Player won this round but not the fight yet
    round++;
    sc='roundend';mt=2.5;
  } else if(roundWinsE>=2||round>=MAX_ROUNDS){
    // Enemy won the fight
    sc='end';mt=2.6;
  } else {
    // Enemy won this round, next round
    round++;
    sc='roundend';mt=2.5;
  }
}

// Called after fatality animation to check if fight continues
function afterFatality(){
  if(roundWinsP>=2||round>=MAX_ROUNDS){
    // Player won the fight
    playerScore+=10000;
    fi++;
    if(fi>=foes.length){
      // All enemies defeated! Check if boss is in foes
      const defeatedBoss=foes.includes(0);
      if(defeatedBoss){
        // Full game clear!
        bossUnlocked=true;
        try{localStorage.setItem('sf_boss','1');}catch(e){}
        sc='ranking';mt=0;
      } else {
        // Defeated all non-boss foes (shouldn't happen with current setup)
        sc='win';mt=1;
      }
    } else {
      round=1;roundWinsP=0;roundWinsE=0;startRound();
    }
  } else {
    // Player won round but not fight yet
    round++;
    roundWinsP=0; // Actually keep the win... wait, 2-round system
    // We already incremented roundWinsP in finRound, just start next round
    sc='roundend';mt=2.5;
  }
}

// === STEP ===
function step(){
  bl+=DT;mt-=DT;
  if(comboTimer>0){comboTimer-=DT;if(comboTimer<=0){comboStr='';comboCount=0;}}

  document.body.classList.toggle('f',
    sc=='intro'||sc=='fight'||sc=='end'||sc=='roundend'||
    sc=='fatready'||sc=='fatality'||sc=='fatend'||sc=='ranking');

  if(sc=='intro'){
    upd(P,E,{});upd(E,P,{});
    if(mt<=0){sc='fight';startBgMusic();}
  }
  else if(sc=='fight'){
    tm-=DT;
    const I={l:K.l,r:K.r,u:K.u,d:K.d,g:K.g,p:T.p||T.pcombo,k:T.k||T.kcombo};
    T.p=T.k=T.pcombo=T.kcombo=0;
    upd(P,E,I);upd(E,P,ai(E,P,LV[Math.min(fi,3)]));
    // Keep fighters apart
    const dd=Math.abs(P.x-E.x);
    if(dd<80&&P.y>=0&&E.y>=0){const s=(80-dd)/2*(P.x<E.x?1:-1);P.x-=s;E.x+=s;}
    if(tm<=0){if(P.hp>=E.hp)E.hp=0;else P.hp=0;}
    if(P.hp<=0||E.hp<=0)finRound();
  }
  else if(sc=='roundend'){
    if(mt<=0){startRound();}
  }
  else if(sc=='fatready'){
    // Don't call upd() here — HP is 0, would re-trigger finRound
    if(T.fat){
      fatBar=Math.min(100,fatBar+7);
      snd('fatbar');
      T.fat=0;
    }
    fatTimer-=DT;
    if(fatBar>=100){doFatality();sc='fatality';mt=4.5;}
    else if(fatTimer<=0){
      // Time expired — skip fatality, advance
      afterFatality();
    }
  }
  else if(sc=='fatality'){
    updateFatParticles();
    if(mt<=0){sc='fatend';mt=1.8;}
  }
  else if(sc=='fatend'){
    updateFatParticles();
    if(mt<=0){afterFatality();}
  }
  else if(sc=='end'){
    upd(P,E,{});upd(E,P,{});
    if(mt<=0){
      if(roundWinsP>roundWinsE){
        // Should have been handled through fatready, but fallback
        playerScore+=10000;fi++;
        if(fi>=foes.length){
          sc=foes.includes(0)?'ranking':'win';mt=1;
          if(foes.includes(0)){bossUnlocked=true;try{localStorage.setItem('sf_boss','1');}catch(e){}}
        } else {round=1;roundWinsP=0;roundWinsE=0;startRound();}
      } else {sc='lose';mt=1;}
    }
  }

  sp.forEach(s=>s.t+=DT);sp=sp.filter(s=>s.t<.25);
  shake*=.85;
}

// === SPRITES & DRAWING ===
function fname(f){
  const s=f.st;
  if(s=='atk')return f.t<f.wind?'ready':(f.air?'k1':f.type+(f.idx+1));
  if(s=='walk')return Math.floor(f.t*7)%2?'walk':(f.vx*f.face>0?'run':'idle');
  if(s=='ko')return f.t<.4?'hit':'hurt';
  return{idle:'idle',crouch:'crouch',guard:'guard',jump:'jump',hit:'hit',win:'win'}[s]||'idle';
}

function imgReady(img){return img&&img.complete&&img.naturalWidth>0&&img.naturalHeight>0;}
function spr(c,n,x,y,face){
  const r=c.fr[n];if(!r)return;
  if(!imgReady(c.A))return;
  ctx.fillStyle='rgba(0,0,0,.35)';ctx.beginPath();ctx.ellipse(x,G+2,60-Math.min(30,-y/4),9,0,0,7);ctx.fill();
  ctx.save();ctx.translate(x,G+y);ctx.scale(face,1);
  try{ctx.drawImage(c.A,r[0],D.ah-r[2],r[1],r[2],-r[3],-r[2],r[1],r[2]);}catch(e){}
  ctx.restore();
}

const PAL=[['#1b2a6b','#f08a4b'],['#2b1b52','#e0589a'],['#0e4a5c','#78d6c8'],['#2a4fb0','#cfe3ff']];
const BG={};
function mkBg(i){
  const c=document.createElement('canvas');c.width=900;c.height=450;const x=c.getContext('2d');
  let g=x.createLinearGradient(0,0,0,370);g.addColorStop(0,PAL[i%4][0]);g.addColorStop(1,PAL[i%4][1]);
  x.fillStyle=g;x.fillRect(0,0,900,450);
  if(i==3){
    x.fillStyle='rgba(255,255,255,.75)';
    for(let k=0;k<14;k++){const cx=(k*137)%900,cy=60+(k*53)%260;x.beginPath();x.ellipse(cx,cy,70+k%3*20,16+k%4*5,0,0,7);x.fill();}
  } else {
    for(let k=0;k<16;k++){
      const h=70+(k*53)%120,w=56;
      x.fillStyle='rgba(8,8,30,.7)';x.fillRect(k*58,365-h,w,h);
      x.fillStyle='rgba(255,220,90,.8)';
      for(let a=0;a<h-12;a+=16)for(let b=6;b<w-6;b+=14)if((a*7+b*3+k)%5<2)x.fillRect(k*58+b,365-h+a+8,5,7);
    }
  }
  g=x.createLinearGradient(0,365,0,450);g.addColorStop(0,i==3?'#c9d8f2':'#3a3550');g.addColorStop(1,i==3?'#8fa6d6':'#14121f');
  x.fillStyle=g;x.fillRect(0,365,900,85);
  x.fillStyle='rgba(255,255,255,.15)';for(let k=0;k<10;k++)x.fillRect(0,372+k*k*.9,900,2);
  return c;
}

function tx(s,x,y,z,col,al){
  ctx.font=z+'px "Press Start 2P",monospace';ctx.textAlign=al||'center';
  ctx.fillStyle='rgba(0,0,0,0.6)';ctx.fillText(s,x+2,y+2);
  ctx.fillStyle=col||'#fff';ctx.fillText(s,x,y);
}

function bar(x,f,r){
  const w=330,l=r?x-w:x,v=Math.max(0,f.hp/f.mh);
  ctx.fillStyle='#000';ctx.fillRect(l-4,18,w+8,26);
  ctx.fillStyle='#600';ctx.fillRect(l,22,w,18);
  ctx.fillStyle=v>.5?'#2ecc40':v>.3?'#f2c200':'#f33';ctx.fillRect(r?x-w*v:x,22,w*v,18);
  ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.strokeRect(l-3,19,w+6,24);
}

