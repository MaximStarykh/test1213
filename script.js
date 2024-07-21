const timeline = document.getElementById('timeline');
        const currentCard = document.getElementById('current-card');
        const drawCardButton = document.getElementById('draw-card');
        const scoreElement = document.getElementById('score');
        const livesElement = document.getElementById('lives');
        const progressElement = document.getElementById('progress');
        const placementIndicator = document.querySelector('.placement-indicator');

        let score = 0;
        let lives = 3;
        let progress = 0;
        const totalCards = 10;

        const events = [
            { name: "Birth of Christ", year: 0 },
            { name: "Fall of Rome", year: 476 },
            { name: "Discovery of America", year: 1492 },
            { name: "French Revolution", year: 1789 },
            { name: "World War I Begins", year: 1914 },
            { name: "Moon Landing", year: 1969 },
            { name: "Fall of Berlin Wall", year: 1989 },
            { name: "Internet Goes Public", year: 1991 },
            { name: "9/11 Attacks", year: 2001 },
            { name: "First iPhone Released", year: 2007 }
        ];

        let availableEvents = [...events];
        let currentEvent = null;

        function updateGameInfo() {
            scoreElement.textContent = score;
            livesElement.textContent = '❤️'.repeat(lives);
            progressElement.textContent = `${progress}/${totalCards}`;
        }

        function drawCard() {
            if (availableEvents.length === 0) {
                endGame();
                return;
            }

            const randomIndex = Math.floor(Math.random() * availableEvents.length);
            currentEvent = availableEvents.splice(randomIndex, 1)[0];
            
            currentCard.querySelector('.card-title').textContent = currentEvent.name;
            currentCard.querySelector('.card-year').textContent = currentEvent.year;
            currentCard.classList.remove('flipped');

            drawCardButton.disabled = true;
            currentCard.draggable = true;
        }

        function createEventCard(event) {
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <div class="card-content">
                    <div class="card-title">${event.name}</div>
                    <div class="card-year">${event.year}</div>
                </div>
                <div class="card-back">?</div>
            `;
            card.addEventListener('click', () => flipCard(card));
            return card;
        }

        function handleDragStart(e) {
            e.dataTransfer.setData('text/plain', e.target.id);
            setTimeout(() => (currentCard.style.opacity = '0.5'), 0);
        }

        function handleDragEnd(e) {
            currentCard.style.opacity = '1';
            placementIndicator.style.display = 'none';
            resetCardPositions();
        }

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

        function handleDragLeave(e) {
            placementIndicator.style.display = 'none';
        }

        function handleDrop(e) {
            e.preventDefault();
            const id = e.dataTransfer.getData('text');
            if (id === 'current-card' && currentEvent) {
                const newCard = createEventCard(currentEvent);
                const afterElement = getDragAfterElement(timeline, e.clientX);
                if (afterElement) {
                    timeline.insertBefore(newCard, afterElement);
                } else {
                    timeline.appendChild(newCard);
                }

                const isCorrect = validateCardPlacement(newCard);
                if (isCorrect) {
                    newCard.classList.add('correct');
                    showFeedback("Correct placement!", true);
                    score += 10;
                } else {
                    newCard.classList.add('incorrect');
                    showFeedback("Incorrect placement. Try again!", false);
                    lives--;
                    if (lives <= 0) {
                        endGame();
                        return;
                    }
                }

                currentCard.querySelector('.card-title').textContent = 'Draw a card';
                currentCard.querySelector('.card-year').textContent = 'to continue!';
                currentCard.draggable = false;
                drawCardButton.disabled = false;
                progress++;

                updateGameInfo();

                if (progress === totalCards) {
                    endGame();
                    return;
                }

                currentEvent = null;
            }
            placementIndicator.style.display = 'none';
            resetCardPositions();
        }

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

        function resetCardPositions() {
            const cards = timeline.querySelectorAll('.card');
            cards.forEach(card => {
                card.classList.remove('sliding-left', 'sliding-right');
            });
        }

        function flipCard(card) {
            card.classList.toggle('flipped');
        }

        function validateCardPlacement(newCard) {
            const cards = Array.from(timeline.querySelectorAll('.card'));
            const newCardIndex = cards.indexOf(newCard);
            const newCardYear = parseInt(newCard.querySelector('.card-year').textContent);

            if (newCardIndex === 0) {
                const nextCard = cards[1];
                if (nextCard) {
                    const nextCardYear = parseInt(nextCard.querySelector('.card-year').textContent);
                    return newCardYear <= nextCardYear;
                }
            } else if (newCardIndex === cards.length - 1) {
                const prevCard = cards[cards.length - 2];
                const prevCardYear = parseInt(prevCard.querySelector('.card-year').textContent);
                return newCardYear >= prevCardYear;
            } else {
                const prevCard = cards[newCardIndex - 1];
                const nextCard = cards[newCardIndex + 1];
                const prevCardYear = parseInt(prevCard.querySelector('.card-year').textContent);
                const nextCardYear = parseInt(nextCard.querySelector('.card-year').textContent);
                return newCardYear >= prevCardYear && newCardYear <= nextCardYear;
            }

            return true;  // If there's only one card, it's always correct
        }

        function showFeedback(message, isCorrect) {
            const feedback = document.getElementById('feedback');
            feedback.textContent = message;
            feedback.className = isCorrect ? 'correct' : 'incorrect';
            feedback.style.display = 'block';
            setTimeout(() => {
                feedback.style.display = 'none';
            }, 2000);
        }
        
        function initializeGame() {
            // Place a random card on the timeline to start
            const randomIndex = Math.floor(Math.random() * availableEvents.length);
            const initialEvent = availableEvents.splice(randomIndex, 1)[0];
            const initialCard = createEventCard(initialEvent);
            timeline.appendChild(initialCard);
            progress++;
            updateGameInfo();
        }

        function endGame() {
            drawCardButton.disabled = true;
            if (lives <= 0) {
                alert(`Game Over! You've run out of lives. Your final score is ${score}.`);
            } else {
                alert(`Congratulations! You've completed the game with a score of ${score}.`);
            }
        }

        drawCardButton.addEventListener('click', drawCard);
        currentCard.addEventListener('dragstart', handleDragStart);
        currentCard.addEventListener('dragend', handleDragEnd);
        timeline.addEventListener('dragover', handleDragOver);
        timeline.addEventListener('dragleave', handleDragLeave);
        timeline.addEventListener('drop', handleDrop);

        // Initialize the game
        initializeGame();
        updateGameInfo();