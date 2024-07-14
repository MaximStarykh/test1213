(function() {
    // Telegram Web App initialization
    let tg = window.Telegram.WebApp;
    if (!tg) {
      console.error("Telegram Web App is not available");
      alert("This app requires Telegram Web App to function properly.");
      return;
    }
  
    // Game state variables
    let score = 0;
    let lives = 3;
    let progress = 0;
    const totalCards = 10;
    let availableEvents = [];
  
    // DOM Elements
    let currentCard, timeline, feedback, placementIndicator;
  
    // Initialize the game when the DOM is fully loaded
    document.addEventListener('DOMContentLoaded', initializeGame);
  
    /**
     * Initialize the game
     */
    function initializeGame() {
      try {
        tg.ready();
        tg.expand();
        console.log("Telegram Web App initialized");
  
        initializeDOMElements();
        setupEventListeners();
        implementTouchDragDrop();
        initializeMainButton();
        resetGameState();
        updateGameInfo();
        clearTimeline();
        if (availableEvents.length > 0) {
            const firstEvent = availableEvents.shift();
            const firstCard = createEventCard(firstEvent);
            timeline.appendChild(firstCard);
            updateCardCache();
          }
      } catch (error) {
        console.error("Error initializing game:", error);
        showAlert('An error occurred while initializing the game. Please try again.');
      }
    }
  
    /**
     * Initialize DOM elements
     */
    function initializeDOMElements() {
      currentCard = document.getElementById('current-card');
      timeline = document.getElementById('timeline');
      feedback = document.getElementById('feedback');
      placementIndicator = document.createElement('div');
      placementIndicator.className = 'placement-indicator';
  
      if (!currentCard || !timeline || !feedback) {
        throw new Error("Required game elements not found");
      }
    }
  
    /**
     * Set up event listeners
     */
    function setupEventListeners() {
      currentCard.addEventListener('dragstart', handleDragStart);
      currentCard.addEventListener('dragend', handleDragEnd);
      timeline.addEventListener('dragover', handleDragOver);
      timeline.addEventListener('dragleave', handleDragLeave);
      timeline.addEventListener('drop', handleDrop);
  
      tg.onEvent('viewportChanged', updateLayout);
      window.addEventListener('resize', updateLayout);
  
      tg.BackButton.onClick(() => {
        if (confirm('Are you sure you want to exit the game?')) {
          tg.close();
        }
      });
  
      console.log("Event listeners set up successfully");
    }
  
    /**
     * Initialize the main button
     */
    function initializeMainButton() {
        if (isHandEmpty()) {
          updateMainButton('Draw Card', true);
        } else {
          updateMainButton('Place Card', true);
        }
        tg.MainButton.onClick(() => {
          if (isHandEmpty()) {
            drawCard();
          } else {
            showAlert('Place your current card on the timeline before drawing a new one.');
          }
        });
      }
  
    /**
     * Update the main button
     * @param {string} text - Button text
     * @param {boolean} visible - Button visibility
     */
    function updateMainButton(text, visible) {
      if (visible) {
        tg.MainButton.setText(text);
        tg.MainButton.show();
      } else {
        tg.MainButton.hide();
      }
    }
  
    /**
     * Reset game state
     */
    function resetGameState() {
      score = 0;
      lives = 3;
      progress = 0;
      availableEvents = [...events];
    }
  
    /**
     * Update game information display
     */
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
  
    /**
     * Clear the timeline
     */
    function clearTimeline() {
      if (timeline && placementIndicator) {
        timeline.innerHTML = '';
        timeline.appendChild(placementIndicator);
      } else {
        console.error("Timeline or placementIndicator not found");
      }
    }
  
    /**
     * Draw a new card
     */
    function isHandEmpty() {
        return !currentCard.querySelector('.card-title') || currentCard.querySelector('.card-title').textContent === 'Draw a card';
      }
      
      function drawCard() {
        if (!isHandEmpty()) {
          showAlert('You already have a card in your hand. Place it before drawing a new one.');
          return;
        }
      
        console.log("Drawing card...");
        if (availableEvents.length === 0) {
          console.log("No more events available");
          endGame();
          return;
        }
      
        try {
          const randomIndex = Math.floor(Math.random() * availableEvents.length);
          const currentEvent = availableEvents.splice(randomIndex, 1)[0];
      
          if (!currentCard) {
            throw new Error("Current card element not found");
          }
      
          currentCard.innerHTML = createEventCard(currentEvent, true).innerHTML;
          currentCard.draggable = true;
          currentCard.setAttribute('aria-label', `Event card: ${currentEvent.name}. Drag to place on timeline.`);
          console.log("Card drawn successfully");
          
          updateMainButton('Place Card', true);
        } catch (error) {
          console.error("Error drawing card:", error);
          showAlert('An error occurred while drawing a card. Please try again.');
        }
      }
  
    /**
     * Create a new event card
     * @param {Object} event - Event data
     * @param {boolean} isCurrentCard - Whether this is the current card
     * @returns {HTMLElement} - Card element
     */
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
  
    /**
     * Flip card function
     * @param {HTMLElement} card - Card element to flip
     */
    function flipCard(card) {
      card.classList.toggle('flipped');
      const isFrontVisible = !card.classList.contains('flipped');
      const cardContent = isFrontVisible ? card.querySelector('.card-front').textContent : card.querySelector('.card-back').textContent;
      card.setAttribute('aria-label', `Card ${isFrontVisible ? 'front' : 'back'}: ${cardContent}`);
    }
  
    /**
     * Handle drag start event
     * @param {DragEvent} e - Drag event
     */
    function handleDragStart(e) {
      if (e.type === 'touchstart') return;
      e.dataTransfer.setData('text/plain', e.target.id);
      currentCard.style.opacity = '0.5';
    }
  
    /**
     * Handle drag end event
     */
    function handleDragEnd() {
      currentCard.style.opacity = '1';
      placementIndicator.style.display = 'none';
      resetCardPositions();
    }
  
    /**
     * Handle drag over event
     * @param {DragEvent} e - Drag event
     */
    function handleDragOver(e) {
        e.preventDefault();
        const afterElement = getDragAfterElement(timeline, e.clientX);
        
        // Remove existing sliding classes
        document.querySelectorAll('.card').forEach(card => {
          card.classList.remove('sliding-left', 'sliding-right');
        });
      
        // Add sliding classes
        if (afterElement) {
          const beforeElement = afterElement.previousElementSibling;
          if (beforeElement && beforeElement.classList.contains('card')) {
            beforeElement.classList.add('sliding-left');
          }
          afterElement.classList.add('sliding-right');
        } else {
          const lastCard = timeline.querySelector('.card:last-child');
          if (lastCard) {
            lastCard.classList.add('sliding-left');
          }
        }
      
        placementIndicator.style.display = 'block';
        if (afterElement) {
          timeline.insertBefore(placementIndicator, afterElement);
        } else {
          timeline.appendChild(placementIndicator);
        }
      }
  
    /**
     * Handle drag leave event
     */
    function handleDragLeave() {
      placementIndicator.style.display = 'none';
    }
  
    /**
     * Handle drop event
     * @param {DragEvent} e - Drop event
     */
    function handleDrop(e) {
        e.preventDefault();
        placementIndicator.style.display = 'none';
        
        try {
          const id = e.dataTransfer ? e.dataTransfer.getData('text') : 'current-card';
          if (id === 'current-card') {
            const currentCardElement = document.getElementById('current-card');
            if (!currentCardElement) throw new Error("Current card element not found");
      
            const currentEventName = currentCardElement.querySelector('.card-title').textContent;
            const currentEvent = events.find(event => event.name === currentEventName);
            
            if (!currentEvent) throw new Error("Event not found");
      
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
              resetCurrentCard();
              updateMainButton('Draw Card', true);
            } else {
              timeline.removeChild(newCard);
              updateGameState(false);
              showAlert('Incorrect placement. Try again!');
            }
          }
          
          resetCardPositions();
          updateCardCache();
        } catch (error) {
          console.error("Error handling drop:", error);
          showAlert('An error occurred while placing the card. Please try again.');
        }
      }
  
    // Cache for card elements
    let cachedCards = [];
  
    /**
     * Update card cache
     */
    function updateCardCache() {
      cachedCards = Array.from(timeline.querySelectorAll('.card'));
    }
  
    /**
     * Update card positions during drag
     * @param {HTMLElement} afterElement - Element to insert after
     */
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
  
    /**
     * Reset card positions after drag
     */
    function resetCardPositions() {
        document.querySelectorAll('.card').forEach(card => {
          card.classList.remove('sliding-left', 'sliding-right');
        });
      }
  
    /**
     * Validate card placement
     * @param {HTMLElement} newCard - New card element
     * @returns {boolean} - Whether placement is valid
     */
    function validateCardPlacement(newCard) {
        const cards = Array.from(timeline.querySelectorAll('.card'));
        const newCardIndex = cards.indexOf(newCard);
        const newCardYear = parseInt(newCard.querySelector('.card-year').textContent);
      
        if (isNaN(newCardYear)) {
          console.error("Invalid year for new card");
          return false;
        }
      
        if (newCardIndex === 0) {
          const nextCard = cards[1];
          return !nextCard || newCardYear <= parseInt(nextCard.querySelector('.card-year').textContent);
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
     * Update game state after card placement
     * @param {boolean} isCorrect - Whether placement was correct
     */
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
  
    /**
     * Reset current card
     */
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
  
    /**
     * Show feedback after card placement
     * @param {boolean} isCorrect - Whether placement was correct
     */
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
  
/**
 * Update layout based on viewport changes
 */
function updateLayout() {
    // Get current viewport dimensions
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
  
    // Adjust game container size
    const gameContainer = document.getElementById('game-container');
    if (gameContainer) {
      gameContainer.style.height = `${viewportHeight}px`;
      gameContainer.style.width = `${viewportWidth}px`;
    } else {
      console.error("Game container not found");
    }
  
    // Adjust timeline size and position
    if (timeline) {
      timeline.style.width = `${viewportWidth - 40}px`; // 20px padding on each side
      timeline.style.height = `${viewportHeight * 0.4}px`; // 40% of viewport height
    } else {
      console.error("Timeline not found");
    }
  
    // Adjust current card size
    if (currentCard) {
      currentCard.style.width = `${Math.min(viewportWidth * 0.8, 180)}px`; // Max width of 180px
      currentCard.style.height = `${Math.min(viewportHeight * 0.3, 250)}px`; // Max height of 250px
    } else {
      console.error("Current card not found");
    }
  
    // Recalculate card positions in timeline
    repositionTimelineCards();
  
    // Adjust game info section
    const gameInfo = document.getElementById('game-info');
    if (gameInfo) {
      gameInfo.style.width = `${viewportWidth - 40}px`; // 20px margin on each side
    } else {
      console.error("Game info section not found");
    }
  
    // Adjust feedback element position
    if (feedback) {
      feedback.style.right = `${Math.min(20, viewportWidth * 0.05)}px`;
      feedback.style.top = `${Math.min(20, viewportHeight * 0.05)}px`;
    } else {
      console.error("Feedback element not found");
    }
  
    // Update font sizes for better readability on different screen sizes
    updateFontSizes();
  
    console.log(`Layout updated for viewport: ${viewportWidth}x${viewportHeight}`);
  }
  
  /**
   * Update font sizes based on viewport width
   */
  function updateFontSizes() {
    const baseFontSize = Math.max(14, Math.min(18, window.innerWidth / 60));
    document.documentElement.style.fontSize = `${baseFontSize}px`;
  
    // Adjust specific element font sizes if needed
    if (currentCard) {
      const titleElement = currentCard.querySelector('.card-title');
      if (titleElement) {
        titleElement.style.fontSize = `${baseFontSize * 1.2}px`;
      }
    }
  }
  
  /**
   * Reposition cards in the timeline
   */
  function repositionTimelineCards() {
    const cards = timeline.querySelectorAll('.card');
    const timelineWidth = timeline.offsetWidth;
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
  
    console.log(`Repositioned ${cards.length} cards, displaying up to ${maxCards}`);
  }

  /**
   * End the game
   */
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

  /**
   * Restart the game
   */
  function restartGame() {
    initializeGame();
  }

  /**
   * Implement touch drag and drop functionality
   */
  function implementTouchDragDrop() {
    if (!currentCard) {
      console.error("Current card not found, cannot implement touch drag and drop");
      return;
    }

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
      e.preventDefault();
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

  /**
   * Create a touch drop event
   * @param {Touch} touch - Touch object
   * @returns {Object} - Simulated drop event
   */
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

  /**
   * Reset current card position
   */
  function resetCurrentCardPosition() {
    currentCard.style.position = 'static';
    currentCard.style.left = '';
    currentCard.style.top = '';
  }

  /**
   * Show an alert using Telegram's native alert or fallback to browser alert
   * @param {string} message - Alert message
   */
  function showAlert(message) {
    if (tg && tg.showAlert) {
      tg.showAlert(message);
    } else {
      alert(message);
    }
  }

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

})();