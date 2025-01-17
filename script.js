const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let lastPlayerFired = 0;
let lastAlienFired = 0;
let showMenu = false;
let animationFrameId;
let playerFireCooldown = 200; // 500 ms cooldown for player
let alienFireCooldown = 1000;
let alienSpeed = 2;


canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const spaceshipImage = new Image();
spaceshipImage.src = 'space-ship.png'; // Adjust the path as needed
const smokeImage1 = new Image();
const smokeImage2 = new Image();
const explosionImage = new Image();
const ufoImage = new Image();

const playerRocketImage = new Image();
const alienMissileImage = new Image();

playerRocketImage.src = 'rocket.png';       // Adjust the path as needed
alienMissileImage.src = 'alie-missile.png'; // Adjust the path as needed

function drawRocket(rocket) {
    ctx.drawImage(playerRocketImage, rocket.x, rocket.y, rocket.width * 1.5, rocket.height * 3);
}

function drawAlienRocket(rocket) {
    ctx.save(); // Save the current state
    ctx.translate(rocket.x + rocket.width / 2, rocket.y + rocket.height / 2); // Move to the rocket's center
    ctx.rotate(Math.PI); // Rotate 180 degrees (in radians)
    ctx.drawImage(alienMissileImage, -rocket.width / 2, -rocket.height / 2, rocket.width * 10, rocket.height * 3); // Draw the image rotated
    ctx.restore(); // Restore to the previous state
}

smokeImage1.src = 'double-smokes.png'; // Adjust the path as needed
smokeImage2.src = 'smoked.png';        // Adjust the path as needed
explosionImage.src = 'explosion.png';  // Adjust the path as needed
ufoImage.src = 'ufo.png';              // Adjust the path as needed


let spaceship = {
    x: canvas.width / 2,
    y: canvas.height - 100,
    width: 50,
    height: 50,
    speed: 10,
    health: 3,  // Spaceship health
    smokeTrail: 0 // Smoke intensity level
};

let aliens = [];
let rockets = [];
let alienRockets = [];
let score = 0;
let gameOver = false;

// Handle key inputs
let keys = {};
document.addEventListener('keydown', (e) => keys[e.code] = true);
document.addEventListener('keyup', (e) => keys[e.code] = false);

const stars = [];
const maxStars = 100; // Adjust the maximum number of stars

function generateStars() {
    for (let i = 0; i < maxStars; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            speed: Math.random() * 0.5 + 0.1 // Random speed between 0.1 and 0.6
        });
    }
}

function updateStars() {
    stars.forEach(star => {
        star.y += star.speed; // Move the star down
        // Reset star position to the top when it moves off the bottom
        if (star.y > canvas.height) {
            star.y = 0; // Reset to the top
            star.x = Math.random() * canvas.width; // Randomize x position
        }
    });
}

function drawStars() {
    ctx.fillStyle = 'white';
    stars.forEach(star => {
        ctx.fillRect(star.x, star.y, 2, 2); // Draw each star as a small square
    });
}

// Call generateStars to create the stars at the beginning of your code
generateStars();

// Variables for button positions and sizes
const buttonWidth = 200;
const buttonHeight = 60;
const buttonPadding = 20;
let selectedMode = "Easy"; // Default mode

// Button positions (calculated based on canvas size)
const buttons = [
    { text: "Easy", x: canvas.width / 2 - buttonWidth / 2, y: canvas.height / 2 - 2 * (buttonHeight + buttonPadding) },
    { text: "Medium", x: canvas.width / 2 - buttonWidth / 2, y: canvas.height / 2 - (buttonHeight + buttonPadding) },
    { text: "Hard", x: canvas.width / 2 - buttonWidth / 2, y: canvas.height / 2 },
    { text: "Practice", x: canvas.width / 2 - buttonWidth / 2, y: canvas.height / 2 + (buttonHeight + buttonPadding) }
];

// Add the Resume button to the list of buttons
buttons.push({ text: "Resume", x: canvas.width / 2 - buttonWidth / 2, y: canvas.height / 2 + 2 * (buttonHeight + buttonPadding) });

// Function to draw the buttons
function drawButtons() {
    ctx.font = "30px Arial";
    buttons.forEach((button) => {
        // Highlight the selected mode or resume button
        ctx.fillStyle = selectedMode === button.text || button.text === "Resume" && !gamePaused ? "lightblue" : "white";
        ctx.fillRect(button.x, button.y, buttonWidth, buttonHeight);
        ctx.fillStyle = "black";
        ctx.textAlign = "center";
        ctx.fillText(button.text, button.x + buttonWidth / 2, button.y + buttonHeight / 2 + 10);
    });
}

// Define the Restart button properties
const restartButton = {
    x: canvas.width / 2 - 100,  // Button position
    y: canvas.height / 2 + 50,
    width: 200,
    height: 50,
    text: "Restart"
};

// Function to detect button clicks
function handleButtonClick(event) {
    const mouseX = event.clientX - canvas.offsetLeft;
    const mouseY = event.clientY - canvas.offsetTop;

    buttons.forEach((button) => {
        if (
            mouseX >= button.x &&
            mouseX <= button.x + buttonWidth &&
            mouseY >= button.y &&
            mouseY <= button.y + buttonHeight
        ) {
            if (button.text === "Resume") {
                toggleGamePause();
            } else {
                // Change the game difficulty
                selectedMode = button.text;
                adjustDifficulty(selectedMode);
            }
        }
    });
}


// Function to draw the buttons
function drawButtons() {
    ctx.font = "30px Arial";
    buttons.forEach((button) => {
        // Highlight the selected mode
        ctx.fillStyle = selectedMode === button.text ? "lightblue" : "white";
        ctx.fillRect(button.x, button.y, buttonWidth, buttonHeight);
        ctx.fillStyle = "black";
        ctx.textAlign = "center";
        ctx.fillText(button.text, button.x + buttonWidth / 2, button.y + buttonHeight / 2 + 10);
    });
}

// Function to detect if a click is inside a button
function handleButtonClick(event) {
    const mouseX = event.clientX - canvas.offsetLeft;
    const mouseY = event.clientY - canvas.offsetTop;

    buttons.forEach((button) => {
        if (
            mouseX >= button.x &&
            mouseX <= button.x + buttonWidth &&
            mouseY >= button.y &&
            mouseY <= button.y + buttonHeight
        ) {
            selectedMode = button.text; // Change mode
            adjustDifficulty(selectedMode); // Adjust the game difficulty
        }
    });
}

// Adjust difficulty based on the selected mode
function adjustDifficulty(mode) {
    switch (mode) {
        case "Easy":
            console.log(alienFireCooldown, alienSpeed);
            alienFireCooldown = 1000; // Slower alien fire rate
            alienSpeed = 2;
            break;
        case "Medium":
            console.log(alienFireCooldown, alienSpeed);
            alienFireCooldown = 750;
            alienSpeed = 3;
            break;
        case "Hard":
            console.log(alienFireCooldown, alienSpeed);
            alienFireCooldown = 500; // Faster alien fire rate
            alienSpeed = 5;
            break;
        case "Practice":
            console.log(alienFireCooldown, alienSpeed);
            alienFireCooldown = 2000; // Very slow alien fire rate
            alienSpeed = 1;
            break;
        default:
            break;
    }
}

// Event listener for clicks
canvas.addEventListener("click", handleButtonClick);

// Call this function to draw the buttons in your game loop or at initialization
drawButtons();

let gamePaused = false; // Variable to track whether the game is paused or not

const hamburger = {
    x: 50,  // Position of the hamburger icon
    y: 50,
    width: 40,  // Size of the hamburger icon
    height: 30,
    visible: false
};

// Function to draw the hamburger menu icon
function drawHamburger() {
    ctx.fillStyle = 'white';
    ctx.fillRect(hamburger.x, hamburger.y, hamburger.width, hamburger.height / 6); // Top bar
    ctx.fillRect(hamburger.x, hamburger.y + hamburger.height / 3, hamburger.width, hamburger.height / 6); // Middle bar
    ctx.fillRect(hamburger.x, hamburger.y + 2 * (hamburger.height / 3), hamburger.width, hamburger.height / 6); // Bottom bar
}

// Function to toggle game pause and show the menu
function toggleGamePause() {
    gamePaused = !gamePaused;
    if (gamePaused) {
        cancelAnimationFrame(animationFrameId); // Stop the game loop
        showMenu = true; // Display the buttons when the game is paused
    } else {
        showMenu = false; // Hide the buttons when the game resumes
        requestAnimationFrame(gameLoop); // Resume the game loop
    }
}

// Function to detect button clicks, including the restart button
canvas.addEventListener("click", (event) => {
    const mouseX = event.clientX - canvas.offsetLeft;
    const mouseY = event.clientY - canvas.offsetTop;

    // Check if the game is over and the user clicks the restart button
    if (gameOver) {
        if (
            mouseX >= restartButton.x &&
            mouseX <= restartButton.x + restartButton.width &&
            mouseY >= restartButton.y &&
            mouseY <= restartButton.y + restartButton.height
        ) {
            restartGame(); // Restart the game when the button is clicked
        }
    }

    // Check for other button clicks during the game (e.g., difficulty buttons, hamburger menu)
    if (!gameOver && gamePaused) {
        handleButtonClick(event); // Handle the button clicks
    }
});


// Game loop
function gameLoop() {
    if (!gameOver) {
        ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the screen

        // Update and draw stars for the background
        updateStars();
        drawStars();

        // Draw the hamburger menu icon
        drawHamburger();

        if (!gamePaused) {
            // Handle the game logic if the game is not paused
            ctx.fillStyle = 'white';
            ctx.font = '30px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`Score: ${score}`, canvas.width - 130, canvas.height / 13);
            ctx.fillText(`Mode: ${selectedMode}`, canvas.width - 130, canvas.height / 9);

            // Display spaceship health bar with color based on smokeTrail
            ctx.fillText(`Health: ${spaceship.smokeTrail === 0 ? 200 : spaceship.smokeTrail === 1 ? 120 : 40}`, canvas.width / 2 - 100, canvas.height / 20);
            ctx.fillStyle = spaceship.smokeTrail === 0 ? "white" : spaceship.smokeTrail === 1 ? "yellow" : "red";
            ctx.fillRect(canvas.width / 2, canvas.height / 35, spaceship.smokeTrail === 0 ? 200 : spaceship.smokeTrail === 1 ? 120 : 40, 20);
            moveSpaceship();
            drawSpaceship();
            handleRockets();
            handleAliens();
            handleAlienRockets();
            detectCollisions();
            console.log(selectedMode);
        }

        if (showMenu) {
            drawButtons(); // Show the buttons when the game is paused
        }

        // Continue the game loop
        animationFrameId = requestAnimationFrame(gameLoop);
    } else {
        gameOverScreen();
    }
}

requestAnimationFrame(gameLoop);

// Functions for drawing and updating objects go here...

function moveSpaceship() {
    if (keys['ArrowLeft'] && spaceship.x > 0) {
        spaceship.x -= 5;
    }
    if (keys['ArrowRight'] && spaceship.x + spaceship.width < canvas.width) {
        spaceship.x += 5;
    }
    if (keys['Space']) {
        fireRocket();
    }
}

spaceshipImage.onload = () => {
    requestAnimationFrame(gameLoop);
};

function drawSpaceship() {
    // First, draw the smoke trail below the spaceship
    if (spaceship.smokeTrail === 1) {
        ctx.drawImage(smokeImage1, spaceship.x + spaceship.width / 2, spaceship.y, spaceship.width, spaceship.height * 10);
    } else if (spaceship.smokeTrail === 2) {
        ctx.drawImage(smokeImage2, spaceship.x + spaceship.width / 6, spaceship.y, spaceship.width * 2, spaceship.height * 10);
    }

    // Then, draw the spaceship above the smoke trail
    ctx.drawImage(spaceshipImage, spaceship.x, spaceship.y - 100, spaceship.width * 2, spaceship.height * 2.5);
}



function spawnAliens() {
    if (aliens.length < 5) {
        let alien = {
            x: Math.random() * (canvas.width - 50),
            y: -50,
            width: 50,
            height: 50,
            color: 'green',
            speed: 3,
            lastFired: 0 // Store last fired time for each alien
        };
        aliens.push(alien);
    }
}

function handleAliens() {
    aliens.forEach((alien, index) => {
        alien.y += alien.speed;
        if (alien.y > canvas.height) {
            aliens.splice(index, 1); // Remove if out of bounds
        }
        drawAlien(alien);

        const now = Date.now();
        // Allow each alien to fire independently
        if (now - alien.lastFired >= alienFireCooldown) {
            fireAlienRocket(alien);
            alien.lastFired = now; // Update last fired time for this alien
        }
    });
    spawnAliens();
}

function drawAlien(alien) {
    ctx.drawImage(ufoImage, alien.x, alien.y, alien.width * 1.5, alien.height * 1.5);
}

function fireAlienRocket(alien) {
    alienRockets.push({
        x: alien.x + alien.width / 2,
        y: alien.y + alien.height,
        width: 5,
        height: 15,
        speed: 5
    });
}

function fireRocket() {
    const now = Date.now();
    if (now - lastPlayerFired >= playerFireCooldown) {
        rockets.push({
            x: spaceship.x + spaceship.width / 2,
            y: spaceship.y,
            width: 5,
            height: 15,
            speed: 7
        });
        lastPlayerFired = now;
    }
}


function handleRockets() {
    rockets.forEach((rocket, index) => {
        rocket.y -= rocket.speed;
        if (rocket.y < 0) {
            rockets.splice(index, 1);
        }
        drawRocket(rocket);
    });
}

function handleAlienRockets() {
    alienRockets.forEach((rocket, index) => {
        rocket.y += rocket.speed;
        if (rocket.y > canvas.height) {
            alienRockets.splice(index, 1);
        }
        drawAlienRocket(rocket);
    });
}


function detectCollisions() {
    rockets.forEach((rocket, rIndex) => {
        aliens.forEach((alien, aIndex) => {
            if (rocket.x < alien.x + alien.width && rocket.x + rocket.width > alien.x &&
                rocket.y < alien.y + alien.height && rocket.y + rocket.height > alien.y) {
                score++; // Increase score when an alien is hit
                drawExplosion(alien.x + alien.width / 2, alien.y + alien.height / 2);
                aliens.splice(aIndex, 1); // Remove alien
                rockets.splice(rIndex, 1); // Remove rocket
            }
        });
    });

    alienRockets.forEach((rocket, rIndex) => {
        if (rocket.x < spaceship.x + spaceship.width && rocket.x + rocket.width > spaceship.x &&
            rocket.y < spaceship.y + spaceship.height && rocket.y + rocket.height > spaceship.y) {
            alienRockets.splice(rIndex, 1); // Remove alien rocket
            spaceship.health--; // Decrease spaceship health
            spaceship.smokeTrail++; // Increase smoke level

            if (spaceship.health === 0) {
                drawExplosion(spaceship.x + spaceship.width / 2, spaceship.y + spaceship.height / 2); // Show explosion
                gameOver = true; // Set game over state
            }
        }
    });
}

// Function to draw explosion at a given location
function drawExplosion(x, y) {
    ctx.drawImage(explosionImage, x - 50, y - 50, 100, 100); // Adjust explosion size and position
}

// Function to display the game-over screen
function gameOverScreen() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
    ctx.fillStyle = "red";
    ctx.font = "60px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Game Over", canvas.width / 2, canvas.height / 2);

    ctx.font = "30px Arial";
    ctx.fillText("Your Score: " + score, canvas.width / 2, canvas.height / 2 + 40);

    // Draw the Restart button
    ctx.fillStyle = "white";
    ctx.fillRect(restartButton.x, restartButton.y, restartButton.width, restartButton.height);
    ctx.fillStyle = "black";
    ctx.fillText(restartButton.text, restartButton.x + restartButton.width / 2, restartButton.y + restartButton.height / 2 + 10);
}

// Function to restart the game
function restartGame() {
    spaceship.health = 3; // Reset spaceship health
    spaceship.smokeTrail = 0; // Reset smoke trail
    aliens = []; // Clear aliens
    rockets = []; // Clear player rockets
    alienRockets = []; // Clear alien rockets
    score = 0; // Reset score
    gameOver = false; // Reset game-over state
    requestAnimationFrame(gameLoop); // Restart the game loop
}