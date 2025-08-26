// --- Gestion des onglets ---
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.experiment').forEach(exp => exp.classList.remove('active'));

    btn.classList.add('active');
    document.getElementById(btn.getAttribute('data-target')).classList.add('active');
  });
});


// --- Script Électrophorèse ---
let isRunning = false;
let startTime = 0;
let animationId = null;
let voltage = 120;
let fragments = [];

const fragmentConfig = [
  { size: 10000, color: '#ff6b6b', speed: 0.5 },
  { size: 5000, color: '#4ecdc4', speed: 1.0 },
  { size: 2000, color: '#45b7d1', speed: 1.8 },
  { size: 1000, color: '#96ceb4', speed: 2.5 },
  { size: 500, color: '#ffd93d', speed: 4.0 }
];

function createFragments() {
  const gelArea = document.getElementById('gel-area');

  fragments.forEach(frag => {
    if (frag.element.parentNode) frag.element.parentNode.removeChild(frag.element);
  });
  fragments = [];

  fragmentConfig.forEach((config, index) => {
    const fragment = document.createElement('div');
    fragment.className = 'dna-fragment';
    fragment.style.backgroundColor = config.color;
    fragment.style.boxShadow = `0 0 10px ${config.color}`;

    const startX = 340 + (index * 45);
    const startY = 35;
    fragment.style.left = startX + 'px';
    fragment.style.top = startY + 'px';

    gelArea.appendChild(fragment);

    fragments.push({
      element: fragment,
      currentY: startY,
      speed: config.speed,
      color: config.color,
      size: config.size
    });
  });
}

function migrate() {
  if (!isRunning) return;
  let maxProgress = 0;

  fragments.forEach(fragment => {
    if (fragment.currentY < 350) {
      const speedMultiplier = voltage / 120;
      fragment.currentY += fragment.speed * speedMultiplier;
      fragment.element.style.top = fragment.currentY + 'px';

      const glow = 8 + Math.random() * 6;
      fragment.element.style.boxShadow = `0 0 ${glow}px ${fragment.color}`;

      const progress = ((fragment.currentY - 35) / 315) * 100;
      maxProgress = Math.max(maxProgress, Math.min(progress, 100));
    }
  });

  document.getElementById('progress-fill').style.width = maxProgress + '%';

  const elapsed = Date.now() - startTime;
  const minutes = Math.floor(elapsed / 60000);
  const seconds = Math.floor((elapsed % 60000) / 1000);
  document.getElementById('time-display').textContent = 
    `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  if (maxProgress < 100) {
    animationId = requestAnimationFrame(migrate);
  } else {
    stopMigration();
    document.getElementById('status-text').textContent = 'Migration terminée!';
  }
}

function startMigration() {
  if (!isRunning) {
    isRunning = true;
    startTime = Date.now();
    document.getElementById('start-btn').disabled = true;
    document.getElementById('pause-btn').disabled = false;
    document.getElementById('status-text').textContent = 'Migration en cours...';
    migrate();
  }
}

function pauseMigration() {
  if (isRunning) {
    isRunning = false;
    document.getElementById('start-btn').disabled = false;
    document.getElementById('pause-btn').disabled = true;
    document.getElementById('status-text').textContent = 'Migration en pause';
    if (animationId) cancelAnimationFrame(animationId);
  }
}

function stopMigration() {
  isRunning = false;
  document.getElementById('start-btn').disabled = false;
  document.getElementById('pause-btn').disabled = true;
  if (animationId) cancelAnimationFrame(animationId);
}

function resetMigration() {
  stopMigration();
  document.getElementById('status-text').textContent = 'Prêt à commencer';
  document.getElementById('time-display').textContent = '00:00';
  document.getElementById('progress-fill').style.width = '0%';
  createFragments();
}

function updateVoltage() {
  voltage = parseInt(document.getElementById('voltage-slider').value);
  document.getElementById('voltage-display').textContent = voltage + 'V';
}

document.addEventListener('DOMContentLoaded', function() {
  createFragments();
  document.getElementById('start-btn').addEventListener('click', startMigration);
  document.getElementById('pause-btn').addEventListener('click', pauseMigration);
  document.getElementById('reset-btn').addEventListener('click', resetMigration);
  document.getElementById('voltage-slider').addEventListener('input', updateVoltage);
});


// --- Script Simulateur EPI ---
let activeEPI = new Set();

const epiValues = {
  'gants': 15,
  'blouse': 20,
  'lunettes': 15,
  'masque': 20,
  'chaussures': 10,
  'charlotte': 10,
  'combinaison': 30
};

document.querySelectorAll('.epi-item').forEach(item => {
  item.addEventListener('click', function() {
    const epiType = this.getAttribute('data-epi');
    toggleEPI(epiType, this);
  });
});

function toggleEPI(epiType, element) {
  if (activeEPI.has(epiType)) {
    activeEPI.delete(epiType);
    element.classList.remove('selected');
    hideEPIOnMannequin(epiType);
  } else {
    activeEPI.add(epiType);
    element.classList.add('selected');
    showEPIOnMannequin(epiType);
  }
  updateProtectionLevel();
  updateActiveEPIList();
}

function showEPIOnMannequin(epiType) {
  switch(epiType) {
    case 'gants':
      document.getElementById('gants-left').classList.add('active');
      document.getElementById('gants-right').classList.add('active');
      break;
    case 'chaussures':
      document.getElementById('chaussures-left').classList.add('active');
      document.getElementById('chaussures-right').classList.add('active');
      break;
    default:
      const element = document.getElementById(epiType + '-item');
      if (element) element.classList.add('active');
  }
}

function hideEPIOnMannequin(epiType) {
  switch(epiType) {
    case 'gants':
      document.getElementById('gants-left').classList.remove('active');
      document.getElementById('gants-right').classList.remove('active');
      break;
    case 'chaussures':
      document.getElementById('chaussures-left').classList.remove('active');
      document.getElementById('chaussures-right').classList.remove('active');
      break;
    default:
      const element = document.getElementById(epiType + '-item');
      if (element) element.classList.remove('active');
  }
}

function updateProtectionLevel() {
  let totalProtection = 0;
  activeEPI.forEach(epi => { totalProtection += epiValues[epi]; });
  const percentage = Math.min(100, totalProtection);
  document.getElementById('current-level').textContent = percentage;
  document.getElementById('level-fill').style.width = percentage + '%';

  const fill = document.getElementById('level-fill');
  if (percentage < 30) fill.style.background = '#dc3545';
  else if (percentage < 70) fill.style.background = '#ffc107';
  else fill.style.background = '#28a745';
}

function updateActiveEPIList() {
  const activeEPIDiv = document.getElementById('active-epi');
  if (activeEPI.size === 0) {
    activeEPIDiv.innerHTML = 'Aucun EPI sélectionné';
  } else {
    const epiNames = {
      'gants': 'Gants',
      'blouse': 'Blouse',
      'lunettes': 'Lunettes',
      'masque': 'Masque',
      'chaussures': 'Chaussures',
      'charlotte': 'Charlotte',
      'combinaison': 'Combinaison'
    };
    const activeList = Array.from(activeEPI).map(epi => epiNames[epi]).join('<br>• ');
    activeEPIDiv.innerHTML = '<strong>EPI actifs:</strong><br>• ' + activeList;
  }
}

function resetAll() {
  activeEPI.clear();
  document.querySelectorAll('.epi-item.selected').forEach(item => item.classList.remove('selected'));
  document.querySelectorAll('.epi-item-on-mannequin.active').forEach(item => item.classList.remove('active'));
  updateProtectionLevel();
  updateActiveEPIList();
}

window.addEventListener('load', function() {
  const epiItems = document.querySelectorAll('.epi-item');
  epiItems.forEach((item, index) => {
    setTimeout(() => {
      item.style.opacity = '0';
      item.style.transform = 'translateX(-20px)';
      item.style.transition = 'all 0.3s ease';
      setTimeout(() => {
        item.style.opacity = '1';
        item.style.transform = 'translateX(0)';
      }, 100);
    }, index * 100);
  });
});
