function drawRoundDots(x,wins,flip){
  for(let i=0;i<MAX_ROUNDS;i++){
    const cx=flip?x-(i*22):x+(i*22);
    ctx.beginPath();ctx.arc(cx,10,7,0,Math.PI*2);
    ctx.fillStyle=i<wins?'#FFD700':'#333';ctx.fill();
    ctx.strokeStyle='#888';ctx.lineWidth=1;ctx.stroke();
  }
}

function drawComboHUD(){
  if(comboCount>=2&&comboTimer>0){
    const a=Math.min(1,comboTimer/0.5);
    ctx.globalAlpha=a;
    ctx.font='14px "Press Start 2P",monospace';ctx.textAlign='left';
    ctx.fillStyle='#000';ctx.fillText(comboCount+' HITS',72,440);
    ctx.fillStyle='#ff9900';ctx.fillText(comboCount+' HITS',70,438);
    if(comboStr){
      ctx.font='11px "Press Start 2P",monospace';
      ctx.fillStyle='#000';ctx.fillText(comboStr,72,420);
      ctx.fillStyle='#FFD700';ctx.fillText(comboStr,70,418);
    }
    ctx.globalAlpha=1;
  }
}

function drawFatBar(){
  if(sc!='fatready')return;
  const y=400,blink=Math.floor(bl*5)%2;
  // Red vignette flash
  ctx.fillStyle='rgba(180,0,0,'+(0.08+Math.sin(bl*10)*0.06)+')';
  ctx.fillRect(0,0,900,450);
  // Bar
  ctx.fillStyle='rgba(0,0,0,0.75)';ctx.fillRect(250,y-24,400,38);
  ctx.fillStyle='#1a0000';ctx.fillRect(254,y-20,392,30);
  const pct=fatBar/100;
  const gr=ctx.createLinearGradient(254,0,646,0);
  gr.addColorStop(0,'#ff0000');gr.addColorStop(0.5,'#ff6600');gr.addColorStop(1,'#ffff00');
  ctx.fillStyle=gr;ctx.fillRect(254,y-20,392*pct,30);
  if(pct>0.9){ctx.fillStyle='rgba(255,255,255,0.3)';ctx.fillRect(254,y-20,392*pct,30);}
  ctx.strokeStyle='#ff4400';ctx.lineWidth=2;ctx.strokeRect(252,y-22,396,34);

  if(blink){
    ctx.font='9px "Press Start 2P",monospace';ctx.textAlign='center';
    ctx.fillStyle='#FFD700';ctx.fillText('¡PRESIONA RÁPIDO! — FATALITY',450,y-30);
  }
  // Timer bar (shrinking)
  const tPct=Math.max(0,fatTimer/4.5);
  ctx.fillStyle='rgba(255,255,255,0.15)';ctx.fillRect(254,y+14,392*tPct,6);
}

function drawScoreHUD(){
  // Top right score during fight
  if(sc=='fight'||sc=='intro'||sc=='fatready'||sc=='fatality'||sc=='fatend'||sc=='roundend'){
    ctx.font='9px "Press Start 2P",monospace';ctx.textAlign='right';
    ctx.fillStyle='rgba(0,0,0,0.5)';ctx.fillText(playerScore.toLocaleString(),832,86);
    ctx.fillStyle='#aaffaa';ctx.fillText(playerScore.toLocaleString(),830,84);
  }
}

// === RANKING SCREEN ===
let rankInputActive=false,rankNameInput='';
function drawRanking(){
  ctx.fillStyle='#0a0a1a';ctx.fillRect(0,0,900,450);
  // Starfield
  for(let i=0;i<40;i++){
    const x=(i*137+bl*20)%900,y=(i*73)%420;
    ctx.fillStyle='rgba(255,255,255,'+(0.3+Math.sin(bl*2+i)*0.3)+')';
    ctx.beginPath();ctx.arc(x,y,1,0,Math.PI*2);ctx.fill();
  }
  tx('¡VICTORIA TOTAL!',450,55,22,'#FFD700');
  tx('JEFE FINAL DERROTADO',450,85,11,'#ff6');

  // Player score big
  ctx.font='28px "Press Start 2P",monospace';ctx.textAlign='center';
  ctx.fillStyle='#000';ctx.fillText(playerScore.toLocaleString(),452,132);
  ctx.fillStyle='#2ecc40';ctx.fillText(playerScore.toLocaleString(),450,130);
  tx('PUNTOS',450,158,10,'#aaa');

  // Name input area
  ctx.fillStyle='rgba(255,255,255,0.08)';ctx.fillRect(200,170,500,60);
  ctx.strokeStyle='#ffd400';ctx.lineWidth=2;ctx.strokeRect(200,170,500,60);
  tx('INGRESA TU NOMBRE:',450,195,9,'#ffd400');
  const displayName=(rankNameInput||'_')+(Math.floor(bl*2)%2?'█':'');
  tx(displayName,450,218,14,'#fff');

  // Buttons
  const btnY=250;
  // SAVE button
  ctx.fillStyle=rankNameInput.length>0?'#1a6e1a':'#333';
  ctx.fillRect(220,btnY,200,45);
  ctx.strokeStyle='#2ecc40';ctx.lineWidth=2;ctx.strokeRect(220,btnY,200,45);
  tx('GUARDAR',320,btnY+28,11,'#2ecc40');

  // CONTINUE button
  ctx.fillStyle='#1a1a6e';ctx.fillRect(480,btnY,200,45);
  ctx.strokeStyle='#4488ff';ctx.lineWidth=2;ctx.strokeRect(480,btnY,200,45);
  tx('CONTINUAR',580,btnY+28,10,'#4488ff');

  // Top scores
  tx('- MEJORES PUNTAJES -',450,315,9,'#ffd400');
  const topScores=savedScores.slice(0,5);
  topScores.forEach((s,i)=>{
    const col=i==0?'#FFD700':i==1?'#C0C0C0':i==2?'#CD7F32':'#aaa';
    tx((i+1)+'. '+s.name,310,338+i*22,8,col,'left');
    tx(s.score.toLocaleString(),640,338+i*22,8,col,'right');
  });

  // Keyboard hint
  if(Math.floor(bl*2)%2)tx('ESCRIBE TU NOMBRE • ENTER=GUARDAR • ESPACIO=CONTINUAR',450,440,7,'#555');
}

function drawTitleScores(){
  if(savedScores.length==0)return;
  tx('RECORDS:',450,330,8,'#ffd400');
  const top=savedScores.slice(0,3);
  top.forEach((s,i)=>{
    const col=i==0?'#FFD700':i==1?'#C0C0C0':'#CD7F32';
    tx((i+1)+'. '+s.name+' - '+s.score.toLocaleString(),450,350+i*18,7,col);
  });
}

function draw(){
  ctx.setTransform(1,0,0,1,0,0);
  cv.width=LW;cv.height=LH;
  ctx.clearRect(0,0,LW,LH);

  imgs=countImgs(); // recount every frame — base64 images may load synchronously
  if(imgs<need){
    ctx.fillStyle='#0a0a1a';ctx.fillRect(0,0,LW,LH);
    // Title
    tx('SANTI',450,120,46,'#ffd400');
    tx('FIGHTERS',450,182,42,'#ff3b3b');
    // Progress bar
    const pct=need>0?imgs/need:0;
    const bw=400,bh=24,bx=(LW-bw)/2,by=240;
    ctx.fillStyle='#111';ctx.fillRect(bx-2,by-2,bw+4,bh+4);
    ctx.fillStyle='#222';ctx.fillRect(bx,by,bw,bh);
    const gr=ctx.createLinearGradient(bx,0,bx+bw,0);
    gr.addColorStop(0,'#ff3b3b');gr.addColorStop(0.5,'#ffd400');gr.addColorStop(1,'#2ecc40');
    ctx.fillStyle=gr;ctx.fillRect(bx,by,bw*pct,bh);
    ctx.strokeStyle='#555';ctx.lineWidth=1;ctx.strokeRect(bx-2,by-2,bw+4,bh+4);
    // Percentage
    tx(Math.floor(pct*100)+'%',LW/2,by+bh+22,11,'#aaa');
    tx('CARGANDO LUCHADORES...',LW/2,by-14,8,'#555');
    // Animated dots
    const dots='.'.repeat((Math.floor(bl*3)%4));
    tx('ESPERA'+dots,LW/2,by+bh+42,8,'#444');
    return;
  }

  ctx.save();
  if(shake>.5)ctx.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake);

  const inFight=sc=='fight'||sc=='intro'||sc=='end'||sc=='roundend'||sc=='fatready'||sc=='fatality'||sc=='fatend';
  const bi=inFight?Math.min(fi,3):3;
  if(!BG[bi])BG[bi]=mkBg(bi);
  ctx.drawImage(BG[bi],0,0);

  if(sc=='title'){
    // Animated title characters
    for(let i=1;i<=4;i++){
      const off=Math.sin(bl*2+i)*5;
      spr(D.c[i],'idle',90+i*180,off,i<3?1:-1);
    }
    tx('SANTI',450,100,46,'#ffd400');
    tx('FIGHTERS',450,162,42,'#ff3b3b');
    if(Math.floor(bl*2)%2)tx('TOCA PARA COMENZAR',450,235,12,'#fff');
    // Show boss unlocked hint
    if(bossUnlocked)tx('★ LINO-O DESBLOQUEADO ★',450,262,9,'#ff4444');
    drawTitleScores();
  }
  else if(sc=='select'){
    tx('ELIGE TU LUCHADOR',450,55,18,'#ffd400');
    const total=bossUnlocked?5:4;
    for(let i=0;i<5;i++){
      const cx=45+i*165;
      const isLocked=i==4&&!bossUnlocked;
      ctx.fillStyle=isLocked?'#111':'#0a0a2a';
      ctx.fillRect(cx-3,100,158,215);
      if(!isLocked){
        const chi=i<4?i+1:0;
        if(imgReady(D.c[chi].P))ctx.drawImage(D.c[chi].P,cx,105,150,150);
        tx(D.c[chi].n,cx+75,282,9,'#fff');
        // No difficulty stars — all equal, order determines difficulty
      } else {
        ctx.fillStyle='#111';ctx.fillRect(cx,105,150,150);
        ctx.fillStyle='rgba(0,0,0,.85)';ctx.fillRect(cx,105,150,150);
        tx('?',cx+75,195,42,'#555');tx('???',cx+75,268,8,'#555');tx('DERROTA AL JEFE',cx+75,285,7,'#444');
      }
      ctx.strokeStyle=isLocked?'#333':'#ffd400';ctx.lineWidth=3;ctx.strokeRect(cx-3,100,158,215);
    }
    tx('¡DERROTA A TODOS Y AL JEFE FINAL!',450,345,9,'#aaa');
    if(playerScore>0)tx('PUNTAJE: '+playerScore.toLocaleString(),450,368,8,'#2ecc40');
  }
  else if(sc=='win'){
    spr(P.c,'win',350,0,1);
    spr(D.c[0],'hurt',650,0,-1);
    tx('¡VICTORIA TOTAL!',450,80,24,'#FFD700');
    tx('¡JEFE FINAL DERROTADO!',450,118,12,'#ff6');
    tx('★ LINO-O DESBLOQUEADO COMO LUCHADOR ★',450,145,8,'#ff4444');
    if(mt<0&&Math.floor(bl*2)%2)tx('TOCA PARA CONTINUAR',450,180,11,'#fff');
  }
  else if(sc=='lose'){
    spr(P.c,'hurt',450,0,1);
    tx('GAME OVER',450,100,36,'#f33');
    tx('PUNTAJE: '+playerScore.toLocaleString(),450,155,13,'#ff6');
    if(mt<0&&Math.floor(bl*2)%2)tx('TOCA PARA CONTINUAR',450,195,11,'#fff');
  }
  else if(sc=='ranking'){
    drawRanking();
  }
  else{
    // Fight scenes
    [P,E].forEach(f=>spr(f.c,fname(f),f.x,f.y,f.face));

    // Hit sparks
    sp.forEach(s=>{
      const k=s.t/.25,r=14+k*26;
      ctx.fillStyle=s.b?'#9cf':'#ff0';
      for(let a=0;a<8;a++){
        const an=a*Math.PI/4;
        ctx.fillRect(s.x+Math.cos(an)*r-4,s.y+Math.sin(an)*r-4,(8*(1-k)+2),(8*(1-k)+2));
      }
    });

    // Fatality particles
    if(sc=='fatality'||sc=='fatend')drawFatParticles();

    // HUD
    bar(70,P,0);bar(830,E,1);
    if(imgReady(P.c.P))ctx.drawImage(P.c.P,18,12,46,46);
    if(imgReady(E.c.P))ctx.drawImage(E.c.P,836,12,46,46);
    tx(P.c.n,70,66,8,'#fff','left');tx(E.c.n,830,66,8,'#fff','right');

    // Timer
    const timeLeft=Math.max(0,Math.ceil(tm));
    const tCol=timeLeft<=10?'#f33':timeLeft<=30?'#ff0':'#fff';
    ctx.font='20px "Press Start 2P",monospace';ctx.textAlign='center';
    ctx.fillStyle='rgba(0,0,0,0.6)';ctx.fillText(timeLeft,452,52);
    ctx.fillStyle=tCol;ctx.fillText(timeLeft,450,50);

    // Round dots
    drawRoundDots(380,roundWinsP,false);
    drawRoundDots(520,roundWinsE,true);
    tx('R'+round,450,70,8,'#aaa');

    if(sc=='intro'){
      ctx.fillStyle='rgba(0,0,0,0.5)';ctx.fillRect(0,80,900,120);
      tx(msg,450,145,20,E.c===D.c[0]?'#ff4':'#ffd400');
      if(mt<.8)tx('¡PELEA!',450,195,30,'#f33');
    }
    if(sc=='end'||sc=='roundend'){
      ctx.fillStyle='rgba(0,0,0,0.5)';ctx.fillRect(0,130,900,100);
      tx(roundResult=='P'?'K.O.':roundResult=='E'?'K.O.':'EMPATE',450,195,44,'#f33');
      if(sc=='roundend'&&mt>0.8)tx('RONDA '+round+' EN BREVE...',450,250,11,'#aaa');
    }
    if(sc=='fatready'){
      // Dark overlay
      ctx.fillStyle='rgba(0,0,0,0.6)';ctx.fillRect(0,70,900,120);
      tx('¡FINISH HIM!',450,110,30,'#ff0000');
      tx('¡FATALITY!',450,152,22,'#ff4400');
      drawFatBar();
    }
    if(sc=='fatality'){
      ctx.fillStyle='rgba(0,0,0,0.65)';ctx.fillRect(0,0,900,450);
      const names={1:'¡BRUTALITY!',2:'¡INFERNO!',3:'¡BOMBARDEO!',4:'¡AVALANCHA DE GUARANÍES!'};
      tx(me===0?'¡KAMIKAZE!':names[me]||'¡FATALITY!',450,110,me===4?14:22,'#ff0000');
      ctx.globalAlpha=0.4+Math.sin(bl*8)*0.1;
      ctx.fillStyle='#ff0000';ctx.fillRect(0,0,900,450);
      ctx.globalAlpha=1;
    }
    if(sc=='fatend'){
      ctx.fillStyle='rgba(0,0,0,0.3)';ctx.fillRect(0,0,900,450);
      tx('¡PERFECTO!',450,180,34,'#FFD700');
      tx('+10,000 PUNTOS',450,220,11,'#2ecc40');
    }

    drawComboHUD();
    drawScoreHUD();
  }
  ctx.restore();
}

let last=0,acc=0;
function loop(t){
  requestAnimationFrame(loop);
  acc+=Math.min(.05,(t-last)/1000);last=t;
  while(acc>=DT){step();acc-=DT;}
  draw();
}
requestAnimationFrame(loop);

function fs(){
  try{document.documentElement.requestFullscreen&&document.documentElement.requestFullscreen();
    screen.orientation&&screen.orientation.lock&&screen.orientation.lock('landscape').catch(()=>{});
  }catch(e){}
}

// === INPUT ===
const K={},T={};

cv.addEventListener('pointerdown',e=>{
  aud();
  if(imgs<need)return;
  const r=cv.getBoundingClientRect();
  const x=(e.clientX-r.left)*LW/r.width,y=(e.clientY-r.top)*LH/r.height;

  if(sc=='title'){sc='select';snd('select');fs();return;}
  if(sc=='select'){
    for(let i=0;i<(bossUnlocked?5:4);i++){
      const cx=45+i*165;
      if(x>cx-3&&x<cx+155&&y>100&&y<315){
        const chi=i<4?i+1:0;
        me=chi;
        const pool=bossUnlocked?[0,1,2,3,4]:[1,2,3,4];
        foes=pool.filter(j=>j!==me);
        // Boss always last
        if(!foes.includes(0))foes.push(0);
        // Shuffle non-boss opponents
        const nonBoss=foes.filter(j=>j!==0);
        for(let n=nonBoss.length-1;n>0;n--){const r=Math.floor(Math.random()*(n+1));[nonBoss[n],nonBoss[r]]=[nonBoss[r],nonBoss[n]];}
        foes=[...nonBoss,0];
        fi=0;playerScore=playerScore; // keep score
        startFight();snd('select');
      }
    }
    return;
  }
  if(sc=='win'){
    if(mt<-.2){foes=[];fi=0;roundWinsP=0;roundWinsE=0;round=1;sc='title';stopBgMusic();}
    return;
  }
  if(sc=='lose'){
    if(mt<-.2){sc='title';stopBgMusic();}
    return;
  }
  if(sc=='ranking'){
    // Check button clicks
    if(x>480&&x<680&&y>250&&y<295){
      // CONTINUE FIGHTING — keep score, go to select
      sc='select';stopBgMusic();
    } else if(x>220&&x<420&&y>250&&y<295&&rankNameInput.length>0){
      // SAVE
      savedScores.push({name:rankNameInput,score:playerScore});
      savedScores.sort((a,b)=>b.score-a.score);
      savedScores=savedScores.slice(0,10);
      try{localStorage.setItem('sf_scores',JSON.stringify(savedScores));}catch(e){}
      rankNameInput='';
    }
  }
  if(sc=='fatready'){T.fat=1;}
});

// Touch buttons
document.querySelectorAll('.b').forEach(b=>{
  const k=b.dataset.k,atk=k=='p'||k=='k';
  const dn=e=>{
    e.preventDefault();
    try{b.releasePointerCapture(e.pointerId);}catch(_){}
    b.classList.add('on');
    if(sc=='fatready'){T.fat=1;return;}
    if(atk)T[k]=1;else K[k]=1;
  };
  const up=()=>{b.classList.remove('on');if(!atk)K[k]=0;};
  b.addEventListener('pointerdown',dn);
  b.addEventListener('pointerenter',e=>{if(e.buttons)dn(e);});
  ['pointerup','pointercancel','pointerleave'].forEach(n=>b.addEventListener(n,up));
});

// Keyboard
const KM={ArrowLeft:'l',a:'l',ArrowRight:'r',d:'r',ArrowUp:'u',w:'u',
  ArrowDown:'d',s:'d',l:'g',c:'g',j:'p',z:'p',k:'k',x:'k',f:'fat',Enter:'fat',' ':'fat'};
onkeydown=e=>{
  // Ranking screen name input
  if(sc=='ranking'){
    if(e.key==' '){
      // Space = continue without saving
      sc='select';stopBgMusic();e.preventDefault();return;
    }
    if(e.key==='Enter'){
      if(rankNameInput.length>0){
        savedScores.push({name:rankNameInput,score:playerScore});
        savedScores.sort((a,b)=>b.score-a.score);
        savedScores=savedScores.slice(0,10);
        try{localStorage.setItem('sf_scores',JSON.stringify(savedScores));}catch(e){}
        rankNameInput='';
      }
      return;
    }
    if(e.key==='Backspace'){rankNameInput=rankNameInput.slice(0,-1);return;}
    if(e.key.length===1&&rankNameInput.length<10){rankNameInput+=e.key.toUpperCase();return;}
  }
  const k=KM[e.key];if(!k)return;
  if(k=='p'||k=='k'){if(!e.repeat)T[k]=1;}
  else if(k=='fat'){if(!e.repeat)T.fat=1;}
