/**
 * ClearRoute — Web Application
 * Onboarding → Map → Facility Cards → Household Management
 * Falls back gracefully when API or Mapbox aren't available.
 */

const DEMO_FACILITIES = [
  { "facility_id": "f001", "facility_name": "Intermountain Medical Center", "facility_type": "hospital_er", "address": "5121 S Cottonwood St, Murray, UT 84107", "phone": "801-507-7000", "latitude": 40.6394, "longitude": -111.8988 },
  { "facility_id": "f002", "facility_name": "University of Utah Hospital", "facility_type": "hospital_er", "address": "50 N Medical Dr, Salt Lake City, UT 84132", "phone": "801-581-2121", "latitude": 40.7718, "longitude": -111.8357 },
  { "facility_id": "f003", "facility_name": "St. Mark's Hospital", "facility_type": "hospital_er", "address": "1200 E 3900 S, Salt Lake City, UT 84124", "phone": "801-268-7111", "latitude": 40.6905, "longitude": -111.8562 },
  { "facility_id": "f004", "facility_name": "American Fork Hospital", "facility_type": "hospital_er", "address": "170 N 1100 E, American Fork, UT 84003", "phone": "801-855-3300", "latitude": 40.3814, "longitude": -111.7719 },
  { "facility_id": "f005", "facility_name": "Davis Hospital and Medical Center", "facility_type": "hospital_er", "address": "1600 W Antelope Dr, Layton, UT 84041", "phone": "801-807-1000", "latitude": 41.0772, "longitude": -111.9846 },
  { "facility_id": "f006", "facility_name": "Primary Children's Hospital", "facility_type": "hospital_er", "address": "100 N Mario Capecchi Dr, Salt Lake City, UT 84113", "phone": "801-662-1000", "latitude": 40.7708, "longitude": -111.8371 },
  { "facility_id": "f007", "facility_name": "Utah Valley Hospital", "facility_type": "hospital_er", "address": "1034 N 500 W, Provo, UT 84604", "phone": "801-357-7850", "latitude": 40.2388, "longitude": -111.6620 },
  { "facility_id": "f008", "facility_name": "LDS Hospital", "facility_type": "hospital_er", "address": "8th Ave & C St, Salt Lake City, UT 84143", "phone": "801-408-1100", "latitude": 40.7800, "longitude": -111.8730 },
  { "facility_id": "f009", "facility_name": "Alta View Hospital", "facility_type": "hospital_er", "address": "9660 S 1300 E, Sandy, UT 84094", "phone": "801-501-2600", "latitude": 40.5754, "longitude": -111.8549 },
  { "facility_id": "f010", "facility_name": "Lone Peak Hospital", "facility_type": "hospital_er", "address": "11925 S State St, Draper, UT 84020", "phone": "801-545-8000", "latitude": 40.5202, "longitude": -111.8660 },
  { "facility_id": "f011", "facility_name": "InstaCare - Murray", "facility_type": "urgent_care", "address": "5770 S 300 E, Murray, UT 84107", "phone": "801-442-3192", "latitude": 40.6380, "longitude": -111.8890 },
  { "facility_id": "f012", "facility_name": "InstaCare - Sugar House", "facility_type": "urgent_care", "address": "1063 E 2100 S, Salt Lake City, UT 84106", "phone": "801-442-3190", "latitude": 40.7225, "longitude": -111.8572 },
  { "facility_id": "f013", "facility_name": "U of U Urgent Care - Redwood", "facility_type": "urgent_care", "address": "1525 W 2100 S, Salt Lake City, UT 84119", "phone": "801-213-4500", "latitude": 40.7230, "longitude": -111.9283 },
  { "facility_id": "f014", "facility_name": "MountainStar Urgent Care", "facility_type": "urgent_care", "address": "3620 W 9000 S, West Jordan, UT 84088", "phone": "801-256-6500", "latitude": 40.5939, "longitude": -111.9625 },
  { "facility_id": "f015", "facility_name": "Riverton Hospital", "facility_type": "hospital_er", "address": "3741 W 12600 S, Riverton, UT 84065", "phone": "801-285-4000", "latitude": 40.5198, "longitude": -111.9565 },
  { "facility_id": "f016", "facility_name": "Ogden Regional Medical Center", "facility_type": "hospital_er", "address": "5475 S 500 E, Ogden, UT 84405", "phone": "801-479-2111", "latitude": 41.1922, "longitude": -111.9591 },
  { "facility_id": "f017", "facility_name": "McKay-Dee Hospital", "facility_type": "hospital_er", "address": "4401 Harrison Blvd, Ogden, UT 84403", "phone": "801-387-2800", "latitude": 41.2083, "longitude": -111.9467 },
  { "facility_id": "f018", "facility_name": "Jordan Valley Medical Center", "facility_type": "hospital_er", "address": "3580 W 9000 S, West Jordan, UT 84088", "phone": "801-561-8888", "latitude": 40.5940, "longitude": -111.9610 },
  { "facility_id": "f019", "facility_name": "Timpanogos Regional Hospital", "facility_type": "hospital_er", "address": "750 W 800 N, Orem, UT 84057", "phone": "801-714-6000", "latitude": 40.3117, "longitude": -111.7098 },
  { "facility_id": "f020", "facility_name": "Mountain Point Medical Center", "facility_type": "hospital_er", "address": "3000 Triumph Blvd, Lehi, UT 84043", "phone": "385-345-3000", "latitude": 40.4250, "longitude": -111.8670 }
];

function calculateCosts(facility, insFamily, planStruct, dedStatus, archetypeId, distanceMi) {
  const setting = facility.facility_type;
  const isEr = setting === 'hospital_er' || setting === 'freestanding_er';

  let billingPredict = setting === 'urgent_care' ? 0.9 : 0.5;
  if (['medicaid', 'medicare_advantage', 'va'].includes(insFamily)) billingPredict += 0.1;

  let likely = 0, upTo = 0;
  let risk = "Low";
  let conf = "High";

  if (setting === 'urgent_care') {
    if (['medicaid', 'va'].includes(insFamily)) {
      likely = 0; upTo = 0; risk = "Low";
    } else if (insFamily.includes('medicare')) {
      likely = 45; upTo = 65; risk = "Low";
    } else {
      if (dedStatus === 'not_met' && planStruct === 'hdhp') {
        likely = 120; upTo = 250; risk = "Medium";
      } else {
        likely = 40; upTo = 150; risk = "Low";
      }
    }
  } else {
    if (['medicaid', 'va'].includes(insFamily)) {
      likely = 0; upTo = 50; risk = "Low";
    } else if (insFamily.includes('medicare')) {
      likely = 90; upTo = 250; risk = "Medium";
    } else {
      if (['not_met', 'unsure'].includes(dedStatus)) {
        likely = 1200; upTo = 3500; risk = "High";
        conf = "Low";
      } else {
        likely = 250; upTo = 1000; risk = "Medium";
      }
    }
  }

  let fit = 1.0;
  if (setting === 'urgent_care') {
    if (['fracture_suspected', 'cut_stitches', 'rash_allergy', 'ent_pain', 'minor_illness', 'fever_dehydration', 'uti'].includes(archetypeId)) {
      fit = 0.9;
    } else {
      fit = 0.2;
    }
  }

  const distScore = Math.max(0, 1.0 - (distanceMi / 50.0));
  const score = (0.55 * fit) + (0.30 * Math.min(1.0, billingPredict)) + (0.15 * distScore);

  let display = score > 0.7 ? 'green' : (score > 0.4 ? 'grey' : 'red');
  if (setting === 'urgent_care' && fit < 0.5) display = 'red';

  return {
    status: "in_network",
    display: display,
    confidence_score: parseInt(score * 100),
    plan_name: `${insFamily.replace('_', ' ')} ${planStruct.toUpperCase()}`,
    verified_at: "2026-02-26",
    source_count: 3,
    likely_you_pay: likely,
    could_be_up_to: upTo,
    bill_risk: risk,
    network_certainty: conf,
    score: score
  };
}

function haversine(la1, lo1, la2, lo2) {
  const R = 3959; // Earth radius in miles
  const toRad = Math.PI / 180;
  la1 *= toRad; lo1 *= toRad; la2 *= toRad; lo2 *= toRad;
  const dLat = la2 - la1;
  const dLon = lo2 - lo1;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.asin(Math.sqrt(a));
  return R * c;
}

const API_BASE = 'http://localhost:8001';
const MAPBOX_TOKEN = 'YOUR_MAPBOX_TOKEN_HERE';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const DEFAULT_CENTER = { lat: 40.7608, lng: -111.8910 };
const DEFAULT_ZOOM = 11;

let state = { currentStep: 1, selectedPayer: null, selectedPlan: null, memberName: '', householdMembers: [], activeHouseholdMemberId: null, facilities: [], map: null, markers: [], selectedFacility: null, userLocation: null };

// Storage
const STORAGE_KEY = 'clearroute_data';
function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify({ householdMembers: state.householdMembers, activeHouseholdMemberId: state.activeHouseholdMemberId })); }
function loadState() { try { let r = localStorage.getItem(STORAGE_KEY); return r ? JSON.parse(r) : null; } catch { return null; } }
function saveCache(facs, lat, lng, planId) { localStorage.setItem('clearroute_cache', JSON.stringify({ facilities: facs, cachedAt: new Date().toISOString(), planId })); }
function loadCache(planId) { try { let r = localStorage.getItem('clearroute_cache'); if (!r) return null; let c = JSON.parse(r); if (Date.now() - new Date(c.cachedAt).getTime() > CACHE_TTL_MS) return null; if (c.planId !== planId) return null; return c; } catch { return null; } }

// Constants for Phase 4
const INSURANCE_FAMILIES = [
  { id: 'medicare_advantage', label: 'Medicare Advantage (Part C)' },
  { id: 'original_medicare', label: 'Original Medicare (Part A/B)' },
  { id: 'employer_group', label: 'Employer / Group' },
  { id: 'marketplace', label: 'Marketplace / ACA' },
  { id: 'medicaid', label: 'Medicaid / CHIP' },
  { id: 'tricare', label: 'TRICARE' },
  { id: 'va', label: 'VA / Veterans' },
  { id: 'uninsured', label: 'Self pay / Uninsured' },
  { id: 'other_unsure', label: 'Other / Not sure' }
];

const BRANDS = [
  { id: 'uhc', label: 'UnitedHealthcare' },
  { id: 'bcbs', label: 'Blue Cross Blue Shield (BCBS)' },
  { id: 'aetna', label: 'Aetna' },
  { id: 'cigna', label: 'Cigna' },
  { id: 'humana', label: 'Humana' },
  { id: 'kaiser', label: 'Kaiser Permanente' },
  { id: 'molina', label: 'Molina' },
  { id: 'centene', label: 'Centene / WellCare' },
  { id: 'tricare', label: 'TRICARE' },
  { id: 'va', label: 'VA' },
  { id: 'other', label: 'My plan isn\'t listed' },
  { id: 'unsure', label: 'Not sure' }
];

const STRUCTURES = [
  { id: 'ppo', label: 'PPO' },
  { id: 'hmo', label: 'HMO' },
  { id: 'hdhp', label: 'HDHP (High Deductible)' },
  { id: 'epo', label: 'EPO' },
  { id: 'pos', label: 'POS' },
  { id: 'unsure', label: 'Not sure' }
];

const ARCHETYPES = [
  { id: 'fracture_suspected', label: 'Possible fracture or severe sprain', safety: ['Bone is visible', 'Severe deformity', 'Uncontrolled bleeding'] },
  { id: 'chest_pain', label: 'Chest pain or shortness of breath', safety: ['Crushing pain radiating to arm/jaw', 'Severe difficulty breathing', 'Fainting or dizziness'] },
  { id: 'cut_stitches', label: 'Deep cut needing stitches', safety: ['Spurting blood', 'Cannot stop bleeding after 10 mins pressure', 'Loss of sensation below cut'] },
  { id: 'fever_dehydration', label: 'Fever / dehydration concern', safety: ['Fever above 104 F (100.4 F if infant)', 'Unable to keep any fluids down', 'Lethargy or confusion'] },
  { id: 'abd_pain', label: 'Severe abdominal pain', safety: ['Vomiting blood', 'Stiff or board-like abdomen', 'Pregnancy + severe bleeding'] },
  { id: 'head_injury', label: 'Head injury / concussion', safety: ['Loss of consciousness', 'Repeated vomiting', 'Seizures or slurred speech'] },
  { id: 'uti', label: 'UTI symptoms', safety: ['High fever and chills', 'Severe back/flank pain', 'Unable to urinate at all'] },
  { id: 'ent_pain', label: 'Severe sore throat / ear pain', safety: ['Difficulty swallowing own saliva', 'Stiff neck', 'Difficulty breathing'] },
  { id: 'rash_allergy', label: 'Rash / allergic reaction', safety: ['Swelling of lips/tongue/throat', 'Difficulty breathing or wheezing', 'History of severe anaphylaxis'] },
  { id: 'minor_illness', label: 'Medication issue / minor illness', safety: ['Sudden weakness or numbness', 'Sudden severe headache (worst of life)', 'Chest pain'] }
];

// Boot
document.addEventListener('DOMContentLoaded', () => {
  const saved = loadState();
  if (saved?.householdMembers?.length > 0) {
    state.householdMembers = saved.householdMembers;
    state.activeHouseholdMemberId = saved.activeHouseholdMemberId;
    showProfileSelection();
  } else {
    goToStep(1);
  }
  setupGrids();
});

// Setup Initial Grids
function setupGrids() {
  const btnHtml = (item, fn) => `<button class="payer-btn" onclick="${fn}('${item.id}')"><span class="payer-name">${item.label}</span></button>`;
  document.getElementById('family-grid').innerHTML = INSURANCE_FAMILIES.map(i => btnHtml(i, 'selectFamily')).join('');
  document.getElementById('brand-grid').innerHTML = BRANDS.map(i => btnHtml(i, 'selectBrand')).join('');
  document.getElementById('structure-grid').innerHTML = STRUCTURES.map(i => `<button class="payer-btn structure-btn" onclick="selectStructure(this, '${i.id}')"><span class="payer-name">${i.label}</span></button>`).join('');
  document.getElementById('archetype-grid').innerHTML = ARCHETYPES.map(i => btnHtml(i, 'selectArchetype')).join('');
}

// Onboarding Handlers
function submitStep1() {
  state.draftProfile = {
    memberId: genId(),
    displayName: document.getElementById('member-name').value.trim() || 'Me',
    memberType: document.getElementById('member-type').value,
    pregnant: document.getElementById('member-pregnant').value,
    planStructure: 'unsure' // default
  };
  goToStep(2);
}

function selectFamily(id) {
  state.draftProfile.insuranceFamily = id;
  goToStep(3);
}

function selectBrand(id) {
  state.draftProfile.carrierBrand = id;
  goToStep(4);
}

function selectStructure(el, id) {
  document.querySelectorAll('.structure-btn').forEach(b => b.classList.remove('selected'));
  el.classList.add('selected');
  state.draftProfile.planStructure = id;
}

function goToStep(step) {
  state.currentStep = step;
  document.querySelectorAll('.onboarding-step').forEach(s => s.classList.remove('active'));
  document.getElementById(`step-${step}`).classList.add('active');

  const indicator = document.getElementById('step-indicator');
  if (step === 0) {
    indicator.style.display = 'none';
  } else {
    indicator.style.display = 'flex';
    document.querySelectorAll('.step-dot').forEach(d => { const s = parseInt(d.dataset.step); d.classList.remove('active', 'completed'); if (s === step) d.classList.add('active'); if (s < step) d.classList.add('completed'); });
  }

  // Handle dynamic back button on Step 1
  const step1Back = document.getElementById('step-1-back');
  if (step1Back) {
    if (step === 1 && state.householdMembers.length > 0) {
      step1Back.style.display = 'inline-block';
    } else {
      step1Back.style.display = 'none';
    }
  }
}

function showProfileSelection() {
  const list = document.getElementById('profile-select-list');
  list.innerHTML = state.householdMembers.map(m => {
    const brand = BRANDS.find(b => b.id === m.carrierBrand)?.label || 'No Insurance';
    const struct = m.planStructure && m.planStructure !== 'unsure' ? m.planStructure.toUpperCase() : '';
    return `<div class="member-item" style="padding:16px;" onclick="selectExistingProfile('${m.memberId}')">
      <div class="member-info">
        <span class="member-name" style="font-size:16px;">${esc(m.displayName)}</span>
        <span class="member-plan">${esc(brand)} ${esc(struct)}</span>
      </div>
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--text-muted)">
        <path d="M5 12h14M12 5l7 7-7 7" />
      </svg>
    </div>`;
  }).join('');
  goToStep(0);
}

function selectExistingProfile(id) {
  state.activeHouseholdMemberId = id;
  saveState();
  goToStep(5); // Go to Reason for Visit
}

function submitOnboardingProfile(addAnother = false) {
  state.draftProfile.deductibleStatus = document.getElementById('member-deductible').value;
  state.householdMembers.push(state.draftProfile);
  state.activeHouseholdMemberId = state.draftProfile.memberId;
  saveState();

  if (addAnother) {
    document.getElementById('member-name').value = '';
    goToStep(1);
  } else {
    goToStep(5);
  }
}

function addAnotherMember() {
  submitOnboardingProfile(true);
}

function selectArchetype(id) {
  const arch = ARCHETYPES.find(a => a.id === id);
  state.currentArchetype = arch;
  const sq = document.getElementById('safety-questions');
  sq.innerHTML = arch.safety.map((s, i) => `
    <label style="display:flex; align-items:center; gap:8px; padding:12px; background:rgba(255,255,255,0.05); border-radius:6px; cursor:pointer;">
      <input type="checkbox" id="sf-${i}" class="safety-checkbox" onchange="evaluateTriage()"> ${s}
    </label>
  `).join('');
  document.getElementById('triage-result').style.display = 'none';
  goToStep(6);
  evaluateTriage(); // Run once for baseline
}

function evaluateTriage() {
  const checks = document.querySelectorAll('.safety-checkbox');
  let hasRedFlag = false;
  checks.forEach(c => { if (c.checked) hasRedFlag = true; });

  const activeMember = state.householdMembers.find(m => m.memberId === state.activeHouseholdMemberId);
  const isHighRisk = activeMember && (activeMember.memberType === 'child' || activeMember.pregnant === 'yes' || activeMember.memberType === 'older_adult');

  let rec = 'Urgent Care';
  let rat = 'Based on your symptoms and no safety flags checked, an Urgent Care can likely handle this appropriately at a lower cost.';
  let bg = 'rgba(34,197,94,0.1)';
  let col = '#22c55e';

  if (hasRedFlag) {
    rec = 'Emergency Room (ER)';
    rat = 'You selected a critical safety flag. Please seek emergency medical care immediately.';
    bg = 'rgba(239,68,68,0.1)';
    col = '#ef4444';
  } else if (isHighRisk && (state.currentArchetype.id === 'fever_dehydration' || state.currentArchetype.id === 'abd_pain' || state.currentArchetype.id === 'chest_pain')) {
    rec = 'Emergency Room (ER)';
    rat = 'High-risk patient populations with these symptoms often require ER evaluation.';
    bg = 'rgba(239,68,68,0.1)';
    col = '#ef4444';
  }

  const res = document.getElementById('triage-result');
  res.style.display = 'block';
  res.style.backgroundColor = bg;
  res.style.borderColor = col;
  document.getElementById('triage-recommendation').textContent = `Recommendation: ${rec}`;
  document.getElementById('triage-recommendation').style.color = col;
  document.getElementById('triage-rationale').textContent = rat;
  state.recommendedSetting = rec === 'Emergency Room (ER)' ? 'emergency_room' : 'urgent_care';
}

function completeTriageAndShowMap() {
  showMap();
}

// Map
function showMap() {
  document.getElementById('onboarding-overlay').classList.add('hidden');
  document.getElementById('map-container').classList.remove('hidden');
  const m = state.householdMembers.find(x => x.memberId === state.activeHouseholdMemberId);
  if (m) {
    const brand = BRANDS.find(b => b.id === m.carrierBrand)?.label || 'No Insurance';
    const struct = m.planStructure && m.planStructure !== 'unsure' ? m.planStructure.toUpperCase() : '';
    document.getElementById('plan-display').textContent = `${brand} ${struct}`.trim();
  }
  initMap();
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(pos => { state.userLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude }; if (state.map) state.map.setCenter([state.userLocation.lng, state.userLocation.lat]); fetchFacilities(); },
      () => { state.userLocation = DEFAULT_CENTER; fetchFacilities(); }, { enableHighAccuracy: true, timeout: 5000 });
  } else { state.userLocation = DEFAULT_CENTER; fetchFacilities(); }
}

function initMap() {
  mapboxgl.accessToken = MAPBOX_TOKEN;
  try {
    state.map = new mapboxgl.Map({ container: 'map', style: 'mapbox://styles/mapbox/dark-v11', center: [DEFAULT_CENTER.lng, DEFAULT_CENTER.lat], zoom: DEFAULT_ZOOM, attributionControl: false });
    state.map.addControl(new mapboxgl.NavigationControl(), 'bottom-right');
    state.map.addControl(new mapboxgl.GeolocateControl({ positionOptions: { enableHighAccuracy: true }, trackUserLocation: true }), 'bottom-right');
  } catch (e) {
    console.error('Mapbox init failed:', e);
    document.getElementById('map').innerHTML = `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:16px;background:#1a1a2e"><p style="color:#94a3b8;font-size:14px;text-align:center;max-width:400px">Map requires a valid Mapbox token.<br>Set <code style="background:rgba(255,255,255,.1);padding:2px 6px;border-radius:4px">MAPBOX_TOKEN</code> in app.js<br><br>Get a free token at <a href="https://mapbox.com" target="_blank" style="color:#06b6d4">mapbox.com</a></p></div>`;
  }
}

async function fetchFacilities() {
  const m = state.householdMembers.find(x => x.memberId === state.activeHouseholdMemberId);
  if (!m) return;
  const loc = state.userLocation || DEFAULT_CENTER;
  showLoading(true);

  try {
    const archetypeId = state.currentArchetype ? state.currentArchetype.id : 'minor_illness';
    const insFamily = m.insuranceFamily || 'other_unsure';
    const planStruct = m.planStructure || 'unsure';
    const dedStatus = m.deductibleStatus || 'unsure';

    // Simulated network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    let facs = [];
    DEMO_FACILITIES.forEach(f => {
      const d = haversine(loc.lat, loc.lng, f.latitude, f.longitude);
      if (d <= 100) {
        const cov = calculateCosts(f, insFamily, planStruct, dedStatus, archetypeId, d);
        facs.push({ ...f, distance_miles: Math.round(d * 10) / 10, coverage: cov });
      }
    });

    facs.sort((a, b) => b.coverage.score - a.coverage.score);
    state.facilities = facs.slice(0, 50);
    saveCache(state.facilities, loc.lat, loc.lng, m.memberId);

    document.getElementById('freshness-text').textContent = `Demo Data (Local) · ${state.facilities.length} facilities`;
    document.getElementById('cache-banner').classList.add('hidden');
    renderMarkers();
  } catch (e) {
    console.error("Local fetch simulation failed:", e);
    document.getElementById('freshness-text').textContent = 'Error loading demo data.';
  }
  showLoading(false);
}

function retryFetch() { fetchFacilities(); }

function renderMarkers() {
  state.markers.forEach(m => m.remove());
  state.markers = [];
  if (!state.map) return;
  state.facilities.forEach(f => {
    if (!f.latitude || !f.longitude) return;
    const d = f.coverage?.display || 'grey';
    const icon = f.facility_type === 'hospital_er' ? '🏥' : f.facility_type === 'freestanding_er' ? '🚑' : f.facility_type === 'urgent_care' ? '⚕️' : '🩺';
    const el = document.createElement('div');
    el.className = 'map-marker';
    el.innerHTML = `<div class="marker-pin ${d}"><span class="marker-icon">${icon}</span></div>`;
    el.addEventListener('click', e => { e.stopPropagation(); openFacilityCard(f); });
    try {
      const popup = new mapboxgl.Popup({ offset: 25, closeButton: false, className: 'marker-popup' }).setHTML(`<strong>${esc(f.facility_name)}</strong><br><span style="color:${d === 'green' ? '#22c55e' : d === 'red' ? '#ef4444' : '#6b7280'}">${f.distance_miles || '?'} mi</span>`);
      const marker = new mapboxgl.Marker({ element: el, anchor: 'bottom' }).setLngLat([f.longitude, f.latitude]).setPopup(popup).addTo(state.map);
      el.addEventListener('mouseenter', () => marker.togglePopup());
      el.addEventListener('mouseleave', () => marker.getPopup().isOpen() && marker.togglePopup());
      state.markers.push(marker);
    } catch { }
  });
}

// Facility Card
function openFacilityCard(f) {
  state.selectedFacility = f;
  const card = document.getElementById('facility-card');
  const cov = f.coverage || {};
  const d = cov.display || 'grey';
  const badge = document.getElementById('card-status-badge');
  badge.className = `card-status-badge ${d}`;
  badge.textContent = d === 'green' ? `IN-NETWORK` : d === 'red' ? `OUT-OF-NETWORK` : 'COVERAGE UNVERIFIED';
  document.getElementById('card-name').textContent = f.facility_name;
  document.getElementById('card-type').textContent = (f.facility_type || '').replace(/_/g, ' ').toUpperCase();
  document.getElementById('card-address').textContent = f.address || '';
  document.getElementById('card-distance').textContent = f.distance_miles ? `${f.distance_miles} mi away` : '';
  document.getElementById('card-confidence').textContent = cov.score != null ? `Match Score: ${parseInt(cov.score * 100)}/100` : '';

  // Cost Section
  const costSec = document.getElementById('card-cost-section');
  if (cov.likely_you_pay != null) {
    costSec.style.display = 'block';
    document.getElementById('card-cost-likely').textContent = `$${cov.likely_you_pay}`;
    document.getElementById('card-cost-upto').textContent = `$${cov.could_be_up_to}`;

    const riskBadge = document.getElementById('card-risk-badge');
    riskBadge.textContent = `${cov.bill_risk} Risk`;
    riskBadge.style.backgroundColor = cov.bill_risk === 'Low' ? 'rgba(34,197,94,0.1)' : cov.bill_risk === 'Medium' ? 'rgba(234,179,8,0.1)' : 'rgba(239,68,68,0.1)';
    riskBadge.style.color = cov.bill_risk === 'Low' ? '#22c55e' : cov.bill_risk === 'Medium' ? '#eab308' : '#ef4444';

    const certBadge = document.getElementById('card-certainty-badge');
    certBadge.textContent = `${cov.network_certainty} Certainty`;
    certBadge.style.backgroundColor = cov.network_certainty === 'High' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)';
    certBadge.style.color = cov.network_certainty === 'High' ? '#22c55e' : '#ef4444';
  } else {
    costSec.style.display = 'none';
  }

  const w = document.getElementById('card-wait');
  if (f.wait_time_minutes != null) { w.classList.remove('hidden'); document.getElementById('card-wait-text').textContent = `Est. wait: ${f.wait_time_minutes} min`; } else { w.classList.add('hidden'); }
  document.getElementById('card-verified-text').textContent = cov.verified_at ? `Verified ${cov.verified_at}` : '';
  document.getElementById('card-sources').textContent = cov.source_count ? `${cov.source_count} source${cov.source_count > 1 ? 's' : ''}` : '';

  // hide nudge section since Triage now handles this upfront
  const nudge = document.getElementById('er-nudge-section');
  if (nudge) nudge.classList.add('hidden');

  const call = document.getElementById('card-call');
  const phoneLink = document.getElementById('card-phone-link');
  if (f.phone) {
    call.href = `tel:${f.phone.replace(/\D/g, '')}`; call.style.display = '';
    phoneLink.href = `tel:${f.phone.replace(/\D/g, '')}`; phoneLink.textContent = f.phone; phoneLink.style.display = '';
  } else { call.style.display = 'none'; phoneLink.style.display = 'none'; }
  card.classList.remove('hidden');
}

function closeFacilityCard() { document.getElementById('facility-card').classList.add('hidden'); state.selectedFacility = null; }

function openDirections() {
  if (!state.selectedFacility) return;
  const f = state.selectedFacility;
  const addr = encodeURIComponent(f.address || `${f.latitude},${f.longitude}`);
  window.open(`https://www.google.com/maps/dir/?api=1&destination=${addr}`, '_blank');
}

// Report
let reportStatus = null;
function reportIncorrect() { if (!state.selectedFacility) return; document.getElementById('report-facility-name').textContent = state.selectedFacility.facility_name; document.getElementById('report-modal').classList.remove('hidden'); reportStatus = null; document.querySelectorAll('.status-option').forEach(o => o.classList.remove('selected')); }
function closeReportModal() { document.getElementById('report-modal').classList.add('hidden'); }
function selectReportStatus(el) { document.querySelectorAll('.status-option').forEach(o => o.classList.remove('selected')); el.classList.add('selected'); reportStatus = el.dataset.status; }
async function submitReport() {
  if (!reportStatus || !state.selectedFacility) return;
  const m = state.householdMembers.find(x => x.memberId === state.activeHouseholdMemberId);
  try {
    // Simulate API delay instead of calling backend
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log(`Mock report submitted: ${state.selectedFacility.facility_id} as ${reportStatus}`);
  } catch { }
  closeReportModal(); closeFacilityCard();
  showToast('Report submitted. Thank you!');
}

// Household
function toggleHouseholdPanel() { document.getElementById('household-panel').classList.toggle('hidden'); renderMemberList(); }
function renderMemberList() {
  document.getElementById('member-list').innerHTML = state.householdMembers.map(m => {
    let popLabel = '';
    if (m.plan && m.plan.population && m.plan.population !== 'commercial') {
      const names = { 'medicaid': 'Medicaid', 'chip': 'CHIP', 'medicare_advantage': 'Medicare Advantage' };
      popLabel = `<span class="member-plan" style="color:var(--accent);font-weight:600;margin-top:2px;">${names[m.plan.population] || m.plan.population}</span>`;
    }
    return `<div class="member-item ${m.memberId === state.activeHouseholdMemberId ? 'active' : ''}" onclick="switchMember('${m.memberId}')"><div class="member-info"><span class="member-name">${esc(m.displayName)}</span><span class="member-plan">${esc(m.plan.planDisplayName)}</span>${popLabel}</div>${m.memberId === state.activeHouseholdMemberId ? '<span class="member-active-badge">Active</span>' : ''}</div>`;
  }).join('');
}

let profileModalMemberId = null;

function switchMember(id) {
  const m = state.householdMembers.find(x => x.memberId === id);
  if (!m) return;
  profileModalMemberId = id;

  document.getElementById('profile-name').value = m.displayName || '';
  document.getElementById('profile-dob').value = m.dob || '';
  document.getElementById('profile-sex').value = m.sex || '';
  document.getElementById('profile-notes').value = m.notes || '';

  const brand = BRANDS.find(b => b.id === m.carrierBrand)?.label || 'No Insurance';
  const struct = m.planStructure && m.planStructure !== 'unsure' ? m.planStructure.toUpperCase() : '';
  const planName = `${brand} ${struct}`.trim();

  let popLabel = '';
  if (m.insuranceFamily === 'medicaid' || m.insuranceFamily === 'medicare_advantage') {
    const names = { 'medicaid': 'Medicaid', 'medicare_advantage': 'Medicare Advantage' };
    popLabel = `<span style="display:inline-block; margin-top:4px; font-weight:600; color:var(--accent);">${names[m.insuranceFamily] || m.insuranceFamily}</span>`;
  }
  document.getElementById('profile-current-plan').innerHTML = `<strong>${esc(planName)}</strong><br>${popLabel}`;

  document.getElementById('household-panel').classList.add('hidden');
  document.getElementById('profile-modal').classList.remove('hidden');
}

function closeProfileModal() {
  document.getElementById('profile-modal').classList.add('hidden');
  profileModalMemberId = null;
  // Re-open household panel if we back out
  document.getElementById('household-panel').classList.remove('hidden');
}

function saveProfile() {
  if (!profileModalMemberId) return;
  const m = state.householdMembers.find(x => x.memberId === profileModalMemberId);
  if (m) {
    m.displayName = document.getElementById('profile-name').value.trim() || 'Member';
    m.dob = document.getElementById('profile-dob').value;
    m.sex = document.getElementById('profile-sex').value;
    m.notes = document.getElementById('profile-notes').value.trim();
    saveState();

    // Auto-switch to this member if saved
    state.activeHouseholdMemberId = m.memberId;
    saveState();

    const brand = BRANDS.find(b => b.id === m.carrierBrand)?.label || 'No Insurance';
    const struct = m.planStructure && m.planStructure !== 'unsure' ? m.planStructure.toUpperCase() : '';
    document.getElementById('plan-display').textContent = `${brand} ${struct}`.trim();

    fetchFacilities();
    closeFacilityCard();
    renderMemberList();
  }
  document.getElementById('profile-modal').classList.add('hidden');
  profileModalMemberId = null;
}

function editMemberInsurance() {
  if (!profileModalMemberId) return;
  const m = state.householdMembers.find(x => x.memberId === profileModalMemberId);
  if (m) {
    document.getElementById('profile-modal').classList.add('hidden');
    document.getElementById('map-container').classList.add('hidden');
    document.getElementById('onboarding-overlay').classList.remove('hidden');

    state.draftProfile = { ...m };

    // Remove the old member record, they will be recreated at the end of the flow
    state.householdMembers = state.householdMembers.filter(x => x.memberId !== m.memberId);
    saveState();

    document.getElementById('member-name').value = m.displayName;
    document.getElementById('member-type').value = m.memberType || 'adult';
    document.getElementById('member-pregnant').value = m.pregnant || 'no';
    goToStep(1);
  }
}

function startOnboardingForNewMember() {
  document.getElementById('household-panel').classList.add('hidden');
  document.getElementById('map-container').classList.add('hidden');
  document.getElementById('onboarding-overlay').classList.remove('hidden');

  goToStep(1);
}

// Utilities
function showLoading(show) { const o = document.getElementById('loading-overlay'); if (show) o.classList.remove('hidden'); else o.classList.add('hidden'); }
function showToast(msg) { const t = document.createElement('div'); t.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);z-index:9999;padding:12px 24px;background:rgba(34,197,94,.9);color:white;border-radius:100px;font-size:14px;font-weight:600;animation:fadeIn .3s ease;box-shadow:0 4px 16px rgba(34,197,94,.3)'; t.textContent = msg; document.body.appendChild(t); setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity .3s'; setTimeout(() => t.remove(), 300); }, 3000); }
function genId() { return Date.now().toString(36) + Math.random().toString(36).substr(2); }
function esc(s) { if (!s) return ''; const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
async function fetchTimeout(url, opts = {}) { const c = new AbortController(); const t = setTimeout(() => c.abort(), 5000); try { const r = await fetch(url, { ...opts, signal: c.signal }); clearTimeout(t); if (!r.ok) throw new Error(`HTTP ${r.status}`); return r; } catch (e) { clearTimeout(t); throw e; } }

function toggleHouseholdPanel() { document.getElementById('household-panel').classList.toggle('hidden'); renderMemberList(); }
function switchMember(id) {
  state.activeHouseholdMemberId = id;
  saveState();
  const m = state.householdMembers.find(x => x.memberId === id);
  if (m) {
    const brand = BRANDS.find(b => b.id === m.carrierBrand)?.label || 'No Insurance';
    const struct = m.planStructure && m.planStructure !== 'unsure' ? m.planStructure.toUpperCase() : '';
    document.getElementById('plan-display').textContent = `${brand} ${struct}`.trim();
  }
  document.getElementById('household-panel').classList.add('hidden');
  fetchFacilities();
  closeFacilityCard();
}
function renderMemberList() {
  document.getElementById('member-list').innerHTML = state.householdMembers.map(m => {
    let popLabel = '';
    const fam = m.insuranceFamily;
    if (fam === 'medicaid' || fam === 'medicare_advantage') {
      const names = { 'medicaid': 'Medicaid', 'medicare_advantage': 'Medicare' };
      popLabel = `<span class="member-plan" style="color:var(--accent);font-weight:600;margin-top:2px;">${names[fam] || fam}</span>`;
    }
    const brand = BRANDS.find(b => b.id === m.carrierBrand)?.label || 'No Insurance';
    const struct = m.planStructure && m.planStructure !== 'unsure' ? m.planStructure.toUpperCase() : '';
    const planName = `${brand} ${struct}`.trim();
    return `<div class="member-item ${m.memberId === state.activeHouseholdMemberId ? 'active' : ''}" onclick="switchMember('${m.memberId}')"><div class="member-info"><span class="member-name">${esc(m.displayName)}</span><span class="member-plan">${esc(planName)}</span>${popLabel}</div>${m.memberId === state.activeHouseholdMemberId ? '<span class="member-active-badge">Active</span>' : ''}</div>`;
  }).join('');
}
