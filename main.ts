window.onload = () => {
  const canvas = document.querySelector("#glCanvas");

  if (!(canvas instanceof HTMLCanvasElement)) {
    throw new Error("canvas not found");
  }

  const gl = canvas.getContext("webgl");

  if (!gl) {
    throw new Error("fail to init WebGL");
  }

  const vsSource = `
    attribute vec3 position;
    attribute vec4 color;
    uniform mat4 mvpMatrix;
    varying vec4 vColor;
    
    void main(void){
        vColor = color;
        gl_Position = mvpMatrix * vec4(position, 1.0);
    }
    `;

  const fsSource = `
    precision mediump float;

    varying vec4 vColor;

    void main(void){
        gl_FragColor = vColor;
    }
    `;

  const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

  if (!shaderProgram) {
    throw new Error("fail to init shaderProgram");
  }

  const programInfo = {
    program: shaderProgram,
    attribLocations: {
      position: gl.getAttribLocation(shaderProgram, "position"),
      color: gl.getAttribLocation(shaderProgram, "color"),
    },
    uniformLocations: {
      mvpMatrix: gl.getUniformLocation(shaderProgram, "mvpMatrix"),
    },
  };

  const buffers = {
    // prettier-ignore
    position: initBuffer(gl, [
      0.0, 1.0,
      1.0, 0.0,
      -1.0, 0.0
    ]),
    // prettier-ignore
    color: initBuffer(gl, [
      1.0, 0.0, 0.0,
      1.0, 0.0, 1.0,
      0.0, 1.0, 0.0,
      0.0, 1.0, 1.0
    ]),
  };

  drawScene(gl, programInfo, buffers);
};

function initShaderProgram(
  gl: WebGLRenderingContext,
  vsSource: string,
  fsSource: string
): WebGLProgram | null {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

  if (!vertexShader || !fragmentShader) {
    return null;
  }

  const shaderProgram = gl.createProgram();

  if (!shaderProgram) {
    return null;
  }

  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    console.log(
      "Unable to initialize the shader program: ",
      gl.getProgramInfoLog(shaderProgram)
    );
    return null;
  }

  gl.useProgram(shaderProgram);

  return shaderProgram;
}

function loadShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string
): WebGLShader | null {
  const shader = gl.createShader(type);

  if (!shader) {
    console.log("An error occurred creating the shaders: ", type);
    return null;
  }

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.log(
      "An error occurred compiling the shaders: ",
      gl.getShaderInfoLog(shader)
    );
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

function initBuffer(
  gl: WebGLRenderingContext,
  buffer: number[]
): WebGLBuffer | null {
  const glBuffer = gl.createBuffer();

  gl.bindBuffer(gl.ARRAY_BUFFER, glBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(buffer), gl.STATIC_DRAW);

  return glBuffer;
}

function drawScene(
  gl: WebGLRenderingContext,
  programInfo: {
    program: WebGLProgram;
    attribLocations: any;
    uniformLocations: any;
  },
  buffers: { position: WebGLBuffer | null; color: WebGLBuffer | null }
) {
  set_attribute(gl, buffers.position, programInfo.attribLocations.position, 2);
  set_attribute(gl, buffers.color, programInfo.attribLocations.color, 4);

  const mMatrix = Mat4.identity(Mat4.create());
  const vMatrix = Mat4.identity(Mat4.create());
  const pMatrix = Mat4.identity(Mat4.create());
  const vpMatrix = Mat4.identity(Mat4.create());
  const mvpMatrix = Mat4.identity(Mat4.create());

  Mat4.lookAt([0.0, 0.0, 5.0], [0, 0, 0], [0, 1, 0], vMatrix);
  Mat4.perspective(45, gl.canvas.width / gl.canvas.height, 0.1, 100, pMatrix);
  Mat4.multiply(pMatrix, vMatrix, vpMatrix);

  function render(timestamp: number) {
    const t = timestamp / 1000.0;

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    Mat4.identity(mMatrix);
    Mat4.translate(mMatrix, [Math.cos(t), Math.sin(t) + 1.0, 0.0], mMatrix);
    Mat4.multiply(vpMatrix, mMatrix, mvpMatrix);
    gl.uniformMatrix4fv(
      programInfo.uniformLocations.mvpMatrix,
      false,
      mvpMatrix
    );
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 3);

    Mat4.identity(mMatrix);
    Mat4.translate(mMatrix, [1.0, -1.0, 0.0], mMatrix);
    Mat4.rotate(mMatrix, t, [0.0, 1.0, 0.0], mMatrix);
    Mat4.multiply(vpMatrix, mMatrix, mvpMatrix);
    gl.uniformMatrix4fv(
      programInfo.uniformLocations.mvpMatrix,
      false,
      mvpMatrix
    );
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 3);

    Mat4.identity(mMatrix);
    Mat4.translate(mMatrix, [-1.0, -1.0, 0.0], mMatrix);
    Mat4.scale(mMatrix, [Math.sin(t), Math.sin(t), 0.0], mMatrix);
    Mat4.multiply(vpMatrix, mMatrix, mvpMatrix);
    gl.uniformMatrix4fv(
      programInfo.uniformLocations.mvpMatrix,
      false,
      mvpMatrix
    );
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 3);

    gl.flush();

    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
}

function set_attribute(
  gl: WebGLRenderingContext,
  buffer: WebGLBuffer | null,
  index: number,
  size: number
) {
  const type = gl.FLOAT;
  const normalize = false;
  const stride = 0;
  const offset = 0;
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.vertexAttribPointer(index, size, type, normalize, stride, offset);
  gl.enableVertexAttribArray(index);
}
