// Game state variables
let gameState = {
    score: 0,
    lives: 3,
    progress: 0,
    totalCards: 10,
    availableEvents: []
};
let scrollInterval = null;
const SCROLL_SPEED = 5; // Adjust this value to change scroll speed

// DOM Elements
const DOM = {
    timeline: document.getElementById('timeline'),
    currentCard: document.getElementById('current-card'),
    drawCardButton: document.getElementById('draw-card'),
    scoreElement: document.getElementById('score'),
    livesElement: document.getElementById('lives'),
    progressElement: document.getElementById('progress'),
    placementIndicator: document.querySelector('.placement-indicator'),
    feedback: document.getElementById('feedback'),
    gameEndModal: document.getElementById('game-end-modal'),
    modalMessage: document.getElementById('modal-message'),
    restartGameButton: document.getElementById('restart-game')
};

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

/**
 * Initializes the game state and UI
 */
function initializeGame() {
    if (!DOM.timeline) {
        console.error('Timeline element not found');
        return;
    }

    // Reset game state
    gameState = {
        score: 0,
        lives: 3,
        progress: 0,
        totalCards: 10,
        availableEvents: [...events]
    };

    updateGameInfo();
    clearTimeline();

    // Add initial event to the timeline
    const initialEvent = removeRandomEvent();
    const initialCard = createEventCard(initialEvent);
    initialCard.querySelector('.card-year').style.display = 'block';
    DOM.timeline.appendChild(initialCard);

    gameState.progress++;
    updateGameInfo();
    resetCurrentCard();
    DOM.drawCardButton.disabled = false;

    setupTimelineScrolling();
}

/**
 * Sets up mouse scrolling for the timeline
 */
function setupTimelineScrolling() {
    let isMouseDown = false;
    let startX, scrollLeft;

    DOM.timeline.addEventListener('mousedown', (e) => {
        isMouseDown = true;
        startX = e.pageX - DOM.timeline.offsetLeft;
        scrollLeft = DOM.timeline.scrollLeft;
    });

    DOM.timeline.addEventListener('mouseleave', () => { isMouseDown = false; });
    DOM.timeline.addEventListener('mouseup', () => { isMouseDown = false; });

    DOM.timeline.addEventListener('mousemove', (e) => {
        if (!isMouseDown) return;
        e.preventDefault();
        const x = e.pageX - DOM.timeline.offsetLeft;
        const walk = (x - startX) * 2;
        DOM.timeline.scrollLeft = scrollLeft - walk;
    });
}

function startScrolling(direction) {
    scrollInterval = setInterval(() => {
        DOM.timeline.scrollLeft += direction * SCROLL_SPEED;
    }, 16); // ~60fps
}

/**
 * Clears all cards from the timeline
 */
function clearTimeline() {
    DOM.timeline.innerHTML = '';
    DOM.timeline.appendChild(DOM.placementIndicator);
}

/**
 * Updates the game information display
 */
function updateGameInfo() {
    DOM.scoreElement.textContent = gameState.score;
    DOM.livesElement.innerHTML = '❤️'.repeat(gameState.lives);
    DOM.progressElement.textContent = `${gameState.progress}/${gameState.totalCards}`;
}

/**
 * Removes and returns a random event from available events
 * @returns {Object} A random event object
 */
function removeRandomEvent() {
    const randomIndex = Math.floor(Math.random() * gameState.availableEvents.length);
    return gameState.availableEvents.splice(randomIndex, 1)[0];
}

/**
 * Draws a new card and updates the UI
 */
function drawCard() {
    if (gameState.availableEvents.length === 0) {
        endGame();
        return;
    }

    const currentEvent = removeRandomEvent();
    DOM.currentCard.innerHTML = createEventCard(currentEvent, true).innerHTML;
    DOM.drawCardButton.disabled = true;
    DOM.currentCard.draggable = true;
    DOM.currentCard.setAttribute('aria-label', `Event card: ${currentEvent.name}. Drag to place on timeline.`);
}

/**
 * Creates a new event card element
 * @param {Object} event - The event object
 * @param {boolean} isCurrentCard - Whether this is the current card being played
 * @returns {HTMLElement} The created card element
 */
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
        card.addEventListener('click', () => flipCard(card));
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                flipCard(card);
            }
        });
    }

    return card;
}

/**
 * Flips a card to show its front or back
 * @param {HTMLElement} card - The card element to flip
 */
function flipCard(card) {
    card.classList.toggle('flipped');
    const isFrontVisible = !card.classList.contains('flipped');
    const cardContent = isFrontVisible ? card.querySelector('.card-front').textContent : card.querySelector('.card-back').textContent;
    card.setAttribute('aria-label', `Card ${isFrontVisible ? 'front' : 'back'}: ${cardContent}`);
}

/**
 * Handles the start of a drag operation
 * @param {DragEvent} e - The drag event
 */
function handleDragLeave() {
    DOM.placementIndicator.style.display = 'none';
    clearInterval(scrollInterval); // Clear the scroll interval when leaving the timeline
}

/**
 * Handles the end of a drag operation
 */
function handleDragEnd() {
    DOM.currentCard.style.opacity = '1';
    DOM.placementIndicator.style.display = 'none';
    resetCardPositions();
    clearInterval(scrollInterval); // Clear the scroll interval when dragging ends
}


/**
 * Handles the drag over event
 * @param {DragEvent} e - The drag event
 */
function handleDragOver(e) {
    e.preventDefault();
    const rect = DOM.timeline.getBoundingClientRect();
    const scrollThreshold = 100;

    clearInterval(scrollInterval); // Clear any existing scroll interval

    if (e.clientX - rect.left < scrollThreshold) {
        startScrolling(-1);
    } else if (rect.right - e.clientX < scrollThreshold) {
        startScrolling(1);
    }

    const afterElement = getDragAfterElement(DOM.timeline, e.clientX + DOM.timeline.scrollLeft);
    updateCardPositions(afterElement);
    DOM.placementIndicator.style.display = 'block';
    if (afterElement) {
        DOM.timeline.insertBefore(DOM.placementIndicator, afterElement);
    } else {
        DOM.timeline.appendChild(DOM.placementIndicator);
    }
}

/**
 * Handles the drag leave event
 */
function handleDragLeave() {
    DOM.placementIndicator.style.display = 'none';
}

/**
 * Handles the drop event
 * @param {DragEvent} e - The drop event
 */
function handleDrop(e) {
    e.preventDefault();
    const id = e.dataTransfer ? e.dataTransfer.getData('text') : 'current-card';
    if (id === 'current-card') {
        const currentEvent = events.find(event => event.name === DOM.currentCard.querySelector('.card-title').textContent);
        const newCard = createEventCard(currentEvent);
        const afterElement = getDragAfterElement(DOM.timeline, e.clientX);

        if (afterElement) {
            DOM.timeline.insertBefore(newCard, afterElement);
        } else {
            DOM.timeline.appendChild(newCard);
        }

        const isCorrect = validateCardPlacement(newCard);
        if (isCorrect) {
            newCard.querySelector('.card-year').style.display = 'block';
            updateGameState(true);
        } else {
            DOM.timeline.removeChild(newCard);
            updateGameState(false);
        }
        resetCurrentCard();
    }
    DOM.placementIndicator.style.display = 'none';
    resetCardPositions();
}

/**
 * Gets the element to insert the dragged card after
 * @param {HTMLElement} container - The container element
 * @param {number} x - The x-coordinate of the drag position
 * @returns {HTMLElement|null} The element to insert after, or null if at the end
 */
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

/**
 * Updates card positions during drag
 * @param {HTMLElement|null} afterElement - The element to insert after
 */
function updateCardPositions(afterElement) {
    const cards = DOM.timeline.querySelectorAll('.card');
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

/**
 * Resets card positions after drag
 */
function resetCardPositions() {
    const cards = DOM.timeline.querySelectorAll('.card');
    cards.forEach(card => {
        card.classList.remove('sliding-left', 'sliding-right');
    });
}

/**
 * Validates the placement of a new card
 * @param {HTMLElement} newCard - The newly placed card
 * @returns {boolean} Whether the placement is correct
 */
function validateCardPlacement(newCard) {
    const cards = Array.from(DOM.timeline.querySelectorAll('.card'));
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

/**
 * Updates the game state after card placement
 * @param {boolean} isCorrect - Whether the placement was correct
 */
function updateGameState(isCorrect) {
    if (isCorrect) {
        showFeedback(true);
        gameState.score += 10;
    } else {
        showFeedback(false);
        gameState.lives--;
        if (gameState.lives <= 0) {
            endGame();
            return;
        }
    }

    gameState.progress++;
    updateGameInfo();

    if (gameState.progress === gameState.totalCards) {
        endGame();
    } else {
        DOM.drawCardButton.disabled = false;
    }
}

/**
 * Resets the current card to its initial state
 */
function resetCurrentCard() {
    DOM.currentCard.innerHTML = `
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
    DOM.currentCard.draggable = false;
    DOM.currentCard.setAttribute('aria-label', 'Draw a new card to continue the game');
}

/**
 * Shows feedback after card placement
 * @param {boolean} isCorrect - Whether the placement was correct
 */
function showFeedback(isCorrect) {
    DOM.feedback.textContent = isCorrect ? '✅' : '❌';
    DOM.feedback.className = isCorrect ? 'correct' : 'incorrect';
    DOM.feedback.style.display = 'flex';
    DOM.feedback.setAttribute('aria-label', isCorrect ? 'Correct placement' : 'Incorrect placement');
    setTimeout(() => {
        DOM.feedback.style.display = 'none';
    }, 1500);
}

/**
 * Ends the game and displays the final score
 */
function endGame() {
    DOM.drawCardButton.disabled = true;
    const message = gameState.lives <= 0
        ? `Game Over! You've run out of lives. Your final score is ${gameState.score}.`
        : `Congratulations! You've completed the game with a score of ${gameState.score}.`;
    DOM.modalMessage.textContent = message;
    DOM.gameEndModal.style.display = 'block';
}

/**
 * Restarts the game
 */
function restartGame() {
    DOM.gameEndModal.style.display = 'none';
    initializeGame();
}

/**
 * Implements touch drag and drop functionality
 */
function implementTouchDragDrop() {
    let isDragging = false;
    let startX, startY, scrollLeft;

    DOM.currentCard.addEventListener('touchstart', handleTouchStart, { passive: false });
    DOM.timeline.addEventListener('touchmove', handleTouchMove, { passive: false });
    DOM.timeline.addEventListener('touchend', handleTouchEnd);

    function handleTouchStart(e) {
        if (!DOM.currentCard.draggable) return;
        isDragging = true;
        e.preventDefault();
        const touch = e.touches[0];
        startX = touch.clientX - DOM.timeline.offsetLeft;
        startY = touch.clientY - DOM.timeline.offsetTop;
        scrollLeft = DOM.timeline.scrollLeft;
        DOM.currentCard.style.zIndex = '1000';
    }

    function handleTouchMove(e) {
        if (!isDragging) return;
        e.preventDefault();
        const touch = e.touches[0];
        const x = touch.clientX - DOM.timeline.offsetLeft;
        const walkX = (x - startX) * 2;
        DOM.timeline.scrollLeft = scrollLeft - walkX;

        const rect = DOM.timeline.getBoundingClientRect();
        const scrollThreshold = 50;

        if (touch.clientX - rect.left < scrollThreshold) {
            autoScroll(DOM.timeline, -1);
        } else if (rect.right - touch.clientX < scrollThreshold) {
            autoScroll(DOM.timeline, 1);
        }

        const afterElement = getDragAfterElement(DOM.timeline, touch.clientX + DOM.timeline.scrollLeft);
        updateCardPositions(afterElement);
        DOM.placementIndicator.style.display = 'block';
        if (afterElement) {
            DOM.timeline.insertBefore(DOM.placementIndicator, afterElement);
        } else {
            DOM.timeline.appendChild(DOM.placementIndicator);
        }
    }

    function handleTouchEnd(e) {
        if (!isDragging) return;
        isDragging = false;
        DOM.currentCard.style.zIndex = '';
        DOM.placementIndicator.style.display = 'none';

        const touch = e.changedTouches[0];
        const dropTarget = document.elementFromPoint(touch.clientX, touch.clientY);

        if (DOM.timeline.contains(dropTarget)) {
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

/**
 * Resets the current card position
 */
function resetCurrentCardPosition() {
    DOM.currentCard.style.position = 'static';
    DOM.currentCard.style.left = '';
    DOM.currentCard.style.top = '';
}

/**
 * Automatically scrolls an element
 * @param {HTMLElement} element - The element to scroll
 * @param {number} direction - The direction to scroll (1 for right, -1 for left)
 */
function autoScroll(element, direction) {
    const scrollAmount = 10;
    element.scrollLeft += direction * scrollAmount;
}

// Event Listeners
DOM.drawCardButton.addEventListener('click', drawCard);
DOM.currentCard.addEventListener('dragstart', handleDragStart);
DOM.currentCard.addEventListener('dragend', handleDragEnd);
DOM.timeline.addEventListener('dragover', handleDragOver);
DOM.timeline.addEventListener('dragleave', handleDragLeave);
DOM.timeline.addEventListener('drop', handleDrop);
DOM.restartGameButton.addEventListener('click', restartGame);

// Initialize the game
document.addEventListener('DOMContentLoaded', () => {
    initializeGame();
    implementTouchDragDrop();
});