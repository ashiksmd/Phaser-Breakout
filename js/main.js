var GameState = {
 
  //load the game assets before the game starts
  preload: function() {
	this.game.load.image('bat', 'assets/img/bat.png');
	this.game.load.image('ball', 'assets/img/ball.png');
	this.load.spritesheet('block', 'assets/img/sprites.png', 32, 16, 8);
	
	this.game.load.image('sky', 'assets/img/sky.jpg');
	
	//this.game.load.audio('bgmusic', ['assets/audio/background.mp3', 'assets/audio/background.ogg']);
  },
 
  //executed after everything is loaded
  create: function() {
	//scaling options
	this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;

	//have the game centered horizontally
	this.scale.pageAlignHorizontally = true;
	this.scale.pageAlignVertically = true;

	//screen size will be set automatically
	this.scale.setScreenSize(true);
	
	//game.stage.backgroundColor = 'D3D3D3';
	game.add.tileSprite(0, 0, 360, 640, 'sky');
	
	//stats
	var style = { font: "20px Arial", fill: "#fff"};
	this.game.add.text(10, 20, "Score:", style);
	this.scoreText = this.game.add.text(80, 20, "", style)
	
	this.score = 0;
	this.drawScore();
	
	//We're going to be using physics, so enable the Arcade Physics system
    game.physics.startSystem(Phaser.Physics.ARCADE);
    game.physics.arcade.checkCollision.down = false;	//No collision check for bottom
    
    this.blocks = game.add.group();
    this.blocks.enableBody = true;	
	
	//Draw blocks
	for(var i=0; i<12; i++) {
		for(var j=0; j<5; j++) {
			var block = this.blocks.create(30*i, 50+15*j, 'block', j);
			block.body.immovable = true;
		}
	}
	
	//Draw ball
	this.ball = this.game.add.sprite(175, 560, 'ball');
	this.ball.anchor.setTo(0.5);
	this.ball.checkWorldBounds = true;
	
	game.physics.arcade.enable(this.ball);
	
	this.ball.body.collideWorldBounds = true;
	this.ball.body.bounce.set(1);	
	
	//If ball falls off bottom of screen
	this.ball.events.onOutOfBounds.add(this.fail, this);
	
	//Draw bat
	this.bat = this.game.add.sprite(150, 580, 'bat');
	this.bat.anchor.setTo(0.5);
	game.physics.arcade.enable(this.bat);
	this.bat.body.immovable = true;
	this.bat.body.collideWorldBounds = true;
	this.bat.body.bounce.set(1);
	
	//Ball is resting on bat at the beginning
	this.ballOnBat = true;
	
	var self = this;
	
	if(!game.device.desktop) {
		//On a mobile device. Use gyroscope for control
		window.addEventListener('deviceorientation', function(eventData) {
			// gamma is the left-to-right tilt in degrees, where right is positive
			var tiltLR = eventData.gamma;
			self.updateOrientation(tiltLR);
		});
	} else {
		this.cursors = game.input.keyboard.createCursorKeys();
	}
	
	this.introText = game.add.text(game.world.centerX, 400, '- Click to Start -', { font: "40px Arial", fill: "#ffffff", align: "center" });
    this.introText.anchor.setTo(0.5);

    game.input.onDown.add(this.releaseBall, this);
	
	//music = game.add.audio('bgmusic',1,true);
	//music.play('',0,1,true);
  },
  
  updateOrientation: function(tiltLR) {
	  this.tilt = tiltLR;
  },
  
  drawScore: function() {
	  this.scoreText.text = this.score;
  },
  
  moveBat: function() {
	  this.bat.body.velocity.x = this.tilt * 15;
  },
  
  readKeyboardInput: function() {
	  //This method is called only if running on desktop.
	  //Simulate gyroscope tilt using keyboard input.
	  if(this.cursors.left.isDown) {
		  this.tilt = -25;
	  } else if(this.cursors.right.isDown) {
		  this.tilt = 25;
	  } else {
		  this.tilt = 0;
	  }
  },
  
  releaseBall: function() {
	    if(!this.ballOnBat) return;
	    
		//Start moving ball in a random direction.
		var randomX = Math.random()* 200 + 100;		//x between 100,300
		var direction = Math.floor(Math.random() * 2);
		if(direction == 1) randomX = -randomX;		//Randomly choose left or right

		var randomY = -(Math.random()* 50 + 250);	//Y-Velocity between -250,-300. Need minimum upwards speed

		//Set velocity of ball
		this.ball.body.velocity.setTo(randomX, randomY);
		
		this.introText.visible = false;
		this.ballOnBat = false;
  },
  
  win: function() {
		//Display win text
		var style = { font: "20px Arial", fill: "#fff"};
		this.score += 1000;
		
		this.introText.text = "- Next Level -";
		this.introText.visible = true;
		
		//Stop and return ball to starting position
		this.ball.body.velocity.set(0);
		this.ball.x = 175;
		this.ball.y = 560;
		
		//Revive all the blocks
		this.blocks.callAll("revive");
		
		//Ball is back on the bat. Release on touch/click.
		this.ballOnBat = true;
  },
  
  fail: function() {
		//Display fail text
		this.introText.text = "- Try Again -";
		this.introText.visible = true;
		
		if(navigator.vibrate) {
			navigator.vibrate(500);
		}

		//Stop the ball
	    this.ball.body.velocity.setTo(0,0);
	    
	    //Restart game after 2 seconds
	    var self = this;
	    this.game.time.events.add(2000, function() {
			self.game.state.restart();
		});	  
  },
  
  ballHitBlock: function(ball, block) {
	 block.kill();
	 
	 this.score += 10;
	 
	 //If there are no blocks remaining, we win
	 if(this.blocks.countLiving() == 0) {
		 this.win();
	 }
  },
  
  ballHitBat: function(ball, bat) {
	  var diff = 0;
	  
	  if (ball.x < bat.x) {
		  //Ball is on the left-hand side of the paddle
		  diff = bat.x - ball.x;
		  ball.body.velocity.x = (-10 * diff);
	  } else if (ball.x > bat.x) {
		  //Ball is on the right-hand side of the paddle
		  diff = ball.x - bat.x;
		  ball.body.velocity.x = (10 * diff);
	  } else {
		  //Ball is perfectly in the middle
		  //Add a little random X to stop it bouncing straight up!
		  ball.body.velocity.x = 2 + Math.random() * 8;
	  }
  },
 
  //game loop, executed many times per second 
  update: function() {
		//If on desktop, check for keyboard input
	    if(game.device.desktop)	this.readKeyboardInput();
	    
	    //Move bat according to input
		this.moveBat();
		
		//Ball can collide with bat or blocks
		game.physics.arcade.collide(this.ball, this.bat, this.ballHitBat, null, this);
		game.physics.arcade.collide(this.ball, this.blocks, this.ballHitBlock, null, this);
		
		//Update score
		this.drawScore();
  }
 
};
 
//initiate the Phaser framework
var game = new Phaser.Game(360, 640, Phaser.CANVAS);
game.state.add('GameState', GameState);
 
game.state.start('GameState');
