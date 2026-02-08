import LiquidBackground from 'https://cdn.jsdelivr.net/npm/threejs-components@0.0.27/build/backgrounds/liquid1.min.js'

const canvasEl = document.getElementById('canvas');
const staticImg = document.getElementById('staticImg');
const aboutCarousel = document.getElementById('aboutCarousel');
const portfolioCarousel = document.getElementById('portfolioCarousel');
const nav = document.getElementById("nav");
const toggle = document.getElementById("toggle");
const toggleImg = document.getElementById("toggleImg");

let app;

// 1. 초기화
async function initApp() {
    try {
        if (!canvasEl) return;
        app = LiquidBackground(canvasEl);
        await app.loadImage('image/mainpage.jpg');
        playRipple(null, 3.0, false); 
    } catch (e) {
        console.error("초기화 에러:", e);
    }
}

let stopTimeout;

// 2. 물결 효과 (딜레이 제거 및 속도 향상 버전)
function playRipple(newPath, seconds = 1.2, isQuick = true) {
    if (!app || !app.liquidPlane) return;
    clearTimeout(stopTimeout);
    
    const maxStrength = isQuick ? 0.4 : 1.0; 
    const stopDuration = isQuick ? 1200 : 2500; 

    if (newPath) {
        // 이미지가 더 빨리 반응하도록 트랜지션 단축
        staticImg.style.transition = `opacity ${isQuick ? '0.3s' : '0.5s'} ease-in-out`;
        staticImg.style.opacity = '0'; 
        app.liquidPlane.uniforms.displacementScale.value = 0;
        
        // 딜레이 없이 즉시 로드
        setTimeout(() => {
            staticImg.src = newPath;
            app.loadImage(newPath);
            staticImg.style.opacity = '1'; 
            canvasEl.style.opacity = '1';

            let val = 0;
            const fadeIn = setInterval(() => {
                val += isQuick ? 0.15 : 0.1; // 수치 증가폭 높임
                if (app && app.liquidPlane) app.liquidPlane.uniforms.displacementScale.value = val;
                if (val >= maxStrength) clearInterval(fadeIn);
            }, 16); // 간격을 줄여서 더 빠르게
        }, 0); 
    } else {
        canvasEl.style.opacity = '1';
        app.liquidPlane.uniforms.displacementScale.value = maxStrength;
    }

    stopTimeout = setTimeout(() => {
        const startTime = performance.now();
        function smoothlyStop(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / stopDuration, 1);
            if (app && app.liquidPlane) {
                const easeOut = 1 - Math.pow(1 - progress, 4); 
                app.liquidPlane.uniforms.displacementScale.value = maxStrength * (1 - easeOut);
                if (progress > 0.5) {
                    canvasEl.style.opacity = (1 - (progress - 0.5) * 2).toString();
                }
            }
            if (progress < 1) requestAnimationFrame(smoothlyStop);
            else {
                canvasEl.style.opacity = '0';
                if (app && app.liquidPlane) app.liquidPlane.uniforms.displacementScale.value = 0;
            }
        }
        requestAnimationFrame(smoothlyStop);
    }, seconds * 1000);
}

// 3. 카루셀 제어
function initCarousel(carouselId) {
    const carousel = document.getElementById(carouselId);
    if (!carousel) return { reset: () => {} };
    const viewport = carousel.querySelector('.carousel__viewport');
    const prevBtn = carousel.querySelector('.prev');
    const nextBtn = carousel.querySelector('.next');
    let currentIdx = 0;

    function updateSlide(idx) {
        const slides = viewport.querySelectorAll('.carousel__slide');
        currentIdx = idx;
        viewport.scrollTo({ left: viewport.offsetWidth * currentIdx, behavior: 'smooth' });
        if (nextBtn) nextBtn.style.display = (currentIdx === slides.length - 1) ? 'none' : 'flex';

        if (carouselId === 'aboutCarousel' && currentIdx === 6) {
            setTimeout(() => {
                playRipple('image/aboutme7.jpg', 2.0, false); 
            }, 400);
        }
    }

    if (prevBtn) prevBtn.addEventListener('click', () => { if (currentIdx > 0) updateSlide(currentIdx - 1); });
    if (nextBtn) nextBtn.addEventListener('click', () => {
        const slides = viewport.querySelectorAll('.carousel__slide');
        if (currentIdx < slides.length - 1) updateSlide(currentIdx + 1);
    });

    return { 
        reset: () => { currentIdx = 0; if(viewport) viewport.scrollLeft = 0; if(nextBtn) nextBtn.style.display = 'flex'; } 
    };
}

const carouselAbout = initCarousel('aboutCarousel');
const carouselPortfolio = initCarousel('portfolioCarousel');

// 휠 스크롤 (팝업 시 가드 로직 추가)
let isScrolling = false;
window.addEventListener('wheel', (e) => {
    if (nav && nav.classList.contains('active')) return;
    // [중요] 팝업창이 열려 있으면 휠 스크롤로 슬라이드 넘기지 않음
    if (popup && popup.classList.contains('show')) return;
    if (isScrolling) return;

    const activeCarousel = (aboutCarousel.style.display === 'block') ? aboutCarousel : 
                           (portfolioCarousel.style.display === 'block') ? portfolioCarousel : null;

    if (!activeCarousel) return;

    const prevBtn = activeCarousel.querySelector('.prev');
    const nextBtn = activeCarousel.querySelector('.next');

    if (e.deltaY > 0) {
        if (nextBtn && nextBtn.style.display !== 'none') { nextBtn.click(); triggerScrollLock(); }
    } else {
        if (prevBtn && prevBtn.style.display !== 'none') { prevBtn.click(); triggerScrollLock(); }
    }
}, { passive: true });

function triggerScrollLock() {
    isScrolling = true;
    setTimeout(() => { isScrolling = false; }, 500);
}

// 메뉴 이동
document.getElementById('goAbout')?.addEventListener('click', (e) => {
    e.preventDefault();
    if (portfolioCarousel) portfolioCarousel.style.display = 'none';
    if (aboutCarousel) aboutCarousel.style.display = 'block';
    carouselAbout.reset(); 
    playRipple('image/aboutme1.jpg', 0.7, true); 
    nav?.classList.remove('active');
    if (toggleImg) toggleImg.src = "image/hamburgerin.png";
});

document.getElementById('goPortfolio')?.addEventListener('click', (e) => {
    e.preventDefault();
    if (aboutCarousel) aboutCarousel.style.display = 'none';
    if (portfolioCarousel) portfolioCarousel.style.display = 'block';
    carouselPortfolio.reset(); 
    playRipple('image/portfolio1.jpg', 0.7, true);
    nav?.classList.remove('active');
    if (toggleImg) toggleImg.src = "image/hamburgerin.png";
});

if (toggle) {
    toggle.addEventListener("click", () => {
        nav.classList.toggle("active");
        if (toggleImg) toggleImg.src = nav.classList.contains("active") ? "image/hamburgerout.png" : "image/hamburgerin.png";
    });
}

// 4. 팝업 제어 로직
const popup = document.getElementById("popup");
const popupDim = document.getElementById("popupDim");
const popupImg = document.getElementById("popupImg");
const popupClose = document.getElementById("popupClose");

function openPopup(imgSrc) {
    if (!imgSrc) return;
    popupImg.src = imgSrc;
    popup.scrollTop = 0;
    popup.classList.add("show");
    popupDim.classList.add("show");
    document.body.classList.add("no-scroll");
}

function closePopup() {
    popup.classList.remove("show");
    popupDim.classList.remove("show");
    document.body.classList.remove("no-scroll");
}

document.querySelectorAll(".detail-button").forEach((btn) => {
    btn.addEventListener("click", function(e) {
        const landingImg = this.getAttribute("data-popup");
        if (landingImg) {
            e.preventDefault();
            openPopup(landingImg);
        }
    });
});

if (popupClose) popupClose.onclick = closePopup;
if (popupDim) popupDim.onclick = closePopup;

initApp();
