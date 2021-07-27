window.onload = () => {
  const canvas = document.querySelector("#glCanvas");

  if (!(canvas instanceof HTMLCanvasElement)) {
    throw new Error("canvas not found");
  }

  const gl = canvas.getContext("webgl2");

  if (!gl) {
    throw new Error("fail to init WebGL");
  }

  const vsSource = `#version 300 es
    in vec3 position;
    in vec4 color;
    
    uniform mat4 mvpMatrix;
    
    out vec4 vColor;
    
    void main(void){
        vColor = color;
        gl_Position = mvpMatrix * vec4(position, 1.0);
    }
    `;

  const fsSource = `#version 300 es
    precision highp float;

    in vec4 vColor;

    out vec4 outColor;
    
    void main(void){
        outColor = vColor;
    }
    `;

  const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

  if (!shaderProgram) {
    throw new Error("fail to init shaderProgram");
  }

  // prettier-ignore
  const pos = [
    // 前面
    -1.0, -1.0,  1.0,
     1.0, -1.0,  1.0,
     1.0,  1.0,  1.0,
    -1.0,  1.0,  1.0,
    // 背面
    -1.0, -1.0, -1.0,
    -1.0,  1.0, -1.0,
     1.0,  1.0, -1.0,
     1.0, -1.0, -1.0,
    // 上面
    -1.0,  1.0, -1.0,
    -1.0,  1.0,  1.0,
     1.0,  1.0,  1.0,
     1.0,  1.0, -1.0,
    // 底面
    -1.0, -1.0, -1.0,
     1.0, -1.0, -1.0,
     1.0, -1.0,  1.0,
    -1.0, -1.0,  1.0,
    // 右側面
     1.0, -1.0, -1.0,
     1.0,  1.0, -1.0,
     1.0,  1.0,  1.0,
     1.0, -1.0,  1.0,
    // 左側面
    -1.0, -1.0, -1.0,
    -1.0, -1.0,  1.0,
    -1.0,  1.0,  1.0,
    -1.0,  1.0, -1.0
  ];

  // prettier-ignore
  const col = [
    1.0, 1.0, 1.0, 1.0, // 前面: 白
    1.0, 1.0, 1.0, 1.0,
    1.0, 1.0, 1.0, 1.0,
    1.0, 1.0, 1.0, 1.0,
    1.0, 0.0, 0.0, 1.0, // 背面: 赤
    1.0, 0.0, 0.0, 1.0,
    1.0, 0.0, 0.0, 1.0,
    1.0, 0.0, 0.0, 1.0,
    0.0, 1.0, 0.0, 1.0, // 上面: 緑
    0.0, 1.0, 0.0, 1.0,
    0.0, 1.0, 0.0, 1.0,
    0.0, 1.0, 0.0, 1.0,
    0.0, 0.0, 1.0, 1.0, // 底面: 青
    0.0, 0.0, 1.0, 1.0,
    0.0, 0.0, 1.0, 1.0,
    0.0, 0.0, 1.0, 1.0,
    1.0, 1.0, 0.0, 1.0, // 右側面: 黄
    1.0, 1.0, 0.0, 1.0,
    1.0, 1.0, 0.0, 1.0,
    1.0, 1.0, 0.0, 1.0,
    1.0, 0.0, 1.0, 1.0, // 左側面: 紫
    1.0, 0.0, 1.0, 1.0,
    1.0, 0.0, 1.0, 1.0,
    1.0, 0.0, 1.0, 1.0,
  ];

  // prettier-ignore
  const idx = [
    0,  1,  2,      0,  2,  3,    // 前面
    4,  5,  6,      4,  6,  7,    // 背面
    8,  9,  10,     8,  10, 11,   // 上面
    12, 13, 14,     12, 14, 15,   // 底面
    16, 17, 18,     16, 18, 19,   // 右側面
    20, 21, 22,     20, 22, 23    // 左側面
  ]

  const attrs = [
    {
      buffer: initBuffer(gl, gl.ARRAY_BUFFER, new Float32Array(pos)),
      index: gl.getAttribLocation(shaderProgram, "position"),
      size: 3,
    },
    {
      buffer: initBuffer(gl, gl.ARRAY_BUFFER, new Float32Array(col)),
      index: gl.getAttribLocation(shaderProgram, "color"),
      size: 4,
    },
  ];
  attrs.map((attr) => {
    set_attribute(gl, attr);
  });

  const uniformLocations = {
    mvpMatrix: gl.getUniformLocation(shaderProgram, "mvpMatrix"),
  };

  const idxbuf = initBuffer(gl, gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(idx));
  const idxlen = idx.length;
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxbuf);

  drawScene(gl, uniformLocations, idxlen);
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
  target: number,
  buffer: BufferSource
): WebGLBuffer | null {
  const glBuffer = gl.createBuffer();

  gl.bindBuffer(target, glBuffer);
  gl.bufferData(target, buffer, gl.STATIC_DRAW);

  return glBuffer;
}

function set_attribute(
  gl: WebGLRenderingContext,
  attr: {
    buffer: WebGLBuffer | null;
    index: number;
    size: number;
  }
) {
  gl.bindBuffer(gl.ARRAY_BUFFER, attr.buffer);
  gl.vertexAttribPointer(attr.index, attr.size, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(attr.index);
}

function drawScene(
  gl: WebGLRenderingContext,
  uniformLocations: {
    mvpMatrix: WebGLUniformLocation | null;
  },
  idxlen: number
) {
  const mMatrix = Mat4.identity(Mat4.create());
  const vMatrix = Mat4.identity(Mat4.create());
  const pMatrix = Mat4.identity(Mat4.create());
  const vpMatrix = Mat4.identity(Mat4.create());
  const mvpMatrix = Mat4.identity(Mat4.create());

  Mat4.lookAt([0.0, 1.0, 5.0], [0, 0, 0], [0, 1, 0], vMatrix);
  Mat4.perspective(45, gl.canvas.width / gl.canvas.height, 0.1, 100, pMatrix);
  Mat4.multiply(pMatrix, vMatrix, vpMatrix);

  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  gl.activeTexture(gl.TEXTURE0);

  function render(timestamp: number) {
    const t = timestamp / 1000.0;

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clearDepth(1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    Mat4.identity(mMatrix);
    Mat4.rotate(mMatrix, t, [0.0, 1.0, 0.0], mMatrix);
    Mat4.rotate(mMatrix, t, [1.0, 1.0, 0.0], mMatrix);
    Mat4.multiply(vpMatrix, mMatrix, mvpMatrix);
    gl.uniformMatrix4fv(uniformLocations.mvpMatrix, false, mvpMatrix);

    gl.drawElements(gl.TRIANGLES, idxlen, gl.UNSIGNED_SHORT, 0);

    gl.flush();

    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
}
