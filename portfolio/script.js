document.addEventListener('DOMContentLoaded', () => {
    const carouselSlide = document.querySelector('.carousel-slide');
    const projectCards = document.querySelectorAll('.project-card');
    const prevButton = document.querySelector('.prev');
    const nextButton = document.querySelector('.next');

    const totalOriginalCards = projectCards.length;
    const cardGap = 30; // Matches CSS

    let cardsPerView = 3;
    let currentIndex = 0; // The index of the first visible *original* card

    // Drag/Swipe Variables
    let isDragging = false;
    let startPos = 0;
    let currentTranslate = 0;
    let prevTranslate = 0;
    const slideDuration = 500; // Must match CSS transition time

    // --- Utility Functions ---

    function updateCardsPerView() {
        if (window.innerWidth <= 768) {
            cardsPerView = 1;
        } else if (window.innerWidth <= 1024) {
            cardsPerView = 2;
        } else {
            cardsPerView = 3;
        }
    }

    // --- Infinite Loop Setup ---
    function setupInfiniteCarousel() {
        // Cache original cards before clearing
        const originalCards = Array.from(projectCards);

        // Clear existing duplicates
        carouselSlide.innerHTML = '';
        
        // Clone and prepend the last set of cards to the start (C-A-B)
        for (let i = totalOriginalCards - cardsPerView; i < totalOriginalCards; i++) {
            if (originalCards[i]) {
                carouselSlide.appendChild(originalCards[i].cloneNode(true));
            }
        }

        // Append the original cards (A-B-C)
        originalCards.forEach(card => carouselSlide.appendChild(card.cloneNode(true)));

        // Clone and append the first set of cards to the end (A-B-C)
        for (let i = 0; i < cardsPerView; i++) {
            if (originalCards[i]) {
                carouselSlide.appendChild(originalCards[i].cloneNode(true));
            }
        }

        // The total number of visible elements, including clones
        const allCurrentCards = carouselSlide.querySelectorAll('.project-card');
        
        // Initial position should start after the prepended clones
        currentIndex = cardsPerView;
        carouselSlide.style.transition = 'none';
        updateCarousel();
    }
    // ---------------------------

    // --- Carousel Logic ---

    function updateCarousel(instant = false) {
        if (instant) {
            carouselSlide.style.transition = 'none';
        } else {
            carouselSlide.style.transition = `transform ${slideDuration}ms ease`;
        }

        let translateValue = 0;
        
        // Calculate the translation based on the actual width of cards and gaps
        const allCurrentCards = carouselSlide.querySelectorAll('.project-card');

        for (let i = 0; i < currentIndex; i++) {
            if (allCurrentCards[i]) {
                translateValue += allCurrentCards[i].offsetWidth + cardGap;
            }
        }
        
        currentTranslate = -translateValue;
        prevTranslate = currentTranslate;
        carouselSlide.style.transform = `translateX(${currentTranslate}px)`;
        
        // Check for boundary hit after the transition completes
        if (!instant) {
            setTimeout(() => {
                handleLoopJump();
            }, slideDuration); 
        } else {
            handleLoopJump(); // Jump instantly if 'instant' is true
        }
    }
    
    function handleLoopJump() {
        if (currentIndex === totalOriginalCards + cardsPerView) {
            // Jump from the last clone back to the start of the original set
            currentIndex = cardsPerView;
            updateCarousel(true);
        } else if (currentIndex === cardsPerView - 1) {
             // Jump from the first clone back to the end of the original set
             currentIndex = totalOriginalCards + cardsPerView - 1;
             updateCarousel(true);
        }
    }

    function moveNext() {
        if (currentIndex < totalOriginalCards + cardsPerView) {
            currentIndex++;
            updateCarousel();
        }
    }

    function movePrev() {
        if (currentIndex > cardsPerView - 1) {
            currentIndex--;
            updateCarousel();
        }
    }

    // --- Drag/Swipe Handlers ---
    
    function getPositionX(event) {
        return event.type.includes('mouse') ? event.pageX : event.touches[0].clientX;
    }

    function touchStart(index) {
        return function(event) {
            isDragging = true;
            startPos = getPositionX(event);
            carouselSlide.style.transition = 'none'; // Disable transition while dragging
        }
    }

    function touchMove(event) {
        if (!isDragging) return;

        const currentX = getPositionX(event);
        currentTranslate = prevTranslate + currentX - startPos;
        
        // Apply immediate drag movement
        carouselSlide.style.transform = `translateX(${currentTranslate}px)`;
    }

    function touchEnd() {
        if (!isDragging) return;
        isDragging = false;
        
        const movedBy = currentTranslate - prevTranslate;
        
        // Determine if a full swipe occurred (e.g., if moved more than 25% of a card width)
        const allCards = carouselSlide.querySelectorAll('.project-card');
        const cardWidth = allCards[currentIndex].offsetWidth;
        const swipeThreshold = cardWidth * 0.25; 

        if (movedBy < -swipeThreshold) {
            moveNext(); // Swiped left, go to next card
        } else if (movedBy > swipeThreshold) {
            movePrev(); // Swiped right, go to previous card
        } else {
            // Not enough movement, snap back to current card
            updateCarousel(); 
        }
    }


    // --- Event Listeners ---
    
    // Desktop Dragging
    carouselSlide.addEventListener('mousedown', touchStart());
    carouselSlide.addEventListener('mouseup', touchEnd);
    carouselSlide.addEventListener('mouseleave', () => { if(isDragging) touchEnd() }); // End drag if mouse leaves container
    carouselSlide.addEventListener('mousemove', touchMove);

    // Mobile Swiping
    carouselSlide.addEventListener('touchstart', touchStart());
    carouselSlide.addEventListener('touchend', touchEnd);
    carouselSlide.addEventListener('touchmove', touchMove);

    // Button Clicks
    nextButton.addEventListener('click', moveNext);
    prevButton.addEventListener('click', movePrev);

    // Initializer
    const initializeCarousel = () => {
        updateCardsPerView();
        setupInfiniteCarousel();
        prevButton.style.display = 'block';
        nextButton.style.display = 'block';
    };

    initializeCarousel();
    window.addEventListener('resize', initializeCarousel);
});