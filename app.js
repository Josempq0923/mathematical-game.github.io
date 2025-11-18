/*********************** Helpers y estado ************************/
const app = document.getElementById('app');
const funcType = document.getElementById('funcType');
const aRange = document.getElementById('aRange');
const bRange = document.getElementById('bRange');
const cRange = document.getElementById('cRange');
const dRange = document.getElementById('dRange');
const aVal = document.getElementById('aVal');
const bVal = document.getElementById('bVal');
const cVal = document.getElementById('cVal');
const dVal = document.getElementById('dVal');
const mainChartCtx = document.getElementById('mainChart').getContext('2d');
const graphTitle = document.getElementById('graphTitle');

// Game elements
const modeSelect = document.getElementById('modeSelect');
const startGameBtn = document.getElementById('startGameBtn');
const optionsEl = document.getElementById('options');
const gameEquation = document.getElementById('gameEquation');
const countdownEl = document.getElementById('countdown');
const levelDisplay = document.getElementById('levelDisplay');
const scoreDisplay = document.getElementById('scoreDisplay');

const hcBtn = document.getElementById('hcBtn');
const lscBtn = document.getElementById('lscBtn');
const lscModal = document.getElementById('lscModal');
const closeLsc = document.getElementById('closeLsc');
const finalModal = document.getElementById('finalModal');
const finalScoreEl = document.getElementById('finalScore');
const closeFinal = document.getElementById('closeFinal');
const pauseGameBtn = document.getElementById('pauseGameBtn');
const restartGameBtn = document.getElementById('restartGameBtn');

// State
let chart;
let state = {
  func:'linear',
  a:parseFloat(aRange.value),
  b:parseFloat(bRange.value),
  c:parseFloat(cRange.value),
  d:parseFloat(dRange.value),
  hc:false
};

// Game state
let game = {running:false,level:1,score:0,target:null,options:[],timer:45,intervalId:null,optionCharts:[],paused:false,correctCount:0,incorrectCount:0,goodPoints:0,badPoints:0};

/*********************** Graficación ************************/
function sampleXFor(type){
  if(type==='logarithmic'){
    const xs=[]; for(let x=0.1;x<=10;x+=0.2) xs.push(parseFloat(x.toFixed(3))); return xs;
  }
  const xs=[]; for(let x=-10;x<=10;x+=0.2) xs.push(parseFloat(x.toFixed(3))); return xs;
}

function computeY(type,p,x){
  const a=p.a, b=p.b, c=p.c, d=p.d;
  if(type==='linear') return a*x + b;
  if(type==='quadratic') return a*x*x + b*x + c;
  if(type==='cubic') return a*x*x*x + b*x*x + c*x + d;
  if(type==='quartic') return a*Math.pow(x,4) + b*Math.pow(x,3) + c*Math.pow(x,2) + d*x;
  if(type==='exponential') return a * Math.exp(b*x) + c;
  if(type==='logarithmic'){
    if(b*x <= 0) return NaN; // fuera de dominio
    return a * Math.log(b*x) + c;
  }
  return 0;
}

function buildDataset(type,p){
  const xs = sampleXFor(type);
  const ys = xs.map(x=>{
    const y = computeY(type,p,x);
    return (isFinite(y) ? y : null);
  });
  return {xs, ys};
}

function updateChart(){
  const p = {a:state.a,b:state.b,c:state.c,d:state.d};
  const ds = buildDataset(state.func,p);
  graphTitle.textContent = titleFor(state.func,p);

  const data = {
    // use numeric (x,y) points so Chart.js can render a linear numeric X axis
    datasets: [{
      label: graphTitle.textContent,
      data: ds.xs.map((x,i)=>({ x: x, y: ds.ys[i] })),
      borderColor: state.hc ? '#ffff00' : 'rgba(255,107,107,0.95)',
      backgroundColor: 'rgba(255,107,107,0.12)',
      pointRadius: 0,
      spanGaps: true
    }]
  };

  const options = {
    animation: false,
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: 'linear',
        display: true,
        min: -10,
        max: 10,
        offset: false,
        position: 'center', // eje Y en X=0
        title: { display: true, text: 'X', color: state.hc ? '#ffff00' : '#ffd166', font: { weight: 'bold', size: 18 } },
        grid: {
          color: state.hc ? '#ffff00' : '#50688a',
          lineWidth: 1,
          drawTicks: true,
          drawOnChartArea: true,
          zeroLineColor: state.hc ? '#ffff00' : '#ffd166',
          zeroLineWidth: 2
        },
        ticks: {
          color: state.hc ? 'white' : '#cbd5e1',
          font: { size: 14 },
          stepSize: 1,
          callback: function(value) { return Number(value).toFixed(0); },
          min: -10,
          max: 10,
          autoSkip: false,
          maxTicksLimit: 21
        },
        border: { color: state.hc ? '#ffff00' : '#50688a', width: 2 }
      },
      y: {
        display: true,
        min: -10,
        max: 10,
        title: { display: true, text: 'Y', color: state.hc ? '#ffff00' : '#ffd166', font: { weight: 'bold', size: 18 } },
        grid: {
          color: state.hc ? '#ffff00' : '#50688a',
          lineWidth: 1,
          drawTicks: true,
          drawOnChartArea: true,
          zeroLineColor: state.hc ? '#ffff00' : '#ffd166',
          zeroLineWidth: 2
        },
        ticks: {
          color: state.hc ? 'white' : '#cbd5e1',
          font: { size: 14 },
          stepSize: 1,
          callback: function(value) { return Number(value).toFixed(0); },
          min: -10,
          max: 10
        },
        border: { color: state.hc ? '#ffff00' : '#50688a', width: 2 },
        position: 'center' // <-- eje X en Y=0
      }
    },
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true }
    }
  };

  if(chart){ chart.data = data; chart.options = options; chart.update(); }
  else chart = new Chart(mainChartCtx, {type:'line',data,options});
}

function titleFor(type,p){
  const a=p.a.toFixed(2), b=p.b.toFixed(2), c=p.c.toFixed(2), d=p.d.toFixed(2);
  switch(type){
    case 'linear': return `y = ${a} x + ${b}`;
    case 'quadratic': return `y = ${a} x^2 + ${b} x + ${c}`;
    case 'cubic': return `y = ${a} x^3 + ${b} x^2 + ${c} x + ${d}`;
    case 'quartic': return `y = ${a} x^4 + ${b} x^3 + ${c} x^2 + ${d} x`;
    case 'exponential': return `y = ${a} · e^{(${b} x)} + ${c}`;
    case 'logarithmic': return `y = ${a} · log(${b} x) + ${c}`;
  }
}

/*********************** Controles UI ************************/
function syncStateFromUI(){
  state.a = parseFloat(aRange.value);
  state.b = parseFloat(bRange.value);
  state.c = parseFloat(cRange.value);
  state.d = parseFloat(dRange.value);
  aVal.textContent = state.a.toFixed(2);
  bVal.textContent = state.b.toFixed(2);
  cVal.textContent = state.c.toFixed(2);
  dVal.textContent = state.d.toFixed(2);
  state.func = funcType.value;
  // hide unused sliders
  document.getElementById('cRow').style.display = (['quadratic','cubic','quartic','exponential','logarithmic'].includes(state.func)) ? 'block' : 'none';
  document.getElementById('dRow').style.display = (['cubic','quartic'].includes(state.func)) ? 'block' : 'none';
  updateChart();
}

aRange.addEventListener('input',()=>{syncStateFromUI();});
bRange.addEventListener('input',()=>{syncStateFromUI();});
cRange.addEventListener('input',()=>{syncStateFromUI();});
dRange.addEventListener('input',()=>{syncStateFromUI();});
funcType.addEventListener('change',()=>{syncStateFromUI();});

document.getElementById('resetBtn').addEventListener('click',()=>{
  aRange.value=1; bRange.value=0; cRange.value=0; dRange.value=0; syncStateFromUI();
});
document.getElementById('randomBtn').addEventListener('click',()=>{
  // randomize by multiples of 0.55
  function rnd(){ const n = Math.floor(Math.random()*19)-9; return +(n*0.55).toFixed(2); }
  aRange.value = rnd(); bRange.value = rnd(); cRange.value = rnd(); dRange.value = rnd(); syncStateFromUI();
});

/*********************** Modo Juego ************************/
function startGame(){
  if(game.running) return;
  game.running = true; game.level=1; game.score=0; game.correctCount=0; game.incorrectCount=0; game.goodPoints=0; game.badPoints=0; levelDisplay.textContent = game.level; scoreDisplay.textContent=game.score;
  // update status indicator
  const statusText = document.getElementById('statusText'); if(statusText) statusText.textContent = 'En curso';
  // disable start button while a game is running
  if(startGameBtn) startGameBtn.disabled = true;
  startRound();
}

function startRound(){
  // configure level -> number of options
  game.running = true; // asegurar que el juego esté activo cuando empieza la ronda
  const nOptions = Math.min(1 + game.level - 1, 5); // level1 =>1, ... up to 5
  // generate random linear equation with a and b as multiples of 0.55
  const a = randomMultiple( -3, 3 );
  const b = randomMultiple( -5, 5 );
  game.target = {a,b};
  game.options = generateOptionsLinear(game.target, nOptions);
  renderGameOptions();
  game.timer = 45; countdownEl.textContent = game.timer; gameEquation.textContent = `y = ${a.toFixed(2)} x + ${b.toFixed(2)}`;
  // start countdown (not paused)
  game.paused = false; updatePauseButton();
  startTimer();
}

function startTimer(){
  if(game.intervalId) clearInterval(game.intervalId);
  game.intervalId = setInterval(()=>{
    if(game.paused) return;
    game.timer -= 1; countdownEl.textContent = game.timer;
    if(game.timer<=0){ clearInterval(game.intervalId); game.running=false; revealCorrect(null,true); }
    if(game.timer<=5) playBeep();
  },1000);
}

function updatePauseButton(){
  if(!pauseGameBtn) return;
  pauseGameBtn.textContent = game.paused ? 'Continuar' : 'Pausar';
}

function randomMultiple(minV,maxV){
  const minI = Math.ceil(minV/0.55); const maxI = Math.floor(maxV/0.55);
  const i = Math.floor(Math.random()*(maxI-minI+1))+minI; return +(i*0.55).toFixed(2);
}

function generateOptionsLinear(target,n){
  const opts = [];
  // insert correct
  opts.push({a:target.a,b:target.b,correct:true});
  while(opts.length < n){
    // distractor: small perturbation
    const da = perturb(); const db = perturb();
    const cand = {a: +(target.a + da).toFixed(2), b: +(target.b + db).toFixed(2), correct:false};
    // ensure unique and not equal to target
    if(Math.abs(cand.a - target.a) < 0.0001 && Math.abs(cand.b - target.b) < 0.0001) continue;
    if(!opts.some(o=>Math.abs(o.a-cand.a)<0.0001 && Math.abs(o.b-cand.b)<0.0001)) opts.push(cand);
  }
  // shuffle
  for(let i=opts.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[opts[i],opts[j]]=[opts[j],opts[i]]}
  return opts;
}

function perturb(){
  const choices=[-1, -0.55, 0.55, 1.1, 0]; return +(choices[Math.floor(Math.random()*choices.length)]).toFixed(2);
}

function renderGameOptions(){
  optionsEl.innerHTML = '';
  // create mini canvases for each option
  game.options.forEach((opt,idx)=>{
    const div = document.createElement('div'); div.className='option card'; div.tabIndex=0; div.setAttribute('role','button'); div.setAttribute('aria-label',`Opción ${idx+1}`);
    const title = document.createElement('div'); title.className='small'; title.textContent = `Opción ${idx+1}`;
    const canvas = document.createElement('canvas'); canvas.width=320; canvas.height=160; canvas.style.display='block'; canvas.style.marginTop='6px';
    div.appendChild(title); div.appendChild(canvas);
    optionsEl.appendChild(div);
    // draw mini chart
    drawMiniChart(canvas,opt);
    div.addEventListener('click',()=>handleChoice(opt,div));
  });
}

function drawMiniChart(canvas,opt){
  const ctx = canvas.getContext('2d');
  const xs = [];
  for(let x=-6;x<=6;x+=0.3) xs.push(x);
  const ys = xs.map(x=>opt.a*x + opt.b);
  // simple draw using canvas
  const w = canvas.width, h = canvas.height; ctx.clearRect(0,0,w,h);
  // compute bounds
  const minY = Math.min(...ys); const maxY = Math.max(...ys);
  // draw background
  ctx.fillStyle = '#0b1220'; ctx.fillRect(0,0,w,h);

  // plot
  ctx.strokeStyle = '#ffd166'; ctx.lineWidth=2; ctx.beginPath();
  ys.forEach((y,i)=>{
    const xPix = (i/(xs.length-1))*w; const yPix = h - ((y - minY)/(maxY - minY || 1))*h; if(i===0) ctx.moveTo(xPix,yPix); else ctx.lineTo(xPix,yPix);
  }); ctx.stroke();

  // draw axes lines (centered at 0 if visible, else middle)
  const x0 = xs[0]; const xN = xs[xs.length-1];
  const yRange = (maxY - minY) || 1;
  // determine pixel for x axis (y=0) and y axis (x=0)
  const yZeroPix = (0 >= minY && 0 <= maxY) ? (h - ((0 - minY)/yRange)*h) : h/2;
  const xZeroPix = (0 >= x0 && 0 <= xN) ? ((0 - x0)/(xN - x0))*w : w/2;

  ctx.strokeStyle = '#50688a'; ctx.lineWidth = 1; ctx.beginPath();
  // X axis
  ctx.moveTo(0, yZeroPix - 0.5); ctx.lineTo(w, yZeroPix - 0.5);
  // Y axis
  ctx.moveTo(xZeroPix + 0.5, 0); ctx.lineTo(xZeroPix + 0.5, h);
  ctx.stroke();

  // draw ticks and labels for X
  ctx.fillStyle = '#cbd5e1'; ctx.font = '10px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  const xTicks = 5;
  for(let i=0;i<=xTicks;i++){
    const xv = x0 + (i/(xTicks))*(xN - x0);
    const xPix = ((xv - x0)/(xN - x0))*w;
    ctx.beginPath(); ctx.moveTo(xPix, yZeroPix - 4); ctx.lineTo(xPix, yZeroPix + 4); ctx.stroke();
    ctx.fillText(xv.toFixed(1), xPix, Math.min(h-14, yZeroPix + 6));
  }

  // draw ticks and labels for Y
  ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  const yTicks = 4;
  for(let j=0;j<=yTicks;j++){
    const yv = minY + (j/(yTicks))*(maxY - minY);
    const yPix = h - ((yv - minY)/(maxY - minY || 1))*h;
    ctx.beginPath(); ctx.moveTo(xZeroPix - 4, yPix); ctx.lineTo(xZeroPix + 4, yPix); ctx.stroke();
    ctx.fillText(yv.toFixed(1), Math.max(18, xZeroPix - 6), yPix);
  }
}

function handleChoice(opt,el){
  if(!game.running || game.paused) return;
  // stop timer
  clearInterval(game.intervalId); game.running=false;
  // determine correctness
  const correct = Math.abs(opt.a - game.target.a) < 0.0001 && Math.abs(opt.b - game.target.b) < 0.0001;
  revealCorrect(el, false, correct);
}

function revealCorrect(chosenEl, timedOut=false, chosenCorrect=false){
  // mark options
  const optionDivs = Array.from(optionsEl.children);
  optionDivs.forEach((div,i)=>{
    const opt = game.options[i];
    div.classList.remove('correct','wrong');
    if(opt.correct) div.classList.add('correct');
    else if(div===chosenEl && !opt.correct) div.classList.add('wrong');
  });
  // scoring: sumar si acierta, restar si falla (mismo valor según tiempo transcurrido)
  const elapsed = 45 - game.timer;
  let points = 0;
  if(elapsed <=10) points = 20;
  else if(elapsed <=20) points = 10;
  else if(elapsed <=30) points = 5;
  else points = 1;

  if(timedOut){
    // treat as wrong answer (timeout)
    game.score -= points;
    game.incorrectCount = (game.incorrectCount || 0) + 1;
    game.badPoints = (game.badPoints || 0) + points;
  } else if(chosenCorrect){
    // correct answer
    game.score += points;
    showBalloons();
    game.correctCount = (game.correctCount || 0) + 1;
    game.goodPoints = (game.goodPoints || 0) + points;
  } else {
    // wrong answer chosen
    game.score -= points;
    game.incorrectCount = (game.incorrectCount || 0) + 1;
    game.badPoints = (game.badPoints || 0) + points;
  }
  scoreDisplay.textContent = game.score;
  // update live stats UI whenever counts change
  updateLiveStatsUI();

  // proceed to next level after short delay; if level reaches 5, show final score and reset to idle
  setTimeout(()=>{
    if(game.level < 5){
      game.level += 1; levelDisplay.textContent = game.level; startRound();
    } else {
      // finished all levels
      // stop any running timer
      if(game.intervalId) clearInterval(game.intervalId);
      game.running = false;
      // show final score
      finalScoreEl.textContent = game.score;
      // show counts and point breakdown
      const fc = document.getElementById('finalCorrectCount');
      const fi = document.getElementById('finalIncorrectCount');
      const fg = document.getElementById('finalGoodPoints');
      const fb = document.getElementById('finalBadPoints');
  if(fc) fc.textContent = (game.correctCount || 0);
  if(fi) fi.textContent = (game.incorrectCount || 0);
  if(fg) fg.textContent = (game.goodPoints || 0);
  if(fb) fb.textContent = (game.badPoints || 0);
  // re-enable start button now that the game finished
  if(startGameBtn) startGameBtn.disabled = false;
  // update status indicator
  const statusText = document.getElementById('statusText'); if(statusText) statusText.textContent = 'Esperando';
  finalModal.style.display = 'flex';
      // after showing, reset internal state so the game requires pressing start again
      // preserve displayed final score until modal is closed
    }
  },1500);
}

// Interceptar inicio para mostrar modal de instrucciones cuando estemos en modo 'game'
startGameBtn.addEventListener('click',()=>{
  if(modeSelect && modeSelect.value === 'game'){
    const gameInstructionsModal = document.getElementById('gameInstructionsModal');
    const closeGameInstructions = document.getElementById('closeGameInstructions');
    const cancelGameInstructions = document.getElementById('cancelGameInstructions');
    if(gameInstructionsModal){
      // show modal
      gameInstructionsModal.style.display = 'flex';
      // disable start button while modal is open
      if(startGameBtn) startGameBtn.disabled = true;

      // handler to start the game when user accepts
      const onAccept = ()=>{
        cleanup();
        gameInstructionsModal.style.display = 'none';
        setTimeout(()=>{ if(!game.running) startGame(); }, 50);
      };

      // handler to cancel (close modal without starting)
      const onCancel = ()=>{
        cleanup();
        gameInstructionsModal.style.display = 'none';
        if(startGameBtn) startGameBtn.disabled = false;
      };

      // clicking on backdrop should cancel (not start)
      const onBackdrop = (e)=>{ if(e.target === gameInstructionsModal){ onCancel(); } };

      // Escape key cancels
      const onKey = (e)=>{ if(e.key === 'Escape'){ onCancel(); } };

      function cleanup(){
        if(closeGameInstructions) closeGameInstructions.removeEventListener('click', onAccept);
        if(cancelGameInstructions) cancelGameInstructions.removeEventListener('click', onCancel);
        gameInstructionsModal.removeEventListener('click', onBackdrop);
        document.removeEventListener('keydown', onKey);
      }

      if(closeGameInstructions){
        closeGameInstructions.addEventListener('click', onAccept);
      }
      if(cancelGameInstructions){
        cancelGameInstructions.addEventListener('click', onCancel);
      }
      gameInstructionsModal.addEventListener('click', onBackdrop);
      document.addEventListener('keydown', onKey);
    } else {
      // fallback
      startGame();
    }
  } else {
    startGame();
  }
});

// Pause / Resume
if(pauseGameBtn){
  pauseGameBtn.addEventListener('click',()=>{
    if(!game.running) return; // nothing to pause
    if(!game.paused){
      // pause
      game.paused = true;
      if(game.intervalId) clearInterval(game.intervalId);
      updatePauseButton();
    } else {
      // resume
      game.paused = false;
      updatePauseButton();
      startTimer();
    }
  });
}

// Restart game (stop and reset to initial state)
if(restartGameBtn){
  restartGameBtn.addEventListener('click',()=>{
    if(game.intervalId) clearInterval(game.intervalId);
      game.running = false; game.paused = false;
      game.level = 1; game.score = 0; game.correctCount = 0; game.incorrectCount = 0; game.goodPoints = 0; game.badPoints = 0; game.target = null; game.options = [];
    optionsEl.innerHTML = '';
    levelDisplay.textContent = game.level; scoreDisplay.textContent = game.score;
    game.timer = 45; countdownEl.textContent = game.timer;
    updatePauseButton();
      // ensure start button is enabled after restart
      if(startGameBtn) startGameBtn.disabled = false;
      // update status indicator
      const statusText = document.getElementById('statusText'); if(statusText) statusText.textContent = 'Esperando';
    // update live stats UI
    updateLiveStatsUI();
  });
}

closeFinal.addEventListener('click',()=>{
  finalModal.style.display = 'none';
  // reset game to initial state, require user to press start
  game.level = 1; game.score = 0; game.correctCount = 0; game.incorrectCount = 0; game.goodPoints = 0; game.badPoints = 0; levelDisplay.textContent = game.level; scoreDisplay.textContent = game.score; game.target = null; game.options = [];
  optionsEl.innerHTML = '';
  // enable start button after closing final modal
  if(startGameBtn) startGameBtn.disabled = false;
  // update status indicator
  const statusText = document.getElementById('statusText'); if(statusText) statusText.textContent = 'Esperando';
  // update live stats UI
  updateLiveStatsUI();
});

/*********************** Cronómetro sonoro y globos ************************/
function playBeep(){
  try{
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.type='sine'; o.frequency.setValueAtTime(880, ctx.currentTime); g.gain.setValueAtTime(0.05, ctx.currentTime);
    o.connect(g); g.connect(ctx.destination); o.start();
    setTimeout(()=>{ o.stop(); ctx.close(); },90);
  }catch(e){/* ignore on browsers without audio */}
}

function showBalloons(){
  for(let i=0;i<12;i++){
    const b = document.createElement('div'); b.className='balloon';
    b.style.left = Math.random()*90 + '%'; b.style.background = randomColor(); b.style.width = (30+Math.random()*40)+'px'; b.style.height = (40+Math.random()*60)+'px';
    b.style.borderRadius = '50%'; b.style.animation = `rise ${3+Math.random()*3}s linear forwards`;
    document.body.appendChild(b);
    setTimeout(()=>{ b.remove(); },7000);
  }
}
function randomColor(){ const colors=['#ff6b6b','#ffd166','#6bf178','#6bd3ff','#b38bff']; return colors[Math.floor(Math.random()*colors.length)]; }

/*********************** Accesibilidad LSC y Alto contraste ************************/
hcBtn.addEventListener('click',()=>{
  state.hc = !state.hc; if(state.hc) document.body.classList.add('hc'); else document.body.classList.remove('hc'); updateChart();
});
lscBtn.addEventListener('click',()=>{ lscModal.style.display='flex'; });
closeLsc.addEventListener('click',()=>{ lscModal.style.display='none'; });
lscModal.addEventListener('click',(e)=>{ if(e.target===lscModal) lscModal.style.display='none'; });

// mode select hides/shows game UI
modeSelect.addEventListener('change',()=>{
  if(modeSelect.value==='game'){
    document.querySelector('.game-area').style.display = 'flex';
  } else {
    document.querySelector('.game-area').style.display = 'none';
    if(game.intervalId) clearInterval(game.intervalId); game.running=false;
  }
});

// start hidden: show explorer, hide game
document.querySelector('.game-area').style.display = 'none';

/*********************** Inicialización ************************/
// set sensible defaults
funcType.value='linear'; syncStateFromUI();

// Accessibility: keyboard support for options (enter)
optionsEl.addEventListener('keydown',(e)=>{
  if(e.key==='Enter' && e.target.classList.contains('option')) e.target.click();
});

// Live stats UI update helper
function updateLiveStatsUI(){
  const lc = document.getElementById('liveCorrectCount');
  const li = document.getElementById('liveIncorrectCount');
  const lg = document.getElementById('liveGoodPoints');
  const lb = document.getElementById('liveBadPoints');
  if(lc) lc.textContent = (game.correctCount || 0);
  if(li) li.textContent = (game.incorrectCount || 0);
  if(lg) lg.textContent = (game.goodPoints || 0);
  if(lb) lb.textContent = (game.badPoints || 0);
}

// small quality gate: update chart on load
window.addEventListener('load',()=>{ updateChart(); });
