// Game config.
var config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

// Set globals.
var player;
var stars;
var platforms;
var cursors;
var score = 0;
var scoreText;
var gameOver;

// Initialize game object.
var game = new Phaser.Game(config);

/**
* Pre-load game assets
*/
function preload()
{
    this.load.image('sky', 'assets/images/sky.png');
    this.load.image('ground', 'assets/images/platform.png');
    this.load.image('star', 'assets/images/star.png');
    this.load.image('bomb', 'assets/images/bomb.png');
    this.load.spritesheet('dude', 'assets/images/dude.png', { frameWidth: 32, frameHeight: 48 });
}

/**
* Set up game objects and physics.
*/
function create()
{
    // Set game background.
    this.add.image(400, 300, 'sky');
    
    // Platforms
    platforms = this.physics.add.staticGroup();
    platforms.create(400, 568, 'ground').setScale(2).refreshBody();
    platforms.create(600, 400, 'ground');
    platforms.create(50, 250, 'ground');
    platforms.create(750, 220, 'ground');
    
    // Add player sprite.
    player = this.physics.add.sprite(100, 450, 'dude');
    
    // Set player physics.
    player.setBounce(0.2);
    player.setCollideWorldBounds(true);
    this.physics.add.collider(player, platforms);
    
    // Set player sprites
    this.anims.create({
        key: 'left',
        frames: this.anims.generateFrameNumbers('dude', { start: 0, end: 3 }),
        frameRate: 10,
        repeat: -1 // Tells the animation to loop
    });
    
    this.anims.create({
        key: 'turn',
        frames: [ { key: 'dude', frame: 4 } ],
        frameRate: 20
    });
    
    this.anims.create({
        key: 'right',
        frames: this.anims.generateFrameNumbers('dude', { start: 5, end: 8 }),
        frameRate: 10,
        repeat: -1
    });
    
    // Stars - dynamic group as we need them to move and bounce.
    stars = this.physics.add.group({
        key: 'star', // texture key
        repeat: 11,
        setXY: { x: 12, y: 0, stepX: 70 }
    });
    
    // Set random bounce value for stars - 0 is no bounce, 1 is full bounce.
    stars.children.iterate(function (child) {
        child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
    });
    
    // Add star physics.
    this.physics.add.collider(stars, platforms); // So they don't fall through the platforms
    
    // Check if player overlaps star - if so, remove the start via the collectStar function.
    this.physics.add.overlap(player, stars, collectStar, null, this);

    // Bombs - dynamic group for interaction between stars, player, and platforms.
    bombs = this.physics.add.group();

    // Add bomb physics.
    this.physics.add.collider(bombs, platforms);
    this.physics.add.collider(player, bombs, hitBomb, null, this);
    
    // Set key controls.
    cursors = this.input.keyboard.createCursorKeys();

    // Set up scoring.
    scoreText = this.add.text(16, 16, 'score: 0', { fontSize: '32px', fill: '#000' });
}

/**
* Game listeners
*/
function update()
{
    // Poll player movements.
    if (cursors.left.isDown)
    {
        player.setVelocityX(-160);
        player.anims.play('left', true);
    }
    else if (cursors.right.isDown)
    {
        player.setVelocityX(160);
        player.anims.play('right', true);
    }
    else
    {
        player.setVelocityX(0);
        player.anims.play('turn');
    }

    if (cursors.up.isDown && player.body.touching.down)
    {
        player.setVelocityY(-330);
    }
}

/** 
* Helpers
*/
// Handle star interaction.
function collectStar (player, star)
{
    // Increment score and remove star.
    star.disableBody(true, true);
    score += 10;
    scoreText.setText('Score: ' + score);

    // If all stars are collected, release another batch of stars from the sky.
    if (stars.countActive(true) === 0)
    {
        stars.children.iterate(function (child) {
            child.enableBody(true, child.x, 0, true, true);
        });

        // Pick a random coordinate for the bomb, always on the opposite side of the screen.
        var x = (player.x < 400) ? Phaser.Math.Between(400, 800) : Phaser.Math.Between(0, 400);

        // Initialize bomb.
        var bomb = bombs.create(x, 16, 'bomb');
        bomb.setBounce(1);
        bomb.setCollideWorldBounds(true);
        bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
    }
}

// Game over if player hits bomb.
function hitBomb (player, bomb)
{
    this.physics.pause();
    player.setTint(0xff0000);
    player.anims.play('turn');
    gameOver = true;
}