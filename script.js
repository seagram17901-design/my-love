const CORRECT_DATE = "021268";
const PHOTO_SLOT_COUNT = 8;
const GALLERY_INTERVAL = 4350;
const MUSIC_START_SECONDS = 34;
const MUSIC_VOLUME = 0.72;
const MUSIC_FADE_DURATION = 4600;
const MUSIC_FADE_STEPS = 46;

// Replace null with your image path for each slot, for example: "photos/photo-01.jpg".
const PHOTO_SLOTS = [
  {
    title: "ถ่ายรูปด้วยกันครั้งแรก ",
    caption: "เธอสวยมากผมเธอหอมด้วยมีแก้มด้วยย",
    image: "/p1.jpeg",
    gradient: "linear-gradient(135deg, #642040, #f48299)",
  },
  {
    title: "รอหมาล่า",
    caption: "รอหมาล่านานมากกกเที่ยวสนุกมากที่มัดผมยังสีสวยอยู่เลย",
    image: "/p2.jpeg",
    gradient: "linear-gradient(135deg, #421c52, #ff9eb5)",
  },
  {
    title: "ถ่ายรูปที่บ้านเค้า",
    caption: "เธอใส่ฟิลเตอร์ให้จนเค้าตาหวานเวอร์แต่เธอสวยมาก",
    image: "/p3.jpeg",
    gradient: "linear-gradient(135deg, #173f4c, #f2c884)",
  },
  {
    title: "พึ่งรู้",
    caption: "เค้าพึ่งรู้ว่าเธอชอบใช้ฟิลเตอร์แบบนี้น่ารักก",
    image: "/p4.jpeg",
    gradient: "linear-gradient(135deg, #692233, #ffc1a8)",
  },
  {
    title: "ถ่ายรูปตู้กับเธอครั้งแรก",
    caption: "ทำตัวไม่ถูกเหมือนกันจะถ่ายไงดีเธอสวยเค้าลืมว่าเธอมีกระเป๋านี้แล้ว",
    image: "/p5.jpeg",
    gradient: "linear-gradient(135deg, #253d64, #ff7f9f)",
  },
  {
    title: "บ้านเธอครั้งแรก",
    caption: "เค้าไปบ้านเธอได้ด้วยได้ที่มัดผมเธอที่หวงมากๆด้วยย",
    image: "/p6.jpeg",
    gradient: "linear-gradient(135deg, #5b1835, #f6dba8)",
  },
  {
    title: "ถ่ายรูปตู้",
    caption: "คราวนี้มีตัวอย่างให้ดูด้วยยเป็นสเต็ปเวอร์",
    image: "/p7.jpeg",
    gradient: "linear-gradient(135deg, #1f214d, #f7749c)",
  },
  {
    title: "จบแล้ว",
    caption: "เค้าใจหายนะแต่เค้าก็ยังจะรักเธอต่อไป",
    image: "/p8.jpeg",
    gradient: "linear-gradient(135deg, #461326, #ffcfdf)",
  },
];

const gate = document.querySelector("#gate");
const gallery = document.querySelector("#gallery");
const finale = document.querySelector("#finale");
const form = document.querySelector("#anniversaryForm");
const dateInput = document.querySelector("#anniversaryDate");
const accessMessage = document.querySelector("#accessMessage");
const photoCard = document.querySelector("#photoCard");
const photoPlaceholder = document.querySelector("#photoPlaceholder");
const slotNumber = document.querySelector("#slotNumber");
const galleryTitle = document.querySelector("#galleryTitle");
const galleryCaption = document.querySelector("#galleryCaption");
const progressDots = document.querySelector("#progressDots");
const finaleHearts = document.querySelector("#finaleHearts");
const finalMessage = document.querySelector("#finalMessage");
const backgroundMusic = document.querySelector("#backgroundMusic");
const heartCanvas = document.querySelector("#heartCanvas");
const ctx = heartCanvas.getContext("2d");

let particles = [];
let animationFrame = 0;
let galleryTimer = 0;
let activeSlot = 0;
let finaleStarted = false;
let musicFadeTimer = 0;
let musicRetryHandler = null;

const clampSlotCount = Math.min(PHOTO_SLOT_COUNT, PHOTO_SLOTS.length);

function normalizeDate(value) {
  return value.replace(/\D/g, "");
}

function setScene(activeScene) {
  [gate, gallery, finale].forEach((scene) => {
    scene.classList.toggle("is-active", scene === activeScene);
    scene.classList.remove("is-leaving");
  });
}

function startMusic() {
  window.clearInterval(musicFadeTimer);

  if (!backgroundMusic) {
    return;
  }

  backgroundMusic.pause();
  backgroundMusic.muted = false;
  backgroundMusic.volume = MUSIC_VOLUME;

  try {
    backgroundMusic.currentTime = MUSIC_START_SECONDS;
  } catch {
    backgroundMusic.addEventListener(
      "loadedmetadata",
      () => {
        backgroundMusic.currentTime = MUSIC_START_SECONDS;
      },
      { once: true }
    );
  }

  const playPromise = backgroundMusic.play();

  if (playPromise && typeof playPromise.catch === "function") {
    playPromise.catch(() => {
      if (musicRetryHandler) {
        document.removeEventListener("pointerdown", musicRetryHandler);
      }

      musicRetryHandler = () => {
        backgroundMusic.currentTime = MUSIC_START_SECONDS;
        backgroundMusic.volume = MUSIC_VOLUME;
        backgroundMusic.play();
      };

      document.addEventListener("pointerdown", musicRetryHandler, { once: true });
    });
  }
}

function fadeOutMusic() {
  window.clearInterval(musicFadeTimer);

  if (!backgroundMusic) {
    return;
  }

  let currentStep = 0;
  const startingVolume = backgroundMusic.volume || MUSIC_VOLUME;
  const stepDuration = MUSIC_FADE_DURATION / MUSIC_FADE_STEPS;

  musicFadeTimer = window.setInterval(() => {
    currentStep += 1;
    const progress = currentStep / MUSIC_FADE_STEPS;
    const nextVolume = Math.max(0, startingVolume * (1 - progress));

    backgroundMusic.volume = nextVolume;

    if (currentStep >= MUSIC_FADE_STEPS) {
      window.clearInterval(musicFadeTimer);
      backgroundMusic.pause();
      backgroundMusic.currentTime = MUSIC_START_SECONDS;
      backgroundMusic.volume = MUSIC_VOLUME;
    }
  }, stepDuration);
}

function createDots() {
  progressDots.innerHTML = "";

  for (let index = 0; index < clampSlotCount; index += 1) {
    const dot = document.createElement("span");
    if (index === 0) {
      dot.classList.add("is-active");
    }
    progressDots.appendChild(dot);
  }
}

function updateDots(index) {
  [...progressDots.children].forEach((dot, dotIndex) => {
    dot.classList.toggle("is-active", dotIndex === index);
  });
}

function showSlot(index) {
  const slot = PHOTO_SLOTS[index];
  const displayNumber = String(index + 1).padStart(2, "0");
  const wasVisible = photoCard.classList.contains("is-visible");

  photoCard.classList.remove("is-entering");

  if (wasVisible) {
    photoCard.classList.remove("is-visible");
    photoCard.classList.add("is-exiting");
  }

  window.setTimeout(() => {
    galleryTitle.textContent = slot.title;
    galleryCaption.textContent = slot.caption;
    slotNumber.textContent = displayNumber;
    photoPlaceholder.style.setProperty("--photo-gradient", slot.gradient);

    if (slot.image) {
      photoPlaceholder.style.backgroundImage = `url("${slot.image}")`;
      photoPlaceholder.classList.add("has-image");
    } else {
      photoPlaceholder.style.backgroundImage = slot.gradient;
      photoPlaceholder.classList.remove("has-image");
    }

    updateDots(index);
    photoCard.classList.remove("is-exiting", "is-visible");
    photoCard.classList.add("is-entering");

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        photoCard.classList.remove("is-entering");
        photoCard.classList.add("is-visible");
      });
    });
  }, wasVisible ? 520 : 0);
}

function startGallery() {
  activeSlot = 0;
  createDots();
  showSlot(activeSlot);

  window.clearInterval(galleryTimer);
  galleryTimer = window.setInterval(() => {
    activeSlot += 1;

    if (activeSlot >= clampSlotCount) {
      window.clearInterval(galleryTimer);
      beginFinale();
      return;
    }

    showSlot(activeSlot);
  }, GALLERY_INTERVAL);
}

function beginFinale() {
  if (finaleStarted) {
    return;
  }

  finaleStarted = true;
  gallery.classList.add("is-leaving");

  window.setTimeout(() => {
    setScene(finale);
    createFinaleHearts();
  }, 1300);

  window.setTimeout(() => {
    finalMessage.classList.add("is-visible");
    fadeOutMusic();
  }, 8400);
}

function createFinaleHearts() {
  finaleHearts.innerHTML = "";
  const colors = ["#ff5f8d", "#ffc4cf", "#ff7ea7", "#f6dba8", "#ffffff"];
  const heartCount = 86;

  for (let index = 0; index < heartCount; index += 1) {
    const heart = document.createElement("span");
    heart.className = "floating-heart";
    heart.style.setProperty("--start-x", `${Math.random() * 104 - 2}vw`);
    heart.style.setProperty("--drift", `${Math.random() * 34 - 17}vw`);
    heart.style.setProperty("--size", `${Math.random() * 18 + 8}px`);
    heart.style.setProperty("--delay", `${Math.random() * 3.6}s`);
    heart.style.setProperty("--duration", `${Math.random() * 3.4 + 5.4}s`);
    heart.style.setProperty("--opacity", `${Math.random() * 0.48 + 0.46}`);
    heart.style.setProperty("--heart-color", colors[index % colors.length]);
    finaleHearts.appendChild(heart);
  }
}

function handleGateSubmit(event) {
  event.preventDefault();
  const normalized = normalizeDate(dateInput.value);

  accessMessage.classList.remove("is-denied", "is-granted");

  if (normalized !== CORRECT_DATE) {
    accessMessage.textContent = "Access denied. This page opens only for our day.";
    accessMessage.classList.add("is-denied");
    dateInput.setAttribute("aria-invalid", "true");
    dateInput.focus();
    return;
  }

  accessMessage.textContent = "Access granted. Welcome to our memories.";
  accessMessage.classList.add("is-granted");
  dateInput.setAttribute("aria-invalid", "false");
  startMusic();
  gate.classList.add("is-leaving");

  window.setTimeout(() => {
    setScene(gallery);
    startGallery();
  }, 950);
}

function formatDateInput(event) {
  const digits = normalizeDate(event.target.value).slice(0, 6);
  const parts = [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 6)].filter(Boolean);
  event.target.value = parts.join("/");
}

function pointOnHeart(t) {
  const x = 16 * Math.sin(t) ** 3;
  const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
  return { x, y: -y };
}

function resizeCanvas() {
  const { innerWidth, innerHeight, devicePixelRatio } = window;
  heartCanvas.width = innerWidth * devicePixelRatio;
  heartCanvas.height = innerHeight * devicePixelRatio;
  heartCanvas.style.width = `${innerWidth}px`;
  heartCanvas.style.height = `${innerHeight}px`;
  ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  createHeartParticles();
}

function createHeartParticles() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const centerX = width / 2;
  const centerY = height * 0.43;
  const scale = Math.min(width, height) / 34;
  const count = Math.max(120, Math.min(230, Math.floor(width / 6)));

  particles = Array.from({ length: count }, (_, index) => {
    const t = (Math.PI * 2 * index) / count;
    const point = pointOnHeart(t);
    const layer = 0.76 + (index % 5) * 0.055;

    return {
      x: centerX + point.x * scale * layer + (Math.random() - 0.5) * width * 0.16,
      y: centerY + point.y * scale * layer + (Math.random() - 0.5) * height * 0.16,
      targetX: centerX + point.x * scale * layer,
      targetY: centerY + point.y * scale * layer,
      size: Math.random() * 5 + 4,
      speed: Math.random() * 0.032 + 0.035,
      phase: Math.random() * Math.PI * 2,
      color: index % 3 === 0 ? "#ffc4cf" : index % 3 === 1 ? "#ff5f8d" : "#f6dba8",
    };
  });
}

function drawCanvasHeart(x, y, size, color, rotation, alpha) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.scale(size / 20, size / 20);
  ctx.beginPath();
  ctx.moveTo(0, 7);
  ctx.bezierCurveTo(-14, -4, -7, -17, 0, -8);
  ctx.bezierCurveTo(7, -17, 14, -4, 0, 7);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 12;
  ctx.globalAlpha = alpha;
  ctx.fill();
  ctx.restore();
}

function animateHearts(time = 0) {
  const width = window.innerWidth;
  const height = window.innerHeight;

  ctx.clearRect(0, 0, width, height);

  particles.forEach((particle, index) => {
    const pulse = Math.sin(time * 0.002 + particle.phase) * 8;
    const orbitX = Math.cos(time * 0.0014 + particle.phase) * (6 + (index % 4));
    const orbitY = Math.sin(time * 0.0017 + particle.phase) * (5 + (index % 3));
    const targetX = particle.targetX + orbitX;
    const targetY = particle.targetY + orbitY + pulse * 0.18;

    particle.x += (targetX - particle.x) * particle.speed;
    particle.y += (targetY - particle.y) * particle.speed;

    const alpha = 0.62 + Math.sin(time * 0.002 + particle.phase) * 0.22;
    drawCanvasHeart(
      particle.x,
      particle.y,
      particle.size + Math.sin(time * 0.003 + particle.phase) * 1.5,
      particle.color,
      Math.sin(time * 0.001 + particle.phase) * 0.25,
      alpha
    );
  });

  animationFrame = window.requestAnimationFrame(animateHearts);
}

form.addEventListener("submit", handleGateSubmit);
dateInput.addEventListener("input", formatDateInput);
window.addEventListener("resize", resizeCanvas);

createDots();
resizeCanvas();
animationFrame = window.requestAnimationFrame(animateHearts);

window.addEventListener("beforeunload", () => {
  window.cancelAnimationFrame(animationFrame);
  window.clearInterval(galleryTimer);
  window.clearInterval(musicFadeTimer);
});
