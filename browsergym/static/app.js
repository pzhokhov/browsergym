// helper function

const RADIUS = 20;

function degToRad(degrees) {
  var result = Math.PI / 180 * degrees;
  return result;
}

// setup of the canvas

var canvas = document.querySelector('canvas');
var ctx = canvas.getContext('2d');


// pointer lock object forking for cross browser

canvas.requestPointerLock = canvas.requestPointerLock ||
                            canvas.mozRequestPointerLock;

document.exitPointerLock = document.exitPointerLock ||
                           document.mozExitPointerLock;

canvas.onclick = function(ev) {
  canvas.requestPointerLock();
};

var keysDown = new Set();
var mouseButtonsDown = new Set();

canvas.tabIndex = 1000;
canvas.addEventListener( "mousedown", function(ev) {
    mouseButtonsDown.add(ev.button)
});
canvas.addEventListener( "mouseup", function(ev) {
    mouseButtonsDown.delete(ev.button)
});
canvas.addEventListener( "keydown", function(ev) {
    keysDown.add(ev.code)
});
canvas.addEventListener( "keyup", function(ev) {
    keysDown.delete(ev.code)
});


// pointer lock event listeners

// Hook pointer lock state change events for different browsers
document.addEventListener('pointerlockchange', lockChangeAlert, false);
document.addEventListener('mozpointerlockchange', lockChangeAlert, false);

var stepping = true;

function lockChangeAlert() {
  if (document.pointerLockElement === canvas ||
      document.mozPointerLockElement === canvas) {
    console.log('The pointer lock status is now locked');
    document.addEventListener("mousemove", updatePosition, false);
    setFocus(true);
  } else {
    console.log('The pointer lock status is now unlocked');  
    document.removeEventListener("mousemove", updatePosition, false);
    setFocus(false);
  }
}

var tracker = document.getElementById('tracker');

var animation;

function updatePosition(e) {
    dx += e.movementX;
    dy += e.movementY;
}

var dx = 0;
var dy = 0;

var socket = null; 

function setFocus(focus) {
    if (focus) {
        socket  = new WebSocket("ws://" + document.domain + ":" + location.port + "/ws");
        // Connection opened
        socket.addEventListener('open', function (event) {
            console.log("socket open!")
            socket.send('Hello Server!');
            stepping = true;
        });
        // Listen for messages
        socket.addEventListener('message', function (event) {
            canvasDraw(event.data)
        });
    } else {
        if (socket != null) {
            // socket.close();
        }
        stepping = false;
    }
}



function step() {   
    if (stepping) {
        ac = {"mouseDx": dx, "mouseDy": dy, "mouseButtons": Array.from(mouseButtonsDown), "keys": Array.from(keysDown)}
        dx = 0
        dy = 0
        var xhr = new XMLHttpRequest();
        socket.send(JSON.stringify(ac))
    }
 }

function observe() {   
    if (stepping) {
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function () {
            if (this.readyState == 4 && this.status == 200) {
                var response = this.responseText; 
                if (!animation) {
                    animation = requestAnimationFrame(function() {
                        animation = null;
                        canvasDraw(response);
                    });
                }
            }
        }
        xhr.open("GET", "/observe", true);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.send();
    }
 }

function canvasDraw(rawImgData) {
    var img = new Image();
    img.onload = function () {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        observe();
    };
    img.src  = "data:image/png;base64," + rawImgData;
}


// observe();
stepping = false;
window.setInterval(step, 50);
