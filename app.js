'use strict';

const EXERCISES = [
  ['Squat', 'Jambes', 'Barre'], ['Front squat', 'Jambes', 'Barre'], ['Presse à cuisses', 'Jambes', 'Machine'],
  ['Fentes marchées', 'Jambes', 'Haltères'], ['Soulevé de terre', 'Dos / jambes', 'Barre'], ['Romanian deadlift', 'Ischios', 'Barre'],
  ['Hip thrust', 'Fessiers', 'Barre'], ['Leg curl', 'Ischios', 'Machine'], ['Leg extension', 'Quadriceps', 'Machine'],
  ['Mollets debout', 'Mollets', 'Machine'], ['Développé couché', 'Pectoraux', 'Barre'], ['Développé incliné', 'Pectoraux', 'Haltères'],
  ['Pompes', 'Pectoraux', 'Poids du corps'], ['Dips', 'Pectoraux / triceps', 'Poids du corps'], ['Écartés poulie', 'Pectoraux', 'Poulie'],
  ['Tractions', 'Dos', 'Poids du corps'], ['Tirage vertical', 'Dos', 'Poulie'], ['Rowing barre', 'Dos', 'Barre'],
  ['Rowing unilatéral', 'Dos', 'Haltère'], ['Face pull', 'Épaules', 'Poulie'], ['Développé militaire', 'Épaules', 'Barre'],
  ['Élévations latérales', 'Épaules', 'Haltères'], ['Oiseau', 'Épaules', 'Haltères'], ['Curl biceps', 'Biceps', 'Haltères'],
  ['Curl marteau', 'Biceps', 'Haltères'], ['Extension triceps', 'Triceps', 'Poulie'], ['Barre au front', 'Triceps', 'Barre'],
  ['Planche', 'Core', 'Poids du corps'], ['Crunch câble', 'Core', 'Poulie'], ['Relevés de jambes', 'Core', 'Poids du corps'],
  ['Burpees', 'Cardio', 'Poids du corps'], ['Mountain climbers', 'Cardio', 'Poids du corps'], ['Corde à sauter', 'Cardio', 'Corde'],
  ['Course', 'Endurance', 'Aucun'], ['Vélo', 'Endurance', 'Vélo'], ['Rameur', 'Endurance', 'Rameur'],
  ['Box jump', 'Puissance', 'Box'], ['Sauts verticaux', 'Puissance', 'Aucun'], ['Sprint', 'Vitesse', 'Aucun'],
  ['Étirement hanches', 'Mobilité', 'Aucun'], ['Mobilité épaules', 'Mobilité', 'Élastique'], ['Deep squat hold', 'Mobilité', 'Aucun']
].map((x, i) => ({ id: `ex-${i + 1}`, name: x[0], group: x[1], equipment: x[2] }));

const DEFAULT_WORKOUTS = [
  {
    id: 'starter-fullbody', name: 'Full Body découverte', createdAt: Date.now(),
    exercises: [
      { exerciseId: 'ex-1', name: 'Squat', sets: 3, reps: 8, load: 0, rest: 90 },
      { exerciseId: 'ex-11', name: 'Développé couché', sets: 3, reps: 8, load: 0, rest: 90 },
      { exerciseId: 'ex-18', name: 'Rowing barre', sets: 3, reps: 10, load: 0, rest: 75 },
      { exerciseId: 'ex-28', name: 'Planche', sets: 3, reps: 30, load: 0, rest: 45 }
    ]
  }
];

const TODAY = () => new Date().toISOString().slice(0, 10);
const DB_KEY = 'ariseDataV1';
let deferredInstallPrompt = null;
let builder = [];
let activeStream = null;

const initialState = () => ({
  version: 1,
  workouts: DEFAULT_WORKOUTS,
  sessions: [],
  meals: [],
  habits: [
    { id: uid(), name: 'Boire 2 L d’eau', target: 'Tous les jours', checks: {} },
    { id: uid(), name: '10 minutes de mobilité', target: 'Tous les jours', checks: {} }
  ],
  radar: { Force: 55, Puissance: 45, Vitesse: 50, Endurance: 60, Mobilité: 40, Régularité: 55 }
});

let state = loadState();

function loadState() {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (!raw) return initialState();
    const parsed = JSON.parse(raw);
    return { ...initialState(), ...parsed };
  } catch {
    return initialState();
  }
}
function saveState() {
  localStorage.setItem(DB_KEY, JSON.stringify(state));
}
function uid() {
  return (crypto && crypto.randomUUID) ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
function escapeHtml(str = '') {
  return String(str).replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));
}
function toast(message) {
  document.querySelector('.toast')?.remove();
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2300);
}
function modal(html) {
  const dlg = document.getElementById('modal');
  stopCamera();
  document.getElementById('modal-content').innerHTML = html;
  dlg.showModal();
}
function closeModal() {
  stopCamera();
  document.getElementById('modal').close();
}
function formatNumber(value, digits = 0) {
  return new Intl.NumberFormat('fr-CH', { maximumFractionDigits: digits }).format(Number(value) || 0);
}

function showView(viewId, smooth = true) {
  const target = document.getElementById(viewId);
  if (!target) return;
  document.querySelectorAll('.view').forEach(v => v.classList.toggle('active', v.id === viewId));
  document.querySelectorAll('.nav-item').forEach(x => x.classList.toggle('active', x.dataset.view === viewId));
  const kicker = document.getElementById('page-kicker');
  if (kicker) kicker.textContent = target.dataset.kicker || target.dataset.title || 'ARISE';
  window.scrollTo({ top: 0, behavior: smooth ? 'smooth' : 'auto' });
  if (viewId === 'tracking-view') requestAnimationFrame(drawAllCharts);
}

function setupNavigation() {
  document.querySelectorAll('.nav-item').forEach(btn => btn.addEventListener('click', () => showView(btn.dataset.view)));
  document.querySelectorAll('[data-go]').forEach(btn => btn.addEventListener('click', () => showView(btn.dataset.go)));
  document.getElementById('brand-home')?.addEventListener('click', () => showView('home-view'));
  document.getElementById('open-settings')?.addEventListener('click', () => showView('settings-view'));
}

function renderHome() {
  const now = new Date();
  const today = TODAY();
  const recentSessions = sessionsInLastDays(7);
  const mealsToday = state.meals.filter(m => m.date === today);
  const calories = mealsToday.reduce((sum, m) => sum + Number(m.kcal || 0), 0);
  const habitsDone = state.habits.filter(h => h.checks[today]).length;
  const habitTotal = state.habits.length;
  const regularity = Math.min(100, Math.round(recentSessions.length / 4 * 100));
  const nutritionScore = Math.min(100, Math.round(calories / 2400 * 100));
  const habitScore = habitTotal ? Math.round(habitsDone / habitTotal * 100) : 0;
  const score = Math.max(12, Math.min(100, Math.round(55 + regularity * .2 + nutritionScore * .12 + habitScore * .13)));

  const dayEl = document.getElementById('home-day');
  const dateEl = document.getElementById('home-date');
  if (dayEl) dayEl.textContent = now.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', '').toUpperCase();
  if (dateEl) dateEl.textContent = String(now.getDate()).padStart(2, '0');
  document.getElementById('home-score').textContent = score;
  document.getElementById('home-energy').textContent = `${Math.min(99, 72 + recentSessions.length * 5)}%`;
  document.getElementById('home-recovery').textContent = `${Math.max(60, 86 - Math.max(0, recentSessions.length - 3) * 6)}%`;
  document.getElementById('home-motivation').textContent = `${Math.min(99, 78 + habitScore * .18).toFixed(0)}%`;
  const ring = document.getElementById('score-ring');
  if (ring) ring.style.background = `conic-gradient(var(--cyan) 0 ${score * .38}%, var(--blue) ${score * .38}% ${score * .72}%, var(--violet) ${score * .72}% ${score}%, rgba(255,255,255,.06) ${score}% 100%)`;

  const workoutProgress = Math.min(100, recentSessions.length * 100);
  const kcalProgress = Math.min(100, calories / 2400 * 100);
  const habitsProgress = habitTotal ? habitsDone / habitTotal * 100 : 0;
  document.getElementById('home-summary').innerHTML = `
    <article class="summary-tile orange-tile"><span>⌁</span><small>Calories</small><b>${formatNumber(calories)}</b><p>/ 2 400 kcal</p><i><em style="width:${kcalProgress}%"></em></i></article>
    <article class="summary-tile blue-tile"><span>✦</span><small>Entraînements</small><b>${recentSessions.length}</b><p>/ 1 session</p><i><em style="width:${workoutProgress}%"></em></i></article>
    <article class="summary-tile purple-tile"><span>✓</span><small>Habitudes</small><b>${habitsDone}</b><p>/ ${habitTotal} terminées</p><i><em style="width:${habitsProgress}%"></em></i></article>`;
}

function renderTraining() {
  const totalVolume = state.sessions.reduce((sum, s) => sum + (s.volume || 0), 0);
  const thisWeek = sessionsInLastDays(7).length;
  const best = Math.max(0, ...state.sessions.map(s => s.volume || 0));
  document.getElementById('training-stats').innerHTML = [
    [thisWeek, 'séances / 7 j'], [`${formatNumber(totalVolume / 1000, 1)} t`, 'volume total'], [`${formatNumber(best)} kg`, 'meilleure séance']
  ].map(([v, l]) => `<div class="stat"><b>${v}</b><small>${l}</small></div>`).join('');

  renderExerciseResults(document.getElementById('exercise-search').value);
  renderBuilder();
  const workoutCount = document.getElementById('workout-count');
  if (workoutCount) workoutCount.textContent = state.workouts.length;
  document.getElementById('saved-workouts').innerHTML = state.workouts.length ? state.workouts.map(w => `
    <article class="workout-card">
      <header><div><b>${escapeHtml(w.name)}</b><br><small>${w.exercises.length} exercices · ${w.exercises.reduce((a,e)=>a+Number(e.sets||0),0)} séries</small></div><span>🏋️</span></header>
      <div class="card-actions">
        <button class="secondary" data-edit-workout="${w.id}">Modifier</button>
        <button class="primary" data-start-workout="${w.id}">Démarrer</button>
      </div>
    </article>`).join('') : '<div class="empty">Aucun workout enregistré.</div>';

  document.querySelectorAll('[data-start-workout]').forEach(b => b.onclick = () => openSession(b.dataset.startWorkout));
  document.querySelectorAll('[data-edit-workout]').forEach(b => b.onclick = () => editWorkout(b.dataset.editWorkout));
}

function sessionsInLastDays(days) {
  const since = Date.now() - days * 86400000;
  return state.sessions.filter(s => new Date(s.date).getTime() >= since);
}

function renderExerciseResults(query = '') {
  const q = query.trim().toLowerCase();
  const filtered = EXERCISES.filter(e => !q || `${e.name} ${e.group} ${e.equipment}`.toLowerCase().includes(q)).slice(0, 12);
  document.getElementById('exercise-results').innerHTML = filtered.map(e => `
    <div class="exercise-result">
      <div><b>${e.name}</b><br><small>${e.group} · ${e.equipment}</small></div>
      <button type="button" data-add-exercise="${e.id}">＋</button>
    </div>`).join('');
  document.querySelectorAll('[data-add-exercise]').forEach(btn => btn.onclick = () => {
    const ex = EXERCISES.find(e => e.id === btn.dataset.addExercise);
    builder.push({ exerciseId: ex.id, name: ex.name, sets: 3, reps: 10, load: 0, rest: 60 });
    renderBuilder();
  });
}

function renderBuilder() {
  const root = document.getElementById('workout-builder');
  root.innerHTML = builder.length ? builder.map((e, i) => `
    <div class="builder-item" data-builder-index="${i}">
      <div class="builder-top"><b>${escapeHtml(e.name)}</b><button type="button" class="remove-btn" data-remove-builder="${i}">×</button></div>
      <div class="fields">
        <input aria-label="Séries" title="Séries" type="number" min="1" value="${e.sets}" data-field="sets" placeholder="Séries">
        <input aria-label="Répétitions" title="Répétitions" type="number" min="1" value="${e.reps}" data-field="reps" placeholder="Rép.">
        <input aria-label="Charge" title="Charge en kg" type="number" min="0" step="0.5" value="${e.load}" data-field="load" placeholder="kg">
        <input aria-label="Repos" title="Repos en secondes" type="number" min="0" value="${e.rest}" data-field="rest" placeholder="Repos">
      </div>
    </div>`).join('') : '<div class="empty">Ajoute des exercices depuis la liste.</div>';
  root.querySelectorAll('input').forEach(input => input.onchange = () => {
    const i = Number(input.closest('[data-builder-index]').dataset.builderIndex);
    builder[i][input.dataset.field] = Number(input.value);
  });
  root.querySelectorAll('[data-remove-builder]').forEach(btn => btn.onclick = () => {
    builder.splice(Number(btn.dataset.removeBuilder), 1);
    renderBuilder();
  });
}

function saveWorkout() {
  const name = document.getElementById('workout-name').value.trim();
  if (!name || !builder.length) return toast('Ajoute un nom et au moins un exercice');
  state.workouts.push({ id: uid(), name, exercises: structuredClone(builder), createdAt: Date.now() });
  saveState();
  builder = [];
  document.getElementById('workout-name').value = '';
  renderTraining();
  toast('Workout enregistré');
}

function editWorkout(id) {
  const w = state.workouts.find(x => x.id === id);
  if (!w) return;
  builder = structuredClone(w.exercises);
  document.getElementById('workout-name').value = `${w.name} — copie`;
  renderBuilder();
  window.scrollTo({ top: 650, behavior: 'smooth' });
  toast('Workout chargé dans l’éditeur');
}

function recommendWorkout() {
  const goal = document.getElementById('goal-filter').value;
  const duration = Number(document.getElementById('duration-filter').value);
  const pools = {
    force: ['Squat','Développé couché','Soulevé de terre','Développé militaire','Tractions'],
    hypertrophie: ['Presse à cuisses','Développé incliné','Tirage vertical','Élévations latérales','Curl biceps','Extension triceps'],
    endurance: ['Course','Rameur','Burpees','Mountain climbers','Corde à sauter'],
    mobilite: ['Étirement hanches','Mobilité épaules','Deep squat hold','Planche']
  };
  const count = duration <= 20 ? 4 : duration <= 35 ? 5 : duration <= 50 ? 6 : 7;
  const names = pools[goal].slice(0, count);
  const recommendation = names.map(name => {
    const ex = EXERCISES.find(x => x.name === name);
    return { exerciseId: ex.id, name, sets: goal === 'force' ? 4 : 3, reps: goal === 'force' ? 5 : goal === 'mobilite' ? 30 : 10, load: 0, rest: goal === 'force' ? 120 : 60 };
  });
  const root = document.getElementById('recommended-workout');
  root.innerHTML = `<p><b>${goal[0].toUpperCase()+goal.slice(1)} · ${duration} min</b></p>${recommendation.map(x => `<div class="mini-row">${x.name} — ${x.sets} × ${x.reps}</div>`).join('')}<button class="secondary full" id="use-recommendation">Utiliser ce workout</button>`;
  document.getElementById('use-recommendation').onclick = () => {
    builder = recommendation;
    document.getElementById('workout-name').value = `${goal[0].toUpperCase()+goal.slice(1)} ${duration}`;
    renderBuilder();
    toast('Workout ajouté à l’éditeur');
  };
}

function openSession(workoutId) {
  const w = state.workouts.find(x => x.id === workoutId);
  if (!w) return;
  modal(`
    <h2>${escapeHtml(w.name)}</h2>
    <p class="muted">Entre la charge et les répétitions réellement réalisées.</p>
    <input type="hidden" id="session-workout-id" value="${w.id}">
    <div class="stack">${w.exercises.map((e, i) => `
      <div class="builder-item" data-session-row="${i}">
        <b>${escapeHtml(e.name)}</b><small class="muted"> · ${e.sets} séries prévues</small>
        <div class="fields">
          <input type="number" data-sfield="sets" value="${e.sets}" min="1" title="Séries">
          <input type="number" data-sfield="reps" value="${e.reps}" min="1" title="Répétitions">
          <input type="number" data-sfield="load" value="${e.load}" min="0" step="0.5" title="Charge kg">
          <input type="number" data-sfield="rpe" value="7" min="1" max="10" title="Difficulté RPE">
        </div>
      </div>`).join('')}</div>
    <label>Commentaire<input id="session-note" placeholder="Énergie, douleur, technique…"></label>
    <div class="modal-actions"><button type="button" class="secondary" id="cancel-modal">Annuler</button><button type="button" class="primary" id="finish-session">Terminer</button></div>`);
  document.getElementById('cancel-modal').onclick = closeModal;
  document.getElementById('finish-session').onclick = () => finishSession(w);
}

function finishSession(workout) {
  const rows = [...document.querySelectorAll('[data-session-row]')].map((row, i) => {
    const data = {};
    row.querySelectorAll('[data-sfield]').forEach(inp => data[inp.dataset.sfield] = Number(inp.value));
    return { name: workout.exercises[i].name, ...data };
  });
  const volume = rows.reduce((sum, e) => sum + e.sets * e.reps * e.load, 0);
  state.sessions.push({ id: uid(), workoutId: workout.id, workoutName: workout.name, date: new Date().toISOString(), rows, volume, note: document.getElementById('session-note').value.trim() });
  state.radar.Régularité = Math.min(100, Math.round(sessionsInLastDays(28).length / 12 * 100));
  saveState();
  closeModal();
  renderAll();
  toast(`Séance enregistrée · ${formatNumber(volume)} kg`);
}

function renderNutrition() {
  const mealsToday = state.meals.filter(m => m.date === TODAY());
  const sums = mealsToday.reduce((a, m) => ({
    kcal: a.kcal + Number(m.kcal || 0), protein: a.protein + Number(m.protein || 0),
    carbs: a.carbs + Number(m.carbs || 0), fat: a.fat + Number(m.fat || 0), fiber: a.fiber + Number(m.fiber || 0)
  }), { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });
  document.getElementById('nutrition-stats').innerHTML = [
    [`${formatNumber(sums.kcal)}`, 'kcal'], [`${formatNumber(sums.protein)} g`, 'protéines'],
    [`${formatNumber(sums.carbs)} g`, 'glucides'], [`${formatNumber(sums.fat)} g`, 'lipides']
  ].map(([v,l]) => `<div class="stat"><b>${v}</b><small>${l}</small></div>`).join('');
  const root = document.getElementById('meal-log');
  root.innerHTML = mealsToday.length ? mealsToday.slice().reverse().map(m => `
    <article class="meal-card">
      <header><div><b>${escapeHtml(m.name)}</b><br><small>${formatNumber(m.kcal)} kcal · P ${formatNumber(m.protein)} g · G ${formatNumber(m.carbs)} g · L ${formatNumber(m.fat)} g</small></div><button class="remove-btn" data-delete-meal="${m.id}">×</button></header>
      ${m.verdict ? `<p class="small">${escapeHtml(m.verdict)}</p>` : ''}
    </article>`).join('') : '<div class="empty">Aucun repas enregistré aujourd’hui.</div>';
  root.querySelectorAll('[data-delete-meal]').forEach(btn => btn.onclick = () => {
    state.meals = state.meals.filter(m => m.id !== btn.dataset.deleteMeal); saveState(); renderNutrition();
  });
}

function openFoodForm(prefill = {}) {
  modal(`
    <h2>Ajouter un aliment</h2>
    <label>Nom<input id="food-name" value="${escapeHtml(prefill.name || '')}" placeholder="Ex. Poulet et riz"></label>
    <div class="fields" style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px">
      <label>Calories<input type="number" id="food-kcal" value="${prefill.kcal ?? ''}" min="0"></label>
      <label>Protéines (g)<input type="number" id="food-protein" value="${prefill.protein ?? ''}" min="0" step="0.1"></label>
      <label>Glucides (g)<input type="number" id="food-carbs" value="${prefill.carbs ?? ''}" min="0" step="0.1"></label>
      <label>Lipides (g)<input type="number" id="food-fat" value="${prefill.fat ?? ''}" min="0" step="0.1"></label>
      <label>Fibres (g)<input type="number" id="food-fiber" value="${prefill.fiber ?? ''}" min="0" step="0.1"></label>
      <label>Quantité<input id="food-quantity" value="${escapeHtml(prefill.quantity || '1 portion')}"></label>
    </div>
    ${prefill.verdict ? `<div class="scan-result"><b>Analyse</b><p>${escapeHtml(prefill.verdict)}</p></div>` : ''}
    <div class="modal-actions"><button type="button" class="secondary" id="cancel-modal">Annuler</button><button type="button" class="primary" id="save-food">Ajouter</button></div>`);
  document.getElementById('cancel-modal').onclick = closeModal;
  document.getElementById('save-food').onclick = () => {
    const name = document.getElementById('food-name').value.trim();
    if (!name) return toast('Indique un nom');
    state.meals.push({ id: uid(), date: TODAY(), name, quantity: document.getElementById('food-quantity').value, kcal: +document.getElementById('food-kcal').value, protein: +document.getElementById('food-protein').value, carbs: +document.getElementById('food-carbs').value, fat: +document.getElementById('food-fat').value, fiber: +document.getElementById('food-fiber').value, verdict: prefill.verdict || '' });
    saveState(); closeModal(); renderNutrition(); toast('Aliment ajouté');
  };
}

function openScanner() {
  modal(`
    <h2>Scanner un produit</h2>
    <p class="muted">Autorise la caméra, vise le code-barres ou entre le numéro manuellement.</p>
    <video id="camera" class="camera-preview" playsinline muted></video>
    <label>Code-barres<input id="barcode-input" inputmode="numeric" placeholder="Ex. 3017620422003"></label>
    <div id="scan-status" class="small">La photo n’est pas enregistrée.</div>
    <div class="modal-actions"><button type="button" class="secondary" id="cancel-modal">Annuler</button><button type="button" class="primary" id="lookup-barcode">Analyser</button></div>`);
  document.getElementById('cancel-modal').onclick = closeModal;
  document.getElementById('lookup-barcode').onclick = () => lookupBarcode(document.getElementById('barcode-input').value.trim());
  startCameraAndDetection();
}

async function startCameraAndDetection() {
  const video = document.getElementById('camera');
  const status = document.getElementById('scan-status');
  if (!navigator.mediaDevices?.getUserMedia) {
    status.textContent = 'Caméra indisponible ici. Entre le code-barres manuellement.';
    return;
  }
  try {
    activeStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
    video.srcObject = activeStream;
    await video.play();
    status.textContent = 'Caméra active. Recherche du code-barres…';
    if ('BarcodeDetector' in window) {
      const formats = await BarcodeDetector.getSupportedFormats();
      const detector = new BarcodeDetector({ formats: formats.filter(f => ['ean_13','ean_8','upc_a','upc_e'].includes(f)) });
      const loop = async () => {
        if (!activeStream || document.getElementById('modal').open === false) return;
        try {
          const codes = await detector.detect(video);
          if (codes[0]?.rawValue) {
            document.getElementById('barcode-input').value = codes[0].rawValue;
            status.textContent = `Code détecté : ${codes[0].rawValue}`;
            stopCamera();
            lookupBarcode(codes[0].rawValue);
            return;
          }
        } catch {}
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    } else {
      status.textContent = 'Caméra active. La détection automatique n’est pas supportée : entre le numéro sous le code-barres.';
    }
  } catch {
    status.textContent = 'Accès caméra refusé ou indisponible. Entre le code-barres manuellement.';
  }
}

function stopCamera() {
  if (activeStream) activeStream.getTracks().forEach(t => t.stop());
  activeStream = null;
}

async function lookupBarcode(code) {
  if (!/^\d{8,14}$/.test(code)) return toast('Code-barres invalide');
  const status = document.getElementById('scan-status');
  status.textContent = 'Recherche du produit…';
  try {
    const response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json?fields=product_name,brands,nutriments,nutriscore_grade,nova_group,ingredients_text,allergens_tags`);
    if (!response.ok) throw new Error('network');
    const json = await response.json();
    if (json.status !== 1 || !json.product) {
      status.textContent = 'Produit introuvable. Tu peux l’ajouter manuellement.';
      return;
    }
    const p = json.product;
    const n = p.nutriments || {};
    const grade = String(p.nutriscore_grade || '').toUpperCase();
    const verdict = nutritionVerdict(p);
    stopCamera();
    document.getElementById('modal-content').innerHTML = `
      <h2>${escapeHtml(p.product_name || 'Produit')}</h2>
      <p class="muted">${escapeHtml(p.brands || '')}</p>
      <div class="scan-result">
        <span class="score-pill">Nutri-Score ${grade || 'non renseigné'}</span>
        <p><b>${escapeHtml(verdict)}</b></p>
        <p class="small">Pour 100 g : ${formatNumber(n['energy-kcal_100g'])} kcal · protéines ${formatNumber(n.proteins_100g,1)} g · glucides ${formatNumber(n.carbohydrates_100g,1)} g · lipides ${formatNumber(n.fat_100g,1)} g · sel ${formatNumber(n.salt_100g,2)} g</p>
        ${p.ingredients_text ? `<p class="small">Ingrédients : ${escapeHtml(p.ingredients_text).slice(0,450)}</p>` : ''}
      </div>
      <div class="modal-actions"><button type="button" class="secondary" id="cancel-modal">Fermer</button><button type="button" class="primary" id="add-scanned-food">Ajouter au journal</button></div>`;
    document.getElementById('cancel-modal').onclick = closeModal;
    document.getElementById('add-scanned-food').onclick = () => openFoodForm({
      name: p.product_name || 'Produit scanné', kcal: n['energy-kcal_100g'] || 0, protein: n.proteins_100g || 0,
      carbs: n.carbohydrates_100g || 0, fat: n.fat_100g || 0, fiber: n.fiber_100g || 0,
      quantity: '100 g', verdict
    });
  } catch {
    status.textContent = 'Connexion impossible. Le scan nécessite Internet, mais aucune donnée personnelle n’est envoyée.';
  }
}

function nutritionVerdict(p) {
  const n = p.nutriments || {};
  const positives = [];
  const alerts = [];
  if ((n.proteins_100g || 0) >= 10) positives.push('bonne teneur en protéines');
  if ((n.fiber_100g || 0) >= 6) positives.push('riche en fibres');
  if ((n.sugars_100g || 0) > 15) alerts.push('assez sucré');
  if ((n.salt_100g || 0) > 1.5) alerts.push('assez salé');
  if ((n['saturated-fat_100g'] || 0) > 5) alerts.push('riche en graisses saturées');
  if ((p.nova_group || 0) >= 4) alerts.push('très transformé');
  if (!positives.length && !alerts.length) return 'Profil nutritionnel intermédiaire : regarde surtout la portion et la fréquence.';
  if (positives.length && !alerts.length) return `Plutôt intéressant : ${positives.join(' et ')}.`;
  if (!positives.length && alerts.length) return `À consommer avec mesure : ${alerts.join(', ')}.`;
  return `Points positifs : ${positives.join(', ')}. À surveiller : ${alerts.join(', ')}.`;
}

function renderTracking() {
  const today = TODAY();
  const root = document.getElementById('habit-list');
  root.innerHTML = state.habits.length ? state.habits.map(h => {
    const done = !!h.checks[today];
    const completed = Object.values(h.checks).filter(Boolean).length;
    return `<article class="habit-card"><div class="habit-info"><b>${escapeHtml(h.name)}</b><small>${escapeHtml(h.target)} · ${completed} validations</small></div><button class="habit-check ${done?'done':''}" data-check-habit="${h.id}">✓</button></article>`;
  }).join('') : '<div class="empty">Ajoute ta première habitude.</div>';
  root.querySelectorAll('[data-check-habit]').forEach(btn => btn.onclick = () => {
    const h = state.habits.find(x => x.id === btn.dataset.checkHabit);
    h.checks[today] = !h.checks[today];
    saveState(); renderTracking(); drawAllCharts();
  });
  requestAnimationFrame(drawAllCharts);
}

function addHabit() {
  modal(`
    <h2>Nouvelle habitude</h2>
    <label>Habitude<input id="habit-name" placeholder="Ex. Dormir 8 heures"></label>
    <label>Fréquence<select id="habit-target"><option>Tous les jours</option><option>5 jours par semaine</option><option>3 jours par semaine</option><option>Jours ouvrés</option></select></label>
    <div class="modal-actions"><button type="button" class="secondary" id="cancel-modal">Annuler</button><button type="button" class="primary" id="save-habit">Ajouter</button></div>`);
  document.getElementById('cancel-modal').onclick = closeModal;
  document.getElementById('save-habit').onclick = () => {
    const name = document.getElementById('habit-name').value.trim();
    if (!name) return toast('Écris une habitude');
    state.habits.push({ id: uid(), name, target: document.getElementById('habit-target').value, checks: {} });
    saveState(); closeModal(); renderTracking(); toast('Habitude ajoutée');
  };
}

function editRadar() {
  modal(`
    <h2>Profil sportif</h2>
    <p class="muted">Attribue une valeur de 0 à 100. Plus tard, ces scores pourront être calculés à partir de tests.</p>
    ${Object.entries(state.radar).map(([k,v]) => `<label>${k} — <span id="radar-val-${k}">${v}</span><input type="range" min="0" max="100" value="${v}" data-radar="${k}"></label>`).join('')}
    <div class="modal-actions"><button type="button" class="secondary" id="cancel-modal">Annuler</button><button type="button" class="primary" id="save-radar">Enregistrer</button></div>`);
  document.querySelectorAll('[data-radar]').forEach(r => r.oninput = () => document.getElementById(`radar-val-${r.dataset.radar}`).textContent = r.value);
  document.getElementById('cancel-modal').onclick = closeModal;
  document.getElementById('save-radar').onclick = () => {
    document.querySelectorAll('[data-radar]').forEach(r => state.radar[r.dataset.radar] = +r.value);
    saveState(); closeModal(); drawAllCharts();
  };
}

function canvasSetup(canvas) {
  const dpr = window.devicePixelRatio || 1;
  const cssW = canvas.clientWidth || 340;
  const ratio = Number(canvas.getAttribute('height')) / Number(canvas.getAttribute('width'));
  const cssH = cssW * ratio;
  canvas.width = cssW * dpr;
  canvas.height = cssH * dpr;
  canvas.style.height = `${cssH}px`;
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w: cssW, h: cssH };
}

function drawRadar() {
  const canvas = document.getElementById('radar-chart'); if (!canvas) return;
  const { ctx, w, h } = canvasSetup(canvas);
  const labels = Object.keys(state.radar), vals = Object.values(state.radar);
  const cx = w/2, cy = h/2 + 4, radius = Math.min(w,h)*.32, n = labels.length;
  ctx.clearRect(0,0,w,h);
  ctx.strokeStyle = 'rgba(88,119,170,.16)'; ctx.lineWidth = 1;
  for (let level=1; level<=5; level++) {
    ctx.beginPath();
    for (let i=0;i<n;i++) { const a=-Math.PI/2+i*2*Math.PI/n, r=radius*level/5; const x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r; i?ctx.lineTo(x,y):ctx.moveTo(x,y); }
    ctx.closePath(); ctx.stroke();
  }
  for (let i=0;i<n;i++) { const a=-Math.PI/2+i*2*Math.PI/n; ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+Math.cos(a)*radius,cy+Math.sin(a)*radius);ctx.stroke(); }
  ctx.beginPath();
  vals.forEach((v,i)=>{const a=-Math.PI/2+i*2*Math.PI/n,r=radius*v/100,x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r;i?ctx.lineTo(x,y):ctx.moveTo(x,y)});
  ctx.closePath(); const radarGradient=ctx.createRadialGradient(cx,cy,0,cx,cy,radius);radarGradient.addColorStop(0,'rgba(31,214,255,.30)');radarGradient.addColorStop(.65,'rgba(47,123,255,.28)');radarGradient.addColorStop(1,'rgba(134,92,255,.24)');ctx.fillStyle=radarGradient;ctx.fill();ctx.shadowColor='#20c8ff';ctx.shadowBlur=14;ctx.strokeStyle='#23c7ff';ctx.lineWidth=2.2;ctx.stroke();ctx.shadowBlur=0; vals.forEach((v,i)=>{const a=-Math.PI/2+i*2*Math.PI/n,r=radius*v/100,x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r;ctx.beginPath();ctx.arc(x,y,3,0,Math.PI*2);ctx.fillStyle=i>3?'#8b67ff':'#29cfff';ctx.fill();});
  ctx.fillStyle='#dce7fa';ctx.font='10px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';
  labels.forEach((label,i)=>{const a=-Math.PI/2+i*2*Math.PI/n,r=radius+24;ctx.fillText(label,cx+Math.cos(a)*r,cy+Math.sin(a)*r)});
}

function last7Days() {
  return Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()-(6-i));return d.toISOString().slice(0,10)});
}
function drawBarChart(canvasId, labels, values, suffix='') {
  const canvas = document.getElementById(canvasId); if (!canvas) return;
  const { ctx, w, h } = canvasSetup(canvas); ctx.clearRect(0,0,w,h);
  const pad={l:30,r:8,t:15,b:28}; const max=Math.max(1,...values)*1.15; const innerW=w-pad.l-pad.r, innerH=h-pad.t-pad.b;
  ctx.strokeStyle='rgba(101,125,165,.13)';ctx.fillStyle='#65718a';ctx.font='9px system-ui';
  for(let i=0;i<=4;i++){const y=pad.t+innerH*i/4;ctx.beginPath();ctx.moveTo(pad.l,y);ctx.lineTo(w-pad.r,y);ctx.stroke();const v=Math.round(max*(1-i/4));ctx.fillText(`${v}${suffix}`,2,y+3)}
  const slot=innerW/values.length, bw=Math.max(8,slot*.55);
  values.forEach((v,i)=>{const bh=innerH*v/max,x=pad.l+i*slot+(slot-bw)/2,y=pad.t+innerH-bh;const g=ctx.createLinearGradient(0,y,0,pad.t+innerH);g.addColorStop(0,'#22c9ff');g.addColorStop(.48,'#367cff');g.addColorStop(1,'#7959ff');ctx.fillStyle=g;ctx.shadowColor='rgba(38,158,255,.45)';ctx.shadowBlur=9;roundRect(ctx,x,y,bw,bh,6);ctx.fill();ctx.shadowBlur=0;ctx.fillStyle='#69758b';ctx.textAlign='center';ctx.fillText(labels[i],x+bw/2,h-9)});
  ctx.textAlign='left';
}
function roundRect(ctx,x,y,w,h,r){ if(h<0){y+=h;h=-h} r=Math.min(r,w/2,h/2);ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath(); }
function drawAllCharts() {
  drawRadar();
  const days = last7Days();
  const volume = days.map(day => state.sessions.filter(s => s.date.slice(0,10) === day).reduce((a,s)=>a+(s.volume||0),0)/1000);
  drawBarChart('volume-chart', days.map(d=>new Date(d+'T12:00:00').toLocaleDateString('fr-FR',{weekday:'short'}).slice(0,2)), volume.map(v=>Math.round(v*10)/10), 't');
  const habitValues = days.map(day => state.habits.length ? Math.round(state.habits.filter(h=>h.checks[day]).length/state.habits.length*100) : 0);
  drawBarChart('habit-chart', days.map(d=>new Date(d+'T12:00:00').toLocaleDateString('fr-FR',{weekday:'short'}).slice(0,2)), habitValues, '%');
}

function exportData() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob); const a = document.createElement('a');
  a.href = url; a.download = `arise-sauvegarde-${TODAY()}.json`; a.click(); URL.revokeObjectURL(url);
  toast('Sauvegarde exportée');
}
function importData(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      if (!parsed || !Array.isArray(parsed.workouts) || !Array.isArray(parsed.habits)) throw new Error();
      state = { ...initialState(), ...parsed }; saveState(); renderAll(); toast('Sauvegarde importée');
    } catch { toast('Fichier de sauvegarde invalide'); }
  };
  reader.readAsText(file);
}
function resetData() {
  modal(`<h2>Effacer toutes les données ?</h2><p>Cette action supprime workouts, séances, repas et habitudes de cet appareil.</p><div class="modal-actions"><button type="button" class="secondary" id="cancel-modal">Annuler</button><button type="button" class="primary" id="confirm-reset">Effacer</button></div>`);
  document.getElementById('cancel-modal').onclick = closeModal;
  document.getElementById('confirm-reset').onclick = () => { state = initialState(); saveState(); closeModal(); renderAll(); toast('Données effacées'); };
}

function setupEvents() {
  document.getElementById('exercise-search').addEventListener('input', e => renderExerciseResults(e.target.value));
  document.getElementById('clear-builder').onclick = () => { builder = []; renderBuilder(); };
  document.getElementById('save-workout').onclick = saveWorkout;
  document.getElementById('recommend-workout').onclick = recommendWorkout;
  document.getElementById('open-food-form').onclick = () => openFoodForm();
  document.getElementById('open-scanner').onclick = openScanner;
  document.getElementById('meal-add-inline').onclick = () => openFoodForm();
  document.getElementById('quick-meal').onclick = () => openFoodForm();
  document.getElementById('quick-scan').onclick = openScanner;
  document.getElementById('quick-start').onclick = () => {
    if (state.workouts[0]) openSession(state.workouts[0].id);
    else showView('training-view');
  };
  document.getElementById('add-habit').onclick = addHabit;
  document.getElementById('edit-radar').onclick = editRadar;
  document.getElementById('export-data').onclick = exportData;
  document.getElementById('import-data').onchange = e => e.target.files[0] && importData(e.target.files[0]);
  document.getElementById('reset-data').onclick = resetData;
  document.getElementById('modal').addEventListener('close', stopCamera);
  window.addEventListener('resize', () => { if (document.getElementById('tracking-view').classList.contains('active')) drawAllCharts(); });
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredInstallPrompt = e; document.getElementById('install-btn').hidden = false; });
  document.getElementById('install-btn').onclick = async () => { if (deferredInstallPrompt) { deferredInstallPrompt.prompt(); await deferredInstallPrompt.userChoice; deferredInstallPrompt = null; document.getElementById('install-btn').hidden = true; } else { toast('Sur iPhone : Safari → Partager → Sur l’écran d’accueil'); } };
}

function renderAll() {
  renderHome(); renderTraining(); renderNutrition(); renderTracking();
}

setupNavigation(); setupEvents(); renderAll();
if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('./service-worker.js').catch(()=>{}));
