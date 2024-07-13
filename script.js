// At the beginning of your script.js file
let tg = window.Telegram.WebApp;
if (!tg) {
  console.error("Telegram Web App is not available");
  // Implement fallback behavior or show an error message
  alert("This app requires Telegram Web App to function properly.");
}
if (window.Telegram && window.Telegram.WebApp) {
    let tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand(); // Expand the Web App to full height
    console.log("Telegram Web App initialized");

// Game state variables
let score = 0;
let lives = 3;
let progress = 0;
const totalCards = 10;
let availableEvents = []

// Initialize the main button
function initializeMainButton() {
    tg.MainButton.setText('Draw Card');
    tg.MainButton.show();
    tg.MainButton.onClick(drawCard);
}
  

// Enable closing confirmation dialog
tg.enableClosingConfirmation();

function updateMainButton(text, visible) {
  if (visible) {
    tg.MainButton.setText(text);
    tg.MainButton.show();
  } else {
    tg.MainButton.hide();
  }
}
// Replace drawCardButton click listener with:
updateMainButton('Draw Card', true);


// DOM Elements
function setupEventListeners() {
    console.log("Setting up event listeners...");
    const currentCard = document.getElementById('current-card');
    const timeline = document.getElementById('timeline');
    
    if (currentCard && timeline) {
      currentCard.addEventListener('dragstart', handleDragStart);
      currentCard.addEventListener('dragend', handleDragEnd);
      timeline.addEventListener('dragover', handleDragOver);
      timeline.addEventListener('dragleave', handleDragLeave);
      timeline.addEventListener('drop', handleDrop);
      console.log("Event listeners set up successfully");
    } else {
      console.error("Required elements not found for event listeners");
    }
  }
  
  document.addEventListener('DOMContentLoaded', function() {
    initializeGame();
    setupEventListeners();
    implementTouchDragDrop();
  });

  
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
    try {
      console.log("Initializing game...");
      initializeMainButton();
      availableEvents = [...events];
      score = 0;
      lives = 3;
      progress = 0;
      updateGameInfo();
      clearTimeline();
      
      const timeline = document.getElementById('timeline');
      if (!timeline) throw new Error("Timeline element not found");
  
      // Generate initial card
      const randomIndex = Math.floor(Math.random() * availableEvents.length);
      const initialEvent = availableEvents.splice(randomIndex, 1)[0];
      const initialCard = createEventCard(initialEvent);
      initialCard.querySelector('.card-year').style.display = 'block';
      timeline.appendChild(initialCard);
      
      progress++;
      updateGameInfo();
      resetCurrentCard();
      initializeMainButton();
      updateCardCache();
      console.log("Game initialized successfully");
    } catch (error) {
      console.error('Error initializing game:', error);
      tg.showAlert('An error occurred while initializing the game. Please try again.');
    }
  }

  document.addEventListener('DOMContentLoaded', function() {
    initializeGame();
    implementTouchDragDrop();
  });

// Clear the timeline
function clearTimeline() {
    while (timeline.firstChild) {
        timeline.removeChild(timeline.firstChild);
    }
    timeline.appendChild(placementIndicator);
}

// Update game information display
function updateGameInfo() {
    const scoreElement = document.getElementById('score');
    const livesElement = document.getElementById('lives');
    const progressElement = document.getElementById('progress');
  
    if (scoreElement && livesElement && progressElement) {
      scoreElement.textContent = score;
      livesElement.innerHTML = '❤️'.repeat(lives) + `<span class="visually-hidden">${lives} lives remaining</span>`;
      progressElement.textContent = `${progress}/${totalCards}`;
    } else {
      console.error("One or more game info elements not found");
    }
  }

// Draw a new card
function drawCard() {
    console.log("Drawing card...");
    if (availableEvents.length === 0) {
      console.log("No more events available");
      endGame();
      return;
    }
  
    try {
      const randomIndex = Math.floor(Math.random() * availableEvents.length);
      const currentEvent = availableEvents.splice(randomIndex, 1)[0];
  
      // Check if currentCard exists before using it
      const currentCardElement = document.getElementById('current-card');
      if (currentCardElement) {
        currentCardElement.innerHTML = createEventCard(currentEvent, true).innerHTML;
        currentCardElement.draggable = true;
        currentCardElement.setAttribute('aria-label', `Event card: ${currentEvent.name}. Drag to place on timeline.`);
        console.log("Card drawn successfully");
      } else {
        throw new Error("Current card element not found");
      }
    } catch (error) {
      console.error("Error drawing card:", error);
      tg.showAlert('An error occurred while drawing a card. Please try again.');
    }
  }

// Create a new event card
function createEventCard(event, isCurrentCard = false) {
    const card = document.createElement('div');
    card.className = 'card';
    card.setAttribute('role', 'listitem');
    card.innerHTML = `
        <div class="card-inner">
            <div class="card-front">
                <div class="card-title">${event.name}</div>
                <div class="card-emoji">${event.emoji}</div>
                <div class="card-year">${isCurrentCard ? '' : event.year}</div>
            </div>
            ${isCurrentCard ? '' : `
                <div class="card-back">
                    <div class="card-notice">${event.notice}</div>
                </div>
            `}
        </div>`;

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

// Flip card function
function flipCard(card) {
    card.classList.toggle('flipped');
    const isFrontVisible = !card.classList.contains('flipped');
    const cardContent = isFrontVisible ? card.querySelector('.card-front').textContent : card.querySelector('.card-back').textContent;
    card.setAttribute('aria-label', `Card ${isFrontVisible ? 'front' : 'back'}: ${cardContent}`);
}

// Handle drag start event
function handleDragStart(e) {
    if (e.type === 'touchstart') return;
    e.dataTransfer.setData('text/plain', e.target.id);
    currentCard.style.opacity = '0.5';
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

// Handle drop event
function handleDrop(e) {
    try {
      e.preventDefault();
      updateMainButton('Place Card', true);
      
      const id = e.dataTransfer ? e.dataTransfer.getData('text') : 'current-card';
      if (id === 'current-card') {
        const currentCardElement = document.getElementById('current-card');
        if (!currentCardElement) throw new Error("Current card element not found");
  
        const currentEvent = events.find(event => event.name === currentCardElement.querySelector('.card-title').textContent);
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
      updateCardCache();
    } catch (error) {
      console.error("Error handling drop:", error);
      tg.showAlert('An error occurred while placing the card. Please try again.');
    }
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
let cachedCards = [];

function updateCardCache() {
  cachedCards = Array.from(timeline.querySelectorAll('.card'));
}

function updateCardPositions(afterElement) {
  cachedCards.forEach(card => card.classList.remove('sliding-left', 'sliding-right'));

  if (afterElement) {
    const previousElement = afterElement.previousElementSibling;
    if (previousElement && previousElement.classList.contains('card')) {
      previousElement.classList.add('sliding-left');
      afterElement.classList.add('sliding-right');
    } else {
      afterElement.classList.add('sliding-right');
    }
  } else if (cachedCards.length > 0) {
    cachedCards[cachedCards.length - 1].classList.add('sliding-left');
  }
}

// Call updateCardCache() after adding or removing cards

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
    updateMainButton('Draw Card', true);
  }

}

tg.BackButton.onClick(() => {
    if (confirm('Are you sure you want to exit the game?')) {
      tg.close();
    }
  });

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
    
    if (isCorrect) {
      tg.HapticFeedback.notificationOccurred('success');
    } else {
      tg.HapticFeedback.notificationOccurred('error');
    }
    
    setTimeout(() => {
      feedback.style.display = 'none';
    }, 1500);
  }

  tg.onEvent('viewportChanged', updateLayout);

  // Initialize viewport dimensions
let viewportHeight = window.innerHeight;
let viewportWidth = window.innerWidth;

// Function to update layout
function updateLayout() {
    viewportHeight = window.innerHeight;
    viewportWidth = window.innerWidth;

    // Adjust game container size
    const gameContainer = document.getElementById('game-container');
    gameContainer.style.height = `${viewportHeight}px`;
    gameContainer.style.width = `${viewportWidth}px`;

    // Adjust timeline size and position
    const timeline = document.getElementById('timeline');
    timeline.style.width = `${viewportWidth - 40}px`; // 20px padding on each side
    timeline.style.height = `${viewportHeight * 0.4}px`; // 40% of viewport height

    // Adjust current card size
    const currentCard = document.getElementById('current-card');
    currentCard.style.width = `${Math.min(viewportWidth * 0.8, 180)}px`; // Max width of 180px
    currentCard.style.height = `${Math.min(viewportHeight * 0.3, 250)}px`; // Max height of 250px

    // Recalculate card positions in timeline
    repositionTimelineCards();
}

// Function to reposition cards in timeline
function repositionTimelineCards() {
    const cards = document.querySelectorAll('#timeline .card');
    const timelineWidth = document.getElementById('timeline').offsetWidth;
    const cardWidth = cards[0]?.offsetWidth || 180; // Use 180 as default if no cards present
    const maxCards = Math.floor(timelineWidth / (cardWidth + 20)); // 20px for margins

    cards.forEach((card, index) => {
        if (index < maxCards) {
            card.style.display = 'block';
            card.style.left = `${index * (cardWidth + 20)}px`;
        } else {
            card.style.display = 'none';
        }
    });
}

// Event listener for Telegram's viewportChanged event
tg.onEvent('viewportChanged', updateLayout);

// Event listener for window resize (for testing in browser)
window.addEventListener('resize', updateLayout);

// Initial layout update
updateLayout();


// End the game
function endGame() {
    updateMainButton('Game Over', false);
    const message = lives <= 0
      ? `Game Over! You've run out of lives. Your final score is ${score}.`
      : `Congratulations! You've completed the game with a score of ${score}.`;
    
    tg.showPopup({
      title: 'Game Over',
      message: message,
      buttons: [{
        type: 'ok',
        text: 'Restart Game'
      }]
    }, function(buttonId) {
      if (buttonId === 'ok') {
        restartGame();
      }
    });
  }

// Restart the game
function restartGame() {
    initializeGame();
}

// Implement touch drag and drop functionality
function implementTouchDragDrop() {
    let isDragging = false;
    let startX, startY;
  
    currentCard.addEventListener('touchstart', handleTouchStart, { passive: false });
    currentCard.addEventListener('touchmove', handleTouchMove, { passive: false });
    currentCard.addEventListener('touchend', handleTouchEnd);
    currentCard.addEventListener('touchcancel', handleTouchEnd);
  
    function handleTouchStart(e) {
        if (!currentCard.draggable) return;
        isDragging = true;
        const touch = e.touches[0];
        startX = touch.clientX - currentCard.offsetLeft;
        startY = touch.clientY - currentCard.offsetTop;
        currentCard.style.zIndex = '1000';
        e.preventDefault(); // Prevent default only after checks
    }
    
  
    function handleTouchMove(e) {
      if (!isDragging) return;
      e.preventDefault();
      const touch = e.touches[0];
      let newX = touch.clientX - startX;
      let newY = touch.clientY - startY;
  
      currentCard.style.position = 'fixed';
      currentCard.style.left = `${newX}px`;
      currentCard.style.top = `${newY}px`;
  
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
  }

// Reset current card position
function resetCurrentCardPosition() {
    currentCard.style.position = 'static';
    currentCard.style.left = '';
    currentCard.style.top = '';
}

// Event Listeners
currentCard.addEventListener('dragstart', handleDragStart);
currentCard.addEventListener('dragend', handleDragEnd);
timeline.addEventListener('dragover', handleDragOver);
timeline.addEventListener('dragleave', handleDragLeave);
timeline.addEventListener('drop', handleDrop);



// Initialize the game
initializeGame();
implementTouchDragDrop();

  } else {
    console.error("Telegram Web App is not available");
    // Implement fallback behavior or show an error message
  }
