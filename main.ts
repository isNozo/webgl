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
    attribute vec2 textureCoord;
    uniform   mat4 mvpMatrix;
    varying   vec4 vColor;
    varying   vec2 vTextureCoord;
    
    void main(void){
        vColor        = color;
        vTextureCoord = textureCoord;
        gl_Position   = mvpMatrix * vec4(position, 1.0);
    }
    `;

  const fsSource = `
    precision mediump float;

    uniform sampler2D texture;
    varying vec4      vColor;
    varying vec2      vTextureCoord;
    
    void main(void){
        vec4 smpColor = texture2D(texture, vTextureCoord);
        gl_FragColor  = vColor * smpColor;
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
      texture: gl.getAttribLocation(shaderProgram, "textureCoord"),
    },
    uniformLocations: {
      mvpMatrix: gl.getUniformLocation(shaderProgram, "mvpMatrix"),
      texture: gl.getUniformLocation(shaderProgram, "texture"),
    },
  };

  const colors = [
    [1.0, 1.0, 1.0, 1.0], // 前面: 白
    [1.0, 0.0, 0.0, 1.0], // 背面: 赤
    [0.0, 1.0, 0.0, 1.0], // 上面: 緑
    [0.0, 0.0, 1.0, 1.0], // 底面: 青
    [1.0, 1.0, 0.0, 1.0], // 右側面: 黄
    [1.0, 0.0, 1.0, 1.0], // 左側面: 紫
  ];

  let generatedColors: number[] = [];

  for (let i = 0; i < 6; i++) {
    let c = colors[i];
    for (let j = 0; j < 4; j++) {
      generatedColors = generatedColors.concat(c);
    }
  }

  // prettier-ignore
  const idxbuff = [
    0,  1,  2,      0,  2,  3,    // 前面
    4,  5,  6,      4,  6,  7,    // 背面
    8,  9,  10,     8,  10, 11,   // 上面
    12, 13, 14,     12, 14, 15,   // 底面
    16, 17, 18,     16, 18, 19,   // 右側面
    20, 21, 22,     20, 22, 23    // 左側面
  ]

  // prettier-ignore
  const vbuff = [
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
  const texbuff = [
    // 前面
    0.0,  0.0,
    1.0,  0.0,
    1.0,  1.0,
    0.0,  1.0,
    // 背面
    0.0,  0.0,
    1.0,  0.0,
    1.0,  1.0,
    0.0,  1.0,
    // 上面
    0.0,  0.0,
    1.0,  0.0,
    1.0,  1.0,
    0.0,  1.0,
    // 底面
    0.0,  0.0,
    1.0,  0.0,
    1.0,  1.0,
    0.0,  1.0,
    // 右側面
    0.0,  0.0,
    1.0,  0.0,
    1.0,  1.0,
    0.0,  1.0,
    // 左側面
    0.0,  0.0,
    1.0,  0.0,
    1.0,  1.0,
    0.0,  1.0
  ];

  const buffers = {
    position: initBuffer(gl, gl.ARRAY_BUFFER, new Float32Array(vbuff)),
    color: initBuffer(gl, gl.ARRAY_BUFFER, new Float32Array(generatedColors)),
    index: initBuffer(gl, gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(idxbuff)),
    index_len: idxbuff.length,
    texture: initBuffer(gl, gl.ARRAY_BUFFER, new Float32Array(texbuff)),
  };

  const texture = loadTexture(
    gl,
    "https://c1.staticflickr.com/9/8873/18598400202_3af67ef38f_q.jpg"
  );

  drawScene(gl, programInfo, buffers, texture);
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

function loadTexture(
  gl: WebGLRenderingContext,
  url: string
): WebGLTexture | null {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    1,
    1,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    new Uint8Array([0, 0, 255, 255])
  );

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

  const image = new Image();
  image.onload = function () {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  };
  image.crossOrigin = "";
  image.src = url;

  return texture;
}

function drawScene(
  gl: WebGLRenderingContext,
  programInfo: {
    program: WebGLProgram;
    attribLocations: any;
    uniformLocations: any;
  },
  buffers: {
    position: WebGLBuffer | null;
    color: WebGLBuffer | null;
    index: WebGLBuffer | null;
    index_len: number;
    texture: WebGLBuffer | null;
  },
  texture: WebGLTexture | null
) {
  set_attribute(gl, buffers.position, programInfo.attribLocations.position, 3);
  set_attribute(gl, buffers.color, programInfo.attribLocations.color, 4);
  set_attribute(gl, buffers.texture, programInfo.attribLocations.texture, 2);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.index);

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

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(programInfo.uniformLocations.texture, 0);

    Mat4.identity(mMatrix);
    Mat4.rotate(mMatrix, t, [0.0, 1.0, 0.0], mMatrix);
    Mat4.rotate(mMatrix, t, [1.0, 1.0, 0.0], mMatrix);
    Mat4.multiply(vpMatrix, mMatrix, mvpMatrix);
    gl.uniformMatrix4fv(
      programInfo.uniformLocations.mvpMatrix,
      false,
      mvpMatrix
    );

    gl.drawElements(gl.TRIANGLES, buffers.index_len, gl.UNSIGNED_SHORT, 0);

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
