// Game state variables
let score = 0;
let lives = 3;
let progress = 0;
const totalCards = 10;
let availableEvents = [];

// DOM Elements
const timeline = document.getElementById('timeline');
const currentCard = document.getElementById('current-card');
const drawCardButton = document.getElementById('draw-card');
const scoreElement = document.getElementById('score');
const livesElement = document.getElementById('lives');
const progressElement = document.getElementById('progress');
const placementIndicator = document.querySelector('.placement-indicator');
const feedback = document.getElementById('feedback');
const gameEndModal = document.getElementById('game-end-modal');
const modalMessage = document.getElementById('modal-message');
const restartGameButton = document.getElementById('restart-game');

// Game events data
const events = [
    { name: "Birth of Christ", year: 0, emoji: "👶", notice: "Marks the beginning of the Christian era. Celebrated as Christmas worldwide." },
    { name: "Fall of Rome", year: 476, emoji: "🏛️", notice: "End of the Western Roman Empire. Marked the transition to the Middle Ages." },
    { name: "Discovery of America", year: 1492, emoji: "🚢", notice: "Christopher Columbus reached the Americas. Led to European exploration and colonization." },
    { name: "French Revolution", year: 1789, emoji: "🇫🇷", notice: "Overthrew the monarchy in France. Inspired democratic movements across Europe." },
    { name: "World War I Begins", year: 1914, emoji: "⚔️", notice: "Global conflict involving major powers. Reshaped international politics and borders." },
    { name: "Moon Landing", year: 1969, emoji: "🌙", notice: "Neil Armstrong became the first human on the moon. Marked a milestone in space exploration." },
    { name: "Fall of Berlin Wall", year: 1989, emoji: "🧱", notice: "Symbolized the end of the Cold War. Led to German reunification." },
    { name: "Internet Goes Public", year: 1991, emoji: "🌐", notice: "World Wide Web became publicly available. Revolutionized global communication and commerce." },
    { name: "9/11 Attacks", year: 2001, emoji: "🏙️", notice: "Terrorist attacks on the United States. Led to global changes in security and foreign policy." },
    { name: "First iPhone Released", year: 2007, emoji: "📱", notice: "Apple introduced the iPhone. Revolutionized mobile technology and communication." }
];

// Initialize the game
function initializeGame() {
    availableEvents = [...events];
    score = 0;
    lives = 3;
    progress = 0;
    updateGameInfo();
    clearTimeline();
    const randomIndex = Math.floor(Math.random() * availableEvents.length);
    const initialEvent = availableEvents.splice(randomIndex, 1)[0];
    const initialCard = createEventCard(initialEvent);
    initialCard.querySelector('.card-year').style.display = 'block';
    timeline.appendChild(initialCard);
    progress++;
    updateGameInfo();
    resetCurrentCard();
    drawCardButton.disabled = false;
    implementTouchDragDrop();
}

// Clear the timeline
function clearTimeline() {
    while (timeline.firstChild) {
        timeline.removeChild(timeline.firstChild);
    }
    timeline.appendChild(placementIndicator);
}

// Update game information display
function updateGameInfo() {
    scoreElement.textContent = score;
    livesElement.innerHTML = '❤️'.repeat(lives);
    progressElement.textContent = `${progress}/${totalCards}`;
}

// Draw a new card
function drawCard() {
    if (availableEvents.length === 0) {
        endGame();
        return;
    }

    const randomIndex = Math.floor(Math.random() * availableEvents.length);
    const currentEvent = availableEvents.splice(randomIndex, 1)[0];

    currentCard.innerHTML = createEventCard(currentEvent, true).innerHTML;

    drawCardButton.disabled = true;
    currentCard.draggable = true;
    currentCard.setAttribute('aria-label', `Event card: ${currentEvent.name}. Drag to place on timeline.`);
}

// Create a new event card
function createEventCard(event, isCurrentCard = false) {
    const card = document.createElement('div');
    card.className = 'card';
    card.setAttribute('role', 'listitem');
    card.innerHTML = `
        <div class="card-front">
            <div class="card-title">${event.name}</div>
            <div class="card-emoji">${event.emoji}</div>
            <div class="card-year">${isCurrentCard ? '' : event.year}</div>
        </div>
        ${isCurrentCard ? '' : `
        <div class="card-back">
            <div class="card-notice">${event.notice}</div>
        </div>
        `}`;

    if (!isCurrentCard) {
        card.addEventListener('click', function () {
            flipCard(this);
        });

        card.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                flipCard(this);
            }
        });
    }

    return card;
}

// Flip card function
function flipCard(card) {
    card.classList.toggle('flipped');
    const isFrontVisible = !card.classList.contains('flipped');
    const cardContent = isFrontVisible ? card.querySelector('.card-front').textContent : card.querySelector('.card-back').textContent;
    card.setAttribute('aria-label', `Card ${isFrontVisible ? 'front' : 'back'}: ${cardContent}`);
}

// Handle drag start event
function handleDragStart(e) {
    if (e.type === 'touchstart') return; // Ignore touch events here
    e.dataTransfer.setData('text/plain', e.target.id);
    setTimeout(() => (currentCard.style.opacity = '0.5'), 0);
}

// Handle drag end event
function handleDragEnd() {
    currentCard.style.opacity = '1';
    placementIndicator.style.display = 'none';
    resetCardPositions();
}

// Handle drag over event
function handleDragOver(e) {
    e.preventDefault();
    const afterElement = getDragAfterElement(timeline, e.clientX);
    updateCardPositions(afterElement);
    placementIndicator.style.display = 'block';
    if (afterElement) {
        timeline.insertBefore(placementIndicator, afterElement);
    } else {
        timeline.appendChild(placementIndicator);
    }
}

// Handle drag leave event
function handleDragLeave() {
    placementIndicator.style.display = 'none';
}

// Handle drop event
function handleDrop(e) {
    e.preventDefault();
    const id = e.dataTransfer ? e.dataTransfer.getData('text') : 'current-card';
    if (id === 'current-card') {
        const currentEvent = events.find(event => event.name === currentCard.querySelector('.card-title').textContent);
        const newCard = createEventCard(currentEvent);
        const afterElement = getDragAfterElement(timeline, e.clientX);

        if (afterElement) {
            timeline.insertBefore(newCard, afterElement);
        } else {
            timeline.appendChild(newCard);
        }

        const isCorrect = validateCardPlacement(newCard);
        if (isCorrect) {
            newCard.querySelector('.card-year').style.display = 'block';
            updateGameState(true);
        } else {
            timeline.removeChild(newCard);
            updateGameState(false);
        }
        resetCurrentCard();
    }
    placementIndicator.style.display = 'none';
    resetCardPositions();
}

// Get the element to insert the dragged card after
function getDragAfterElement(container, x) {
    const draggableElements = [...container.querySelectorAll('.card:not(.dragging)')];
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = x - box.left - box.width / 2;
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// Update card positions during drag
function updateCardPositions(afterElement) {
    const cards = timeline.querySelectorAll('.card');
    cards.forEach(card => card.classList.remove('sliding-left', 'sliding-right'));

    if (afterElement) {
        const previousElement = afterElement.previousElementSibling;
        if (previousElement && previousElement.classList.contains('card')) {
            previousElement.classList.add('sliding-left');
            afterElement.classList.add('sliding-right');
        } else {
            afterElement.classList.add('sliding-right');
        }
    } else if (cards.length > 0) {
        cards[cards.length - 1].classList.add('sliding-left');
    }
}

// Reset card positions after drag
function resetCardPositions() {
    const cards = timeline.querySelectorAll('.card');
    cards.forEach(card => {
        card.classList.remove('sliding-left', 'sliding-right');
    });
}

// Validate card placement
function validateCardPlacement(newCard) {
    const cards = Array.from(timeline.querySelectorAll('.card'));
    const newCardIndex = cards.indexOf(newCard);
    const newCardYear = parseInt(newCard.querySelector('.card-year').textContent);

    if (newCardIndex === 0) {
        const nextCard = cards[1];
        return nextCard ? newCardYear <= parseInt(nextCard.querySelector('.card-year').textContent) : true;
    } else if (newCardIndex === cards.length - 1) {
        const prevCard = cards[cards.length - 2];
        return newCardYear >= parseInt(prevCard.querySelector('.card-year').textContent);
    } else {
        const prevCard = cards[newCardIndex - 1];
        const nextCard = cards[newCardIndex + 1];
        const prevCardYear = parseInt(prevCard.querySelector('.card-year').textContent);
        const nextCardYear = parseInt(nextCard.querySelector('.card-year').textContent);
        return newCardYear >= prevCardYear && newCardYear <= nextCardYear;
    }
}

// Update game state after card placement
function updateGameState(isCorrect) {
    if (isCorrect) {
        showFeedback(true);
        score += 10;
    } else {
        showFeedback(false);
        lives--;
        if (lives <= 0) {
            endGame();
            return;
        }
    }

    progress++;
    updateGameInfo();

    if (progress === totalCards) {
        endGame();
    } else {
        drawCardButton.disabled = false;
    }
}

// Reset current card
function resetCurrentCard() {
    currentCard.innerHTML = `
        <div class="card-inner">
            <div class="card-front">
                <div class="card-title">Draw a card</div>
                <div class="card-emoji">🎴</div>
                <div class="card-year">to continue!</div>
            </div>
            <div class="card-back">
                <div class="card-notice">Draw a card to continue the game!</div>
            </div>
        </div>`;
    currentCard.draggable = false;
    currentCard.setAttribute('aria-label', 'Draw a new card to continue the game');
}

// Show feedback after card placement
function showFeedback(isCorrect) {
    feedback.textContent = isCorrect ? '✅' : '❌';
    feedback.className = isCorrect ? 'correct' : 'incorrect';
    feedback.style.display = 'flex';
    feedback.setAttribute('aria-label', isCorrect ? 'Correct placement' : 'Incorrect placement');
    setTimeout(() => {
        feedback.style.display = 'none';
    }, 1500);
}

// End the game
function endGame() {
    drawCardButton.disabled = true;
    const message = lives <= 0
        ? `Game Over! You've run out of lives. Your final score is ${score}.`
        : `Congratulations! You've completed the game with a score of ${score}.`;
    modalMessage.textContent = message;
    gameEndModal.style.display = 'block';
}

// Restart the game
function restartGame() {
    gameEndModal.style.display = 'none';
    initializeGame();
}

// Implement touch drag and drop functionality
function implementTouchDragDrop() {
    let isDragging = false;
    let startX, startY;
    let originalX, originalY;

    currentCard.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);

    function handleTouchStart(e) {
        if (!currentCard.draggable) return;
        isDragging = true;
        e.preventDefault(); // Prevent scrolling when starting drag
        const touch = e.touches[0];
        startX = touch.clientX - currentCard.offsetLeft;
        startY = touch.clientY - currentCard.offsetTop;
        originalX = currentCard.offsetLeft;
        originalY = currentCard.offsetTop;
        currentCard.style.zIndex = '1000';
    }

    function handleTouchMove(e) {
        if (!isDragging) return;
        e.preventDefault(); // Prevent scrolling during drag
        const touch = e.touches[0];
        let newX = touch.clientX - startX;
        let newY = touch.clientY - startY;

        currentCard.style.position = 'fixed';
        currentCard.style.left = newX + 'px';
        currentCard.style.top = newY + 'px';

        const afterElement = getDragAfterElement(timeline, touch.clientX);
        updateCardPositions(afterElement);

        placementIndicator.style.display = 'block';
        if (afterElement) {
            timeline.insertBefore(placementIndicator, afterElement);
        } else {
            timeline.appendChild(placementIndicator);
        }
    }

    function handleTouchEnd(e) {
        if (!isDragging) return;
        isDragging = false;
        currentCard.style.zIndex = '';
        placementIndicator.style.display = 'none';
        
        const touch = e.changedTouches[0];
        const dropTarget = document.elementFromPoint(touch.clientX, touch.clientY);
        
        if (timeline.contains(dropTarget)) {
            handleDrop(createTouchDropEvent(touch));
        } else {
            resetCurrentCardPosition();
        }
        
        resetCardPositions();
    }

    function createTouchDropEvent(touch) {
        return {
            preventDefault: () => {},
            clientX: touch.clientX,
            clientY: touch.clientY,
            dataTransfer: {
                getData: () => 'current-card'
            }
        };
    }
}

// Reset current card position
function resetCurrentCardPosition() {
    currentCard.style.position = 'static';
    currentCard.style.left = '';
    currentCard.style.top = '';
}

// Event Listeners
drawCardButton.addEventListener('click', drawCard);
currentCard.addEventListener('dragstart', handleDragStart);
currentCard.addEventListener('dragend', handleDragEnd);
timeline.addEventListener('dragover', handleDragOver);
timeline.addEventListener('dragleave', handleDragLeave);
timeline.addEventListener('drop', handleDrop);
restartGameButton.addEventListener('click', restartGame);

// Initialize the game
initializeGame();
implementTouchDragDrop();