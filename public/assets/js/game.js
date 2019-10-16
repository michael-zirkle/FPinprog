

const inputMessage = document.getElementById('inputMessage');
const messages = document.getElementById('messages');




 
window.addEventListener('keydown', event => {
  if (event.which === 13) {
    sendMessage();
  }
  if (event.which === 32) {
    if (document.activeElement === inputMessage) {
      inputMessage.value = inputMessage.value + ' ';
    }
  }
});
 
function sendMessage() {
  let message = inputMessage.value;
  if (message) {
    inputMessage.value = '';
    $.ajax({
      type: 'POST',
      url: '/submit-chatline',
      data: {
        message,
        refreshToken: getCookie('refreshJwt')
      },
      success: function(data) {},
      error: function(xhr) {
        console.log(xhr);
      }
    })
  }
}

function playerData(gender, type) {
  //let gender = user.gender;
  //let type = user.type;
    $.ajax({
      type: 'GET',
      url: '/uri',
      datatype: 'JSON',
      data: {
        
      },
      success: function(data) {
        console.log(data);
        //console.log(user);
      },
      error: function(xhr) {
        console.log(xhr);
      }
    })
  }

 
function addMessageElement(el) {
  messages.append(el);
  messages.lastChild.scrollIntoView();
}


class BootScene extends Phaser.Scene {
  constructor() {
    super({
      key: 'BootScene',
      active: true
    });
  }

  preload() {
   
    this.load.image('tiles', 'assets/map/Overworld.png');
    
    this.load.tilemapTiledJSON('map', 'assets/map/khyme2.json');
    
    this.load.spritesheet('player', 'assets/warrior_m.png', {
      frameWidth: 32,
      frameHeight: 36
    });

    this.load.image('golem', 'assets/images/coppergolem.png');
    this.load.image('ent', 'assets/images/dark-ent.png');
    this.load.image('demon', 'assets/images/demon.png');
    this.load.image('worm', 'assets/images/giant-worm.png');
    this.load.image('wolf', 'assets/images/wolf.png');
    this.load.image('sword', 'assets/images/attack-icon.png');
  }

  create() {
    this.scene.start('WorldScene');
  }
}

class WorldScene extends Phaser.Scene {
  constructor() {
    super({
      key: 'WorldScene'
    });
  }

  
  

  create() {
    this.socket = io();
    this.otherPlayers = this.physics.add.group();

    
    this.createMap();

    
    this.createAnimations();

    
    this.cursors = this.input.keyboard.createCursorKeys();

    
    this.createEnemies();
    
   
    this.socket.on('currentPlayers', function (players) {
      Object.keys(players).forEach(function (id) {
        if (players[id].playerId === this.socket.id) {
          this.createPlayer(players[id]);
        } else {
          this.addOtherPlayers(players[id]);
        }
      }.bind(this));
    }.bind(this));

    this.socket.on('newPlayer', function (playerInfo) {
      this.addOtherPlayers(playerInfo);
    }.bind(this));

    this.socket.on('disconnect', function (playerId) {
      this.otherPlayers.getChildren().forEach(function (player) {
        if (playerId === player.playerId) {
          player.destroy();
        }
      }.bind(this));
    }.bind(this));

    this.socket.on('playerMoved', function (playerInfo) {
      this.otherPlayers.getChildren().forEach(function (player) {
        if (playerInfo.playerId === player.playerId) {
          player.flipX = playerInfo.flipX;
          player.setPosition(playerInfo.x, playerInfo.y);
        }
      }.bind(this));
    }.bind(this));

    this.socket.on('new message', (data) => {
      const usernameSpan = document.createElement('span');
      const usernameText = document.createTextNode(data.username);
      usernameSpan.className = 'username';
      usernameSpan.appendChild(usernameText);
     
      const messageBodySpan = document.createElement('span');
      const messageBodyText = document.createTextNode(data.message);
      messageBodySpan.className = 'messageBody';
      messageBodySpan.appendChild(messageBodyText);
     
      const messageLi = document.createElement('li');
      messageLi.setAttribute('username', data.username);
      messageLi.append(usernameSpan);
      messageLi.append(messageBodySpan);
     
      addMessageElement(messageLi);
    });

    
    
  }


  createMap() {
   
    this.map = this.make.tilemap({
      key: 'map'
    });

    
    const tiles = this.map.addTilesetImage('Overworld', 'tiles');

    
    
    const belowLayer = this.map.createStaticLayer('Below Player', tiles, 0, 0);
    this.worldLayer = this.map.createStaticLayer('World', tiles, 0, 0);
    const aboveLayer = this.map.createStaticLayer('Above Player', tiles, 0, 0);

    aboveLayer.setDepth(10);
    this.worldLayer.setDepth(0);
    belowLayer.setDepth(0);

    

    this.worldLayer.setCollisionByProperty({ collides: true });
    

    

    
    this.physics.world.bounds.width = this.map.widthInPixels;
    this.physics.world.bounds.height = this.map.heightInPixels;
  }

  createAnimations() {
    
    this.anims.create({
      key: 'left',
      frames: this.anims.generateFrameNumbers('player', {
        frames: [9, 10, 11]
      }),
      frameRate: 10,
      repeat: -1
    });

    
    this.anims.create({
      key: 'right',
      frames: this.anims.generateFrameNumbers('player', {
        frames: [3, 4, 5]
      }),
      frameRate: 10,
      repeat: -1
    });

    this.anims.create({
      key: 'up',
      frames: this.anims.generateFrameNumbers('player', {
        frames: [0, 1, 2]
      }),
      frameRate: 10,
      repeat: -1
    });

    this.anims.create({
      key: 'down',
      frames: this.anims.generateFrameNumbers('player', {
        frames: [6, 7, 8]
      }),
      frameRate: 10,
      repeat: -1
    });
  }

  

  createPlayer(playerInfo) {
    
    this.player = this.add.sprite(0, 0, 'player', 1);
    
    this.container = this.add.container(playerInfo.x, playerInfo.y);
    this.container.setSize(6, 6);
    this.container.setScale(.8);
    this.physics.world.enable(this.container);
    this.container.add(this.player);

    this.weapon = this.add.sprite(10, 0, 'sword');
    this.weapon.setScale(0.8);
    this.weapon.setSize(3, 3);
    this.physics.world.enable(this.weapon);
 
    this.container.add(this.weapon);
    this.attacking = false;

    
    this.updateCamera();
    
    

    
    this.container.body.setCollideWorldBounds(true);
    

    this.physics.add.collider(this.container, this.spawns);
    this.physics.add.collider(this.container, this.worldLayer);
    this.physics.add.overlap(this.weapon, this.spawns, this.onMeetEnemy, false, this);
  }

  addOtherPlayers(playerInfo) {
    const otherPlayer = this.add.sprite(playerInfo.x, playerInfo.y, 'player', 9);
    otherPlayer.setTint(Math.random() * 0xffffff);
    otherPlayer.playerId = playerInfo.playerId;
    this.otherPlayers.add(otherPlayer);
  }

  updateCamera() {
    // limit camera to map
    this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
    this.cameras.main.startFollow(this.container);
    this.cameras.main.roundPixels = true; // avoid tile bleed
  }

  createEnemies() {
    
    this.spawns = this.physics.add.group({
      classType: Phaser.GameObjects.Sprite
    });
    for (var i = 0; i < 2; i++) {
      const location = this.getValidLocation();
      
      var enemy = this.spawns.create(location.x, location.y, this.getEnemySprite());
      enemy.body.setCollideWorldBounds(true);
      enemy.body.setImmovable();
      
    }
    this.timedEvent = this.time.addEvent({
      delay: 3000,
      callback: this.moveEnemies,
      callbackScope: this,
      loop: true
    });
    this.physics.add.collider(this.spawns, this.worldLayer);
  }

  moveEnemies () {
    this.spawns.getChildren().forEach((enemy) => {
      const randNumber = Math.floor((Math.random() * 4) + 1);
   
      switch(randNumber) {
        case 1:
          enemy.body.setVelocityX(50);
          break;
        case 2:
          enemy.body.setVelocityX(-50);
          break;
        case 3:
          enemy.body.setVelocityY(50);
          break;
        case 4:
          enemy.body.setVelocityY(50);
          break;
        default:
          enemy.body.setVelocityX(50);
      }
    });
   
    setTimeout(() => {
      this.spawns.setVelocityX(0);
      this.spawns.setVelocityY(0);
    }, 500);
  }

  getEnemySprite() {
    var sprites = ['worm'];
    return sprites[Math.floor(Math.random() * sprites.length)];
  }

  getValidLocation() {
    var validLocation = false;
    var x, y;
    while (!validLocation) {
      x = Phaser.Math.RND.between(400, 500);
      y = Phaser.Math.RND.between(100, 200);

      var occupied = false;
      this.spawns.getChildren().forEach((child) => {
        if (child.getBounds().contains(x, y)) {
          occupied = true;
        }
      });
      if (!occupied) validLocation = true;
    }
    return { x, y };
  }

  onMeetEnemy(player, enemy) {
    if (this.attacking) {
      const location = this.getValidLocation();
      enemy.x = location.x;
      enemy.y = location.y;
    }
  }

  update() {
    if (this.container) {
      this.container.body.setVelocity(0);

      
      if (this.cursors.left.isDown) {
        this.container.body.setVelocityX(-80);
      } else if (this.cursors.right.isDown) {
        this.container.body.setVelocityX(80);
      }

      
      if (this.cursors.up.isDown) {
        this.container.body.setVelocityY(-80);
      } else if (this.cursors.down.isDown) {
        this.container.body.setVelocityY(80);
      }

      
      if (this.cursors.left.isDown) {
        this.player.anims.play('left', true);
        this.player.flipX = false;

        this.weapon.flipX = true;
        this.weapon.setX(-10);
      } else if (this.cursors.right.isDown) {
        this.player.anims.play('right', true);
        this.player.flipX = false;

        this.weapon.flipX = false;
        this.weapon.setX(10);
      } else if (this.cursors.up.isDown) {
        this.player.anims.play('up', true);
      } else if (this.cursors.down.isDown) {
        this.player.anims.play('down', true);
      } else {
        this.player.anims.stop();
      }

      if (Phaser.Input.Keyboard.JustDown(this.cursors.space) && !this.attacking && document.activeElement !== inputMessage) {
        this.attacking = true;
        setTimeout(() => {
          this.attacking = false;
          this.weapon.angle = 0;
        }, 150);
      }

      if (this.attacking) {
        if (this.weapon.flipX) {
          this.weapon.angle -= 10;
        } else {
          this.weapon.angle += 10;
        }
      }

      
      var x = this.container.x;
      var y = this.container.y;
      var flipX = this.player.flipX;
      if (this.container.oldPosition && (x !== this.container.oldPosition.x || y !== this.container.oldPosition.y || flipX !== this.container.oldPosition.flipX)) {
        this.socket.emit('playerMovement', { x, y, flipX });
      }
      
      this.container.oldPosition = {
        x: this.container.x,
        y: this.container.y,
        flipX: this.player.flipX
      };
    }
  }

 
  
}



var config = {
  type: Phaser.AUTO,
  parent: 'content',
  width: 480,
  height: 320,
  zoom: 2,
  pixelArt: true,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: {
        y: 0
      },
      debug: false
    }
  },
  scene: [
    BootScene,
    WorldScene
  ]
};
var game = new Phaser.Game(config);
