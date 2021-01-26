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
            stepping = true;
        });
        // Listen for messages
        socket.addEventListener('message', function (event) {
            event.data.arrayBuffer().then(buf => canvasDraw(base64ArrayBuffer(buf)))
        });
        socket.addEventListener('close', function (event) {
            console.log(event.data)
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
    };
    img.src  = "data:image/png;base64," + rawImgData;
}


function base64ArrayBuffer(arrayBuffer) {
  var base64    = ''
  var encodings = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

  var bytes         = new Uint8Array(arrayBuffer)
  var byteLength    = bytes.byteLength
  var byteRemainder = byteLength % 3
  var mainLength    = byteLength - byteRemainder

  var a, b, c, d
  var chunk

  // Main loop deals with bytes in chunks of 3
  for (var i = 0; i < mainLength; i = i + 3) {
    // Combine the three bytes into a single integer
    chunk = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2]

    // Use bitmasks to extract 6-bit segments from the triplet
    a = (chunk & 16515072) >> 18 // 16515072 = (2^6 - 1) << 18
    b = (chunk & 258048)   >> 12 // 258048   = (2^6 - 1) << 12
    c = (chunk & 4032)     >>  6 // 4032     = (2^6 - 1) << 6
    d = chunk & 63               // 63       = 2^6 - 1

    // Convert the raw binary segments to the appropriate ASCII encoding
    base64 += encodings[a] + encodings[b] + encodings[c] + encodings[d]
  }

  // Deal with the remaining bytes and padding
  if (byteRemainder == 1) {
    chunk = bytes[mainLength]

    a = (chunk & 252) >> 2 // 252 = (2^6 - 1) << 2

    // Set the 4 least significant bits to zero
    b = (chunk & 3)   << 4 // 3   = 2^2 - 1

    base64 += encodings[a] + encodings[b] + '=='
  } else if (byteRemainder == 2) {
    chunk = (bytes[mainLength] << 8) | bytes[mainLength + 1]

    a = (chunk & 64512) >> 10 // 64512 = (2^6 - 1) << 10
    b = (chunk & 1008)  >>  4 // 1008  = (2^6 - 1) << 4

    // Set the 2 least significant bits to zero
    c = (chunk & 15)    <<  2 // 15    = 2^4 - 1

    base64 += encodings[a] + encodings[b] + encodings[c] + '='
  }
  
  return base64
}


stepping = false;
window.setInterval(step, 50);
