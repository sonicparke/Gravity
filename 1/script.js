var Gravity = function() {
	
	this.$window = $(window);
	
	this.game = new Phaser.Game(
		this.$window.width(),	//Canvas Size
		this.$window.height(),	//Canvas Size
		Phaser.AUTO,			//Renderer
		'container',			//DOM ID
		{
			preload: this.preload.bind(this),
			create: this.create.bind(this),
			update: this.update.bind(this),
			render: this.render.bind(this)
		},
		false,			//transparent
		false			//antialias
	);
	
	this.div = document.getElementById( 'container' );
	this.$canvas = $('canvas');
	this.canvas = this.$canvas.get(0);
	this.ratio = window.devicePixelRatio >= 1 ? window.devicePixelRatio : 1;
	
	this.h = Math.random();
	this.s = 0.5;
	this.l = 0.66;
	
	this.color = new THREE.Color().setHSL();
	
	this.screenLength = Math.sqrt( this.game.width * this.game.width + this.game.height * this.game.height );
	
	this.fireDirection = new Phaser.Point();
	this.fireTheta = Math.PI * 1.7;
	this.fireStrength = this.screenLength / 17;
	
	this.maxFire = 2000;
	this.fireRate = 12;
	this.nextFire = 0;
	
	this.collisionGroups = null;
	
	//this.addStats();
};
		
Gravity.prototype = {
	
	preload : function() {
		
		this.game.load.image('arrow', 'images/arrow.png');
		
	},
	
	create : function() {
		this.game.stage.backgroundColor = '#404040';
		this.createPhysics();
		this.createBullets();
	},
	
	createPhysics : function() {
		this.game.physics.startSystem( Phaser.Physics.P2JS );
		this.game.physics.p2.setImpactEvents(true);
		this.game.physics.p2.defaultRestitution = 0;
		this.game.physics.p2.defaultFriction = 0.5;
		this.game.physics.p2.contactMaterial.relaxation = 2;
	
		this.collisionGroups = {
			walls	: this.game.physics.p2.createCollisionGroup(),
			bullets	: this.game.physics.p2.createCollisionGroup(),
			planets	: this.game.physics.p2.createCollisionGroup(),
			goals	: this.game.physics.p2.createCollisionGroup()
		};
		this.game.physics.p2.updateBoundsCollisionGroup();
		
	},
	
	createBullets : function() {
		
		this.bullets = this.game.add.group();
		this.bullets.enableBody = true;
		this.bullets.physicsBodyType = Phaser.Physics.P2JS;
		this.bullets.enableBodyDebug = true;
		
		var i = this.maxFire,
			bullet;
		
		while(i--) {
			bullet = this.bullets.create( 50, 50, 'arrow' );
			bullet.anchor.setTo(0.5, 0.5);
			bullet.planetPointer = new Phaser.Point();
			
			bullet.kill();
			bullet.body.collideWorldBounds = false;
			bullet.body.fixedRotation = true;
			//bullet.checkWorldBounds = true;
			//bullet.outOfBoundsKill = true;
			bullet.body.clearCollision(true);
			bullet.body.setCollisionGroup( this.collisionGroups.bullets );
			bullet.body.collides([]);
			bullet.scale.x = 0.3;
			bullet.scale.y = 0.3;
			bullet.blendMode = PIXI.blendModes.ADD;
		}		
		
	},
	
	fire : function() {
		
		var bullet;

		if( this.game.time.now > this.nextFire && this.bullets.countDead() > 0) {
			
			this.nextFire = this.game.time.now + this.fireRate;

			bullet = this.bullets.getFirstDead();
			bullet.reset(
				this.game.width / 4 + 100 * Math.random() - 50,
				3 * this.game.height / 4  + 100 * Math.random() - 50
			);
			bullet.px = bullet.x;
			bullet.py = bullet.y;
			
			bullet.reset(
				this.game.width / 4,
				3 * this.game.height / 4
			);
			
			bullet.body.moveRight(	this.fireStrength * Math.cos( this.fireTheta ) + Math.random() * 1 );
			bullet.body.moveUp(		this.fireStrength * Math.sin( this.fireTheta ) + Math.random() * 1 );
			this.h += .01;
			
			this.fireTheta += Math.PI / 1000;
		}

		
		
	},
	
	update : function() {
		this.fire();
		this.killOutOfBounds();
		this.attractGravity();
	},
	
	killOutOfBounds : function() {
		var bullet,
			i = this.bullets.children.length,
			bounds = this.game.world.bounds;
			
		while(i--) {
			bullet = this.bullets.children[i];
			
			if(
				bullet.alive &&
				bullet.x + 20 < bounds.left 	||
				bullet.y + 20 < bounds.top		||
				bullet.x - 20 > bounds.right	||
				bullet.y - 20 > bounds.bottom
			) {
				bullet.kill();
			}
		}
	},
	
	attractGravity : function() {
		var i = this.bullets.children.length,
			denominator,
			gravity = 30000,
			speed;
		
		while(i--) {
			
			bullet = this.bullets.children[i];
			
			if(bullet.alive) {
				bullet.planetPointer.set(
					this.game.world.bounds.halfWidth - bullet.x,
					this.game.world.bounds.halfHeight - bullet.y
				);
			
				denominator =	Math.pow( this.game.world.bounds.halfWidth - bullet.x, 2 ) +
								Math.pow( this.game.world.bounds.halfHeight - bullet.y, 2 );
							
				bullet.planetPointer.normalize();

				speed = gravity / denominator;
				
				bullet.planetPointer.x *= speed;
				bullet.planetPointer.y *= speed;
			
				bullet.body.data.velocity[0] += bullet.body.world.pxmi( bullet.planetPointer.x );
				bullet.body.data.velocity[1] += bullet.body.world.pxmi( bullet.planetPointer.y );
				
				bullet.rotation = Math.atan2( bullet.y - bullet.py, bullet.x - bullet.px );
				
				bullet.px = bullet.x;
				bullet.py = bullet.y;
				
			}
		}
	},
	
	render : function() {
		
	},
	
	addStats : function() {
		this.stats = new Stats();
		this.stats.domElement.style.position = 'absolute';
		this.stats.domElement.style.top = '0px';
		$("#container").append( this.stats.domElement );
	},
	
};

var gravity;

$(function() {
	gravity = new Gravity();
});