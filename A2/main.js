var canvas;
var gl;

var program;

var near = 1;
var far = 100;

var left = -6.0;
var right = 6.0;
var ytop = 6.0;
var bottom = -6.0;

var lightPosition2 = vec4(100.0, 100.0, 100.0, 1.0);
var lightPosition = vec4(0.0, 0.0, 100.0, 1.0);

var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0);
var lightDiffuse = vec4(1.0, 1.0, 1.0, 1.0);
var lightSpecular = vec4(1.0, 1.0, 1.0, 1.0);

var materialAmbient = vec4(1.0, 0.0, 1.0, 1.0);
var materialDiffuse = vec4(1.0, 0.8, 0.0, 1.0);
var materialSpecular = vec4(0.4, 0.4, 0.4, 1.0);
var materialShininess = 30.0;

var ambientColor, diffuseColor, specularColor;

var modelMatrix, viewMatrix;
var modelViewMatrix, projectionMatrix, normalMatrix;
var modelViewMatrixLoc, projectionMatrixLoc, normalMatrixLoc;
var eye;
var at = vec3(0.0, 2.0, 0.0);
var up = vec3(0.0, 1.0, 0.0);

var RX = 0;
var RY = 0;
var RZ = 0;

var MS = []; // The modeling matrix stack
var TIME = 0.0; // Realtime
var TIME = 0.0; // Realtime
var resetTimerFlag = true;
var animFlag = false;
var prevTime = 0.0;
var useTextures = 1;

let treePositions = [];
let mountainPositions = [];
let trackerStartTime = 0.0;
let frameCount = 0;

// ------------ Images for textures stuff --------------
var texSize = 64;

var image1 = new Array();
for (var i = 0; i < texSize; i++) image1[i] = new Array();
for (var i = 0; i < texSize; i++)
  for (var j = 0; j < texSize; j++) image1[i][j] = new Float32Array(4);
for (var i = 0; i < texSize; i++)
  for (var j = 0; j < texSize; j++) {
    var c = ((i & 0x8) == 0) ^ ((j & 0x8) == 0);
    image1[i][j] = [c, c, c, 1];
  }

// Convert floats to ubytes for texture

var image2 = new Uint8Array(4 * texSize * texSize);

for (var i = 0; i < texSize; i++)
  for (var j = 0; j < texSize; j++)
    for (var k = 0; k < 4; k++)
      image2[4 * texSize * i + 4 * j + k] = 255 * image1[i][j][k];

var textureArray = [];

function isLoaded(im) {
  if (im.complete) {
    console.log("loaded");
    return true;
  } else {
    console.log("still not loaded!!!!");
    return false;
  }
}

function loadFileTexture(tex, filename) {
  tex.textureWebGL = gl.createTexture();
  tex.image = new Image();
  tex.image.src = filename;
  tex.isTextureReady = false;
  tex.image.onload = function () {
    handleTextureLoaded(tex);
  };
  // The image is going to be loaded asyncronously (lazy) which could be
  // after the program continues to the next functions. OUCH!
}

function loadImageTexture(tex, image) {
  tex.textureWebGL = gl.createTexture();
  tex.image = new Image();
  //tex.image.src = "CheckerBoard-from-Memory" ;

  gl.bindTexture(gl.TEXTURE_2D, tex.textureWebGL);
  //gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    texSize,
    texSize,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    image
  );
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(
    gl.TEXTURE_2D,
    gl.TEXTURE_MIN_FILTER,
    gl.NEAREST_MIPMAP_LINEAR
  );
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); //Prevents s-coordinate wrapping (repeating)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); //Prevents t-coordinate wrapping (repeating)
  gl.bindTexture(gl.TEXTURE_2D, null);

  tex.isTextureReady = true;
}

function initTextures() {
  textureArray.push({});
  loadFileTexture(textureArray[textureArray.length - 1], "train.jpg");

  textureArray.push({});
  loadFileTexture(textureArray[textureArray.length - 1], "cubetexture.png");

  textureArray.push({});
  loadImageTexture(textureArray[textureArray.length - 1], image2);
}

function handleTextureLoaded(textureObj) {
  gl.bindTexture(gl.TEXTURE_2D, textureObj.textureWebGL);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true); // otherwise the image would be flipped upsdide down
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    textureObj.image
  );
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(
    gl.TEXTURE_2D,
    gl.TEXTURE_MIN_FILTER,
    gl.LINEAR_MIPMAP_NEAREST
  );
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); //Prevents s-coordinate wrapping (repeating)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); //Prevents t-coordinate wrapping (repeating)
  gl.bindTexture(gl.TEXTURE_2D, null);
  // console.log(textureObj.image.src) ;

  textureObj.isTextureReady = true;
}

//----------------------------------------------------------------

function setColor(c) {
  ambientProduct = mult(lightAmbient, c);
  diffuseProduct = mult(lightDiffuse, c);
  specularProduct = mult(lightSpecular, materialSpecular);

  gl.uniform4fv(
    gl.getUniformLocation(program, "ambientProduct"),
    flatten(ambientProduct)
  );
  gl.uniform4fv(
    gl.getUniformLocation(program, "diffuseProduct"),
    flatten(diffuseProduct)
  );
  gl.uniform4fv(
    gl.getUniformLocation(program, "specularProduct"),
    flatten(specularProduct)
  );
  gl.uniform4fv(
    gl.getUniformLocation(program, "lightPosition"),
    flatten(lightPosition)
  );
  gl.uniform1f(gl.getUniformLocation(program, "shininess"), materialShininess);
}

function toggleTextures() {
  useTextures = 1 - useTextures;
  gl.uniform1i(gl.getUniformLocation(program, "useTextures"), useTextures);
}

function waitForTextures1(tex) {
  setTimeout(function () {
    console.log("Waiting for: "+ tex.image.src) ;
    wtime = new Date().getTime();
    if (!tex.isTextureReady) {
      console.log(wtime + " not ready yet") ;
      waitForTextures1(tex);
    } else {
      console.log("ready to render") ;
      window.requestAnimFrame(render);
    }
  }, 5);
}

// Takes an array of textures and calls render if the textures are created
function waitForTextures(texs) {
  setTimeout(function () {
    var n = 0;
    for (var i = 0; i < texs.length; i++) {
      console.log("boo"+texs[i].image.src) ;
      n = n + texs[i].isTextureReady;
    }
    wtime = new Date().getTime();
    if (n != texs.length) {
      console.log(wtime + " not ready yet") ;
      waitForTextures(texs);
    } else {
      console.log("ready to render") ;
      window.requestAnimFrame(render);
    }
  }, 5);
}

window.onload = function init() {
  canvas = document.getElementById("gl-canvas");

  gl = WebGLUtils.setupWebGL(canvas);
  if (!gl) {
    alert("WebGL isn't available");
  }

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.5, 0.5, 1.0, 1.0);

  gl.enable(gl.DEPTH_TEST);

  //
  //  Load shaders and initialize attribute buffers
  //
  program = initShaders(gl, "vertex-shader", "fragment-shader");
  gl.useProgram(program);

  // Load canonical objects and their attributes
  Cube.init(program);
  Cylinder.init(9, program);
  Cone.init(9, program);
  Sphere.init(36, program);

  gl.uniform1i(gl.getUniformLocation(program, "useTextures"), useTextures);

  // record the locations of the matrices that are used in the shaders
  modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
  normalMatrixLoc = gl.getUniformLocation(program, "normalMatrix");
  projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");

  // set a default material
  setColor(materialDiffuse);

  // set the callbacks for the UI elements
  document.getElementById("sliderXi").oninput = function () {
    RX = this.value;
    window.requestAnimFrame(render);
  };
  document.getElementById("sliderYi").oninput = function () {
    RY = this.value;
    window.requestAnimFrame(render);
  };
  document.getElementById("sliderZi").oninput = function () {
    RZ = this.value;
    window.requestAnimFrame(render);
  };

  document.getElementById("animToggleButton").onclick = function () {
    if (animFlag) {
      animFlag = false;
    } else {
      animFlag = true;
      resetTimerFlag = true;
      window.requestAnimFrame(render);
    }
  };

  document.getElementById("textureToggleButton").onclick = function () {
    toggleTextures();
    window.requestAnimFrame(render);
  };

  var controller = new CameraController(canvas);
  controller.onchange = function (xRot, yRot) {
    RX = xRot;
    RY = yRot;
    window.requestAnimFrame(render);
  };

  // load and initialize the textures
  initTextures();

  // Recursive wait for the textures to load
  waitForTextures(textureArray);
  //setTimeout (render, 100) ;

  for (let i = 0; i < 25; i++) {
    const xPos = Math.random() * 50;
    const zPos = -3 - Math.random() * 50;
    treePositions.push([xPos, 0, zPos]);
    xMPos = -10 + Math.random() * 10 + i * 3
    zMPos = - 50 - Math.random() * 20
    mountainPositions.push([xMPos, 0, zMPos])
  }
};

// Sets the modelview and normal matrix in the shaders
function setMV() {
  modelViewMatrix = mult(viewMatrix, modelMatrix);
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
  normalMatrix = inverseTranspose(modelViewMatrix);
  gl.uniformMatrix4fv(normalMatrixLoc, false, flatten(normalMatrix));
}

// Sets the projection, modelview and normal matrix in the shaders
function setAllMatrices() {
  gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));
  setMV();
}

// Draws a 2x2x2 cube center at the origin
// Sets the modelview matrix and the normal matrix of the global program
function drawCube() {
  setMV();
  Cube.draw();
}

// Draws a sphere centered at the origin of radius 1.0.
// Sets the modelview matrix and the normal matrix of the global program
function drawSphere() {
  setMV();
  Sphere.draw();
}
// Draws a cylinder along z of height 1 centered at the origin
// and radius 0.5.
// Sets the modelview matrix and the normal matrix of the global program
function drawCylinder() {
  setMV();
  Cylinder.draw();
}

// Draws a cone along z of height 1 centered at the origin
// and base radius 1.0.
// Sets the modelview matrix and the normal matrix of the global program
function drawCone() {
  setMV();
  Cone.draw();
}

// Post multiples the modelview matrix with a translation matrix
// and replaces the modelview matrix with the result
function gTranslate(x, y, z) {
  modelMatrix = mult(modelMatrix, translate([x, y, z]));
}

// Post multiples the modelview matrix with a rotation matrix
// and replaces the modelview matrix with the result
function gRotate(theta, x, y, z) {
  modelMatrix = mult(modelMatrix, rotate(theta, [x, y, z]));
}

// Post multiples the modelview matrix with a scaling matrix
// and replaces the modelview matrix with the result
function gScale(sx, sy, sz) {
  modelMatrix = mult(modelMatrix, scale(sx, sy, sz));
}

// Pops MS and stores the result as the current modelMatrix
function gPop() {
  modelMatrix = MS.pop();
}

// pushes the current modelMatrix in the stack MS
function gPush() {
  MS.push(modelMatrix);
}

function createWheels() {
  gPush();
  {
    // Front wheels
    gTranslate(1.6, -0.5, -0.45);
    gScale(0.25, 0.25, 0.075);
    drawSphere();
    gTranslate(0.0, 0.0, 12);
    drawSphere();
    // Back wheels
    gTranslate(-13, 0.0, 0);
    drawSphere();
    gTranslate(0.0, 0.0, -12);
    drawSphere();
  }
  gPop();
}

function createCar() {
  gPush();
  {
    gPush();
    {
      gScale(2.0, 0.5, 0.4);
      drawCube();
    }
    gPop();
    createWheels();
  }
  gPop();
}

function createLocomotiveWheels() {
  gPush();
  {
    gTranslate(-0.5, -0.4, -1);
    gRotate(-90, 0, 1, 0);
    gPush();
    {
      // Draw left wheel
      gRotate(-360 * TIME, 0, 0, 1);
      gPush();
      {
        gScale(0.4, 0.4, 0.075);
        drawSphere();
      }
      gPop();
      // Create connecting cube
      gPush();
      {
        setColor(vec4(0, 0, 0, 1.0));
        gTranslate(0.3, 0, 0);
        gRotate(360 * TIME, 0, 0, 1);
        gTranslate(0.45, 0, 0);
        gScale(0.5, 0.075, 0.075);
        drawCube();
      }
      gPop();
    }
    gPop();
    // Draw right wheel
    setColor(vec4(0.5, 0.5, 0.5, 1.0));
    gTranslate(1, 0, 0);
    gPush();
    {
      gRotate(-360 * TIME, 0, 0, 1);
      gScale(0.4, 0.4, 0.075);
      drawSphere();
    }
    gPop();
    gPush();
    {
      gTranslate(1.25, -0.1, 0);
      gScale(0.3, 0.3, 0.075);
      drawSphere();
    }
    gPop();
  }
  gPop();
}

function createLocomotive() {
  gPush();
  {
    // Create Main locomotive body
    setColor(vec4(0.5, 0.5, 0.5, 1.0));
    gRotate(90, 0, 1, 0);
    gPush();
    {
      gScale(1, 1, 3);
      drawCylinder();
    }
    gPop();
    // Create end-caps for the main body
    gPush();
    {
      gTranslate(0, 0, -1);
      gScale(0.5, 0.5, 1);
      drawCone();
    }
    gPop();
    gPush();
    {
      gTranslate(0, 0, 1.03);
      gRotate(180, 0, 1, 0);
      gScale(0.5, 0.5, 1);
      drawCone();
    }
    gPop();
    // Create smoke stack
    gPush();
    {
      gTranslate(0, 0.65, 0.75);
      gRotate(90, 1, 0, 0);
      gScale(0.4, 0.4, 0.5);
      drawCylinder();
    }
    gPop();
    // Create cow plow
    gPush();
    {
      gTranslate(0, 0, 2);
      gScale(0.5, 0.5, 1);
      gRotate(25, 1, 0, 0);
      gTranslate(0, -0.7, -0.1);
      gScale(0.8, 0.8, 1);
      drawCone();
    }
    gPop();
    createLocomotiveWheels();
  }
  gPop();
}

function addTrainCoupler() {
  gPush();
  {
    gTranslate(-1, -0.25, 0);
    gScale(1, 0.1, 0.1);
    drawCube();
  }
  gPop();
}

function buildTrain() {
    gPush();
    {
      gTranslate(TIME * 2.7, 0, 0);
      createLocomotive();
      addTrainCoupler();
      toggleTextures()
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, textureArray[0].textureWebGL);
      gl.uniform1i(gl.getUniformLocation(program, "texture1"), 0);
      for (let i = 0; i < 10; i++) {
        gTranslate(-1.5, 0, 0);
        addTrainCoupler();
        gTranslate(-3, 0, 0);
        createCar();
      }
    }
    toggleTextures();
    gPop();
  }

  function createTree() {
    gPush();
    {
      gTranslate(0, -0.5, 0);
      gRotate(-90, 1, 0, 0);
      // Create Tree trunk
      setColor(vec4(0.2, 0.114, 0, 1.0));
      gPush();
      gScale(0.4, 0.4, 0.5);
      drawCylinder();
      gPop();
      setColor(vec4(0.0, 0.6, 0.0, 1.0));
      // Create tree body segments
      gScale(0.6, 0.6, 1);
      gTranslate(0, 0, 0.25);
      for (let i = 0; i < 4; i++) {
        gTranslate(0, 0, 0.4);
        gScale(0.9, 0.9, 0.9);
        drawCone();
      }
    }
    gPop();
  }

  function createMountain() {
      gPush();
      {
          gRotate(-90, 1, 0, 0)
          gScale(5, 2, 5)
          drawCone();
      }
      gPop()
  }

function render() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  eye = vec3(TIME, 3, 10);
  eye[1] = eye[1] + 0;

  // set the projection matrix
  projectionMatrix = ortho(left, right, bottom, ytop, near, far);

  // set the camera matrix
  viewMatrix = lookAt(eye, at, up);

  // initialize the modeling matrix stack
  MS = [];
  modelMatrix = mat4();

  // apply the slider rotations
  gRotate(RZ, 0, 0, 1);
  gRotate(RY, 0, 1, 0);
  gRotate(RX, 1, 0, 0);

  // Compensate for canvas scale
  gScale(0.5, 1.0, 1.0);

  // send all the matrices to the shaders
  setAllMatrices();

  // get real time
  var curTime;
  if (animFlag) {
    curTime = new Date().getTime() / 1000;
    if (resetTimerFlag) {
      prevTime = curTime;
      resetTimerFlag = false;
    }
    TIME = TIME + curTime - prevTime;
    prevTime = curTime;
    frameCount++;
    if (TIME - trackerStartTime > 2) {
      trackerStartTime = TIME;
      console.log("Number of Frames in the last 2 seconds: ", frameCount);
      frameCount = 0;
    }
  }

  // Add groundbox
  gPush();
  {
    gTranslate(0, -5, 0);
    gScale(500, 1, 500);
    drawCube();
  }
  gPop();
  gTranslate(0, -3.2, -10);
  buildTrain();
  // Create Forest
  for (let i = 0; i < 25; i++) {
    gPush();
    gTranslate(...treePositions[i]);
    createTree();
    gPop();
    gPush();
    {
        gTranslate(...mountainPositions[i])
        setColor(vec4(0.66, 0.5, 0.25, 1.0));
        createMountain();
    }
    gPop()
  }

  at = vec3(0.95 * TIME, 2, 0);
  lookAt(eye, at, up);
  setMV();

  if (animFlag) window.requestAnimFrame(render);
}

// A simple camera controller which uses an HTML element as the event
// source for constructing a view matrix. Assign an "onchange"
// function to the controller as follows to receive the updated X and
// Y angles for the camera:
//
//   var controller = new CameraController(canvas);
//   controller.onchange = function(xRot, yRot) { ... };
//
// The view matrix is computed elsewhere.
function CameraController(element) {
  var controller = this;
  this.onchange = null;
  this.xRot = 0;
  this.yRot = 0;
  this.scaleFactor = 3.0;
  this.dragging = false;
  this.curX = 0;
  this.curY = 0;

  // Assign a mouse down handler to the HTML element.
  element.onmousedown = function (ev) {
    controller.dragging = true;
    controller.curX = ev.clientX;
    controller.curY = ev.clientY;
  };

  // Assign a mouse up handler to the HTML element.
  element.onmouseup = function (ev) {
    controller.dragging = false;
  };

  // Assign a mouse move handler to the HTML element.
  element.onmousemove = function (ev) {
    if (controller.dragging) {
      // Determine how far we have moved since the last mouse move
      // event.
      var curX = ev.clientX;
      var curY = ev.clientY;
      var deltaX = (controller.curX - curX) / controller.scaleFactor;
      var deltaY = (controller.curY - curY) / controller.scaleFactor;
      controller.curX = curX;
      controller.curY = curY;
      // Update the X and Y rotation angles based on the mouse motion.
      controller.yRot = (controller.yRot + deltaX) % 360;
      controller.xRot = controller.xRot + deltaY;
      // Clamp the X rotation to prevent the camera from going upside
      // down.
      if (controller.xRot < -90) {
        controller.xRot = -90;
      } else if (controller.xRot > 90) {
        controller.xRot = 90;
      }
      // Send the onchange event to any listener.
      if (controller.onchange != null) {
        controller.onchange(controller.xRot, controller.yRot);
      }
    }
  };
}