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

var modelMatrix, viewMatrix, modelViewMatrix, projectionMatrix, normalMatrix;
var modelViewMatrixLoc, projectionMatrixLoc, normalMatrixLoc;
var eye;
var at = vec3(0.0, 0.0, 0.0);
var up = vec3(0.0, 1.0, 0.0);

var RX = 0;
var RY = 0;
var RZ = 0;

var MS = []; // The modeling matrix stack
var TIME = 0.0; // Realtime
var prevTime = 0.0;
var resetTimerFlag = true;
var animFlag = false;
var controller;

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

  setColor(materialDiffuse);

  Cube.init(program);
  Cylinder.init(9, program);
  Cone.init(9, program);
  Sphere.init(36, program);

  modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
  normalMatrixLoc = gl.getUniformLocation(program, "normalMatrix");
  projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");

  // For lighting. Do not touch
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
    console.log(animFlag);

    controller = new CameraController(canvas);
    controller.onchange = function (xRot, yRot) {
      RX = xRot;
      RY = yRot;
      window.requestAnimFrame(render);
    };
  };

  render();
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
// and replaces the modeling matrix with the result
function gTranslate(x, y, z) {
  modelMatrix = mult(modelMatrix, translate([x, y, z]));
}

// Post multiples the modelview matrix with a rotation matrix
// and replaces the modeling matrix with the result
function gRotate(theta, x, y, z) {
  modelMatrix = mult(modelMatrix, rotate(theta, [x, y, z]));
}

// Post multiples the modelview matrix with a scaling matrix
// and replaces the modeling matrix with the result
function gScale(sx, sy, sz) {
  modelMatrix = mult(modelMatrix, scale(sx, sy, sz));
}

// Pops MS and stores the result as the current modelMatrix
function gPop() {
  modelMatrix = MS.pop();
}

// pushes the current modelViewMatrix in the stack MS
function gPush() {
  MS.push(modelMatrix);
}

// Generates one strand of seaweed containing 10 segments.
// The position of the first segment must be sent before calling the function
function createOneStrand() {
  setColor(vec4(0, 0.5, 0, 1.0));
  for (let i = 0; i < 10; i++) {
    gPush();
    {
      gScale(0.2, 0.5, 0.2);
      drawSphere();
    }
    gPop();
    const rotationAmount = 17 * Math.cos(i * 20 + TIME);
    gTranslate(0, 0.5, 0);
    gRotate(rotationAmount, 0, 0, 1);
    gTranslate(0, 0.5, 0);
  }
}

// Sets the starting point of the seaweed strands and calls the function to generate each strand
// Does not change the reference point
function createSeaweedStrands() {
  const startPositions = [
    [0, 1.5, 0],
    [-1, 0.5, 0],
    [1, 0.5, 0],
  ];
  startPositions.forEach((startPoint) => {
    gPush();
    {
      gTranslate(...startPoint);
      createOneStrand();
    }
    gPop();
  });
}

// Creates the fish object and handles fish animation
function createFish() {
  gPush();
  {
    setColor(vec4(0.5, 0.5, 0.5, 1.0));
    // Move the fish up to the correct starting point
    gTranslate(0, 2, 0);
    // Set up the rotation around the seaweed
    let rotation = (-TIME * 180) / Math.PI;
    gRotate(rotation, 0, 1, 0);
    // Setup up and down movement of fish
    let vDisplacement = 1.5 * Math.cos(TIME);
    gTranslate(0, vDisplacement, -4);
    // Rotate fish head so it is facing the correct direction
    gRotate(90, 0, 1, 0);
    // Draw fish head cone, eyes, body and tail
    drawCone();
    createFishEyes();
    createFishBody();
    createFishTail();
  }
  gPop();
}

// Helped function for CreateFish() that creates the fish eyes and pupils
function createFishEyes() {
  gPush();
  function drawEye() {
    gPush();
    {
      setColor(vec4(1, 1, 1, 1.0));
      gScale(0.2, 0.2, 0.2);
      drawSphere();
      gTranslate(0, 0, 0.75);
      setColor(vec4(0, 0, 0, 1.0));
      gScale(0.5, 0.5, 0.5);
      drawSphere();
    }
    gPop();
  }
  gTranslate(0.4, 0.5, 0.1);
  drawEye();
  gTranslate(-0.9, 0, 0);
  drawEye();
  gPop();
}

// Helper function for createFish() that generates the center body cone
function createFishBody() {
  gPush();
  {
    setColor(vec4(0.4, 0, 0, 1.0));
    gScale(1, 1, 3);
    gTranslate(0, 0, -0.66);
    gRotate(180, 0, 1, 0);
    drawCone();
  }
  gPop();
}

// Helper function for createFish() that generates the fish tail and tail animation
function createFishTail() {
  gPush();
  {
    // Upper tail segment
    setColor(vec4(0.4, 0, 0, 1.0));
    gTranslate(0, 0, -3);
    gPush();
    gRotate(50 * Math.sin(TIME * 2.5 * Math.PI), 0, 1, 0);
    gRotate(-120, 1, 0, 0);
    gScale(0.25, 0.25, 1.5);
    gTranslate(0, 1, 0.6);
    drawCone();
    gPop();
    // Lower Tail Segment
    gRotate(50 * Math.sin(TIME * 2.5 * Math.PI), 0, 1, 0);
    gRotate(120, 1, 0, 0);
    gScale(0.25, 0.25, 1);
    gTranslate(0, -1, 0.68);
    drawCone();
  }
  gPop();
}

// Creates the bottom box for the scene
function createGroundBox() {
  gPush();
  {
    gTranslate(3, -5, 0);
    gScale(7, 1, 1);
    setColor(vec4(0.075, 0.075, 0.075, 1.0));
    drawCube();
  }
  gPop();
}

// Creates the diver character and handles diver animation
function createDiver() {
  gPush();
  {
    setColor(vec4(0.5, 0.3, 0.6, 1.0));
    // Setup time based displacement
    let yDisplacement = 2 * Math.sin(TIME / 3);
    let xDisplacement = Math.sin(TIME / 2);
    gTranslate(7 + xDisplacement, 6 + yDisplacement, 0);
    gPush();
    {
      // Create body
      gRotate(-30, 0, 1, 0);
      gScale(1, 1.5, 0.4);
      drawCube();
      // Create legs
      gTranslate(-0.6, 0, 0);
      // Revert the previous scaling but keep translations/ rotations
      gScale(1 / 0.8, 1 / 1.3, 1 / 0.5);
      createLeg("left");
      gTranslate(1, 0, 0);
      createLeg("right");
    }
    gPop();
    // Create Head
    gScale(0.5, 0.5, 0.5);
    gTranslate(0, 4, 0);
    drawSphere();
  }
  gPop();
}

/**
 * Helper function for createDiver() that creates one of the legs for the diver
 * @param leg Determines if the function should generate the left or right leg
 */
function createLeg(leg) {
  // The legs must rotate in different directions so the rotation is based on which leg is being created
  const rotationFactor =
    leg == "left" ? 10 * Math.sin(TIME) : -10 * Math.sin(TIME);
  gPush();
  {
    // Upper leg creation
    gTranslate(0, -1, 0);
    gRotate(45 - rotationFactor, 1, 0, 0);
    gTranslate(0, -1.05, 0);
    gPush();
    {
      gScale(0.18, 0.75, 0.18);
      drawCube();
    }
    gPop();
    // Lower leg creation
    gTranslate(0, -0.9, 0);
    gRotate(30 - rotationFactor, 1, 0, 0);
    gTranslate(0, -0.6, 0);
    gPush();
    {
      gScale(0.18, 0.75, 0.18);
      drawCube();
    }
    gPop();
    // Foot Creation
    gTranslate(0, -0.75, 0.2);
    gScale(0.15, 0.15, 0.55);
    drawCube();
  }
  gPop();
}

// Creates the large rock and the small rock.
// After this function, the reference point will be located at the center of the large rock
function createRocks() {
  setColor(vec4(0.35, 0.35, 0.35, 1.0));
  gTranslate(3.5, -3.4, 0);
  gScale(0.6, 0.6, 0.6);
  drawSphere();
  // Push coords of big rock and shift over to create small rock
  gPush();
  {
    gTranslate(-1.5, -0.5, 0);
    gScale(0.5, 0.5, 0.5);
    drawSphere();
  }
  gPop();
}

function render() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  eye = vec3(0, 0, 10);
  MS = []; // Initialize modeling matrix stack

  // initialize the modeling matrix to identity
  modelMatrix = mat4();

  // set the camera matrix
  viewMatrix = lookAt(eye, at, up);

  // set the projection matrix
  projectionMatrix = ortho(left, right, bottom, ytop, near, far);

  // Rotations from the sliders
  gRotate(RZ, 0, 0, 1);
  gRotate(RY, 0, 1, 0);
  gRotate(RX, 1, 0, 0);

  // set all the matrices
  setAllMatrices();

  var curTime;
  if (animFlag) {
    curTime = new Date().getTime() / 1000;
    if (resetTimerFlag) {
      prevTime = curTime;
      resetTimerFlag = false;
    }
    TIME = TIME + curTime - prevTime;
    prevTime = curTime;
  }
  // Assignment code starts here
  gTranslate(-4, 0, 0);
  gPush();
  {
    createRocks();
    createSeaweedStrands();
    createFish();
    createDiver();
  }
  gPop();
  createGroundBox();
  // Assignment code ends here
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
