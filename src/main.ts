window.onload = () => {
  const canvas = document.querySelector("#glCanvas");
  if (!(canvas instanceof HTMLCanvasElement)) {
    throw new Error("canvas not found");
  }

  const gl = canvas.getContext("webgl2");
  if (!gl) {
    throw new Error("fail to init WebGL");
  }

  const updatePosVS = `#version 300 es
    void main(void){
    }
    `;

  const updatePosFS = `#version 300 es
    precision highp float;
    void main(void){
    }
    `;

  const drawVS = `#version 300 es
    void main(void){
      gl_Position = vec4(0,0,0,1);
      gl_PointSize = 10.0;
    }
    `;

  const drawFS = `#version 300 es
    precision highp float;
    out vec4 outColor;
    void main(void){
      outColor = vec4(1,0,0,1);
    }
    `;

  const updatePosPrg = initShaderProgram(gl, updatePosVS, updatePosFS, []);
  const drawPrg = initShaderProgram(gl, drawVS, drawFS, []);
  if (!updatePosPrg || !drawPrg) {
    throw new Error("fail to init shaderProgram");
  }

  function draw(gl: WebGL2RenderingContext) {
    function render(t: number) {
      // update position
      gl.useProgram(updatePosPrg);
      gl.enable(gl.RASTERIZER_DISCARD);
      gl.drawArrays(gl.POINTS, 0, 1);
      gl.disable(gl.RASTERIZER_DISCARD);

      // draw
      gl.useProgram(drawPrg);
      gl.drawArrays(gl.POINTS, 0, 1);

      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
  }
  draw(gl);

  function initShaderProgram(
    gl: WebGL2RenderingContext,
    vsSource: string,
    fsSource: string,
    varyings: string[]
  ): WebGLProgram {
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

    const shaderProgram = gl.createProgram();
    if (!shaderProgram) {
      throw new Error("creating program");
    }

    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);

    if (varyings)
      gl.transformFeedbackVaryings(
        shaderProgram,
        varyings,
        gl.SEPARATE_ATTRIBS
      );

    gl.linkProgram(shaderProgram);
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
      throw new Error(`initing shader: ${gl.getProgramInfoLog(shaderProgram)}`);
    }

    return shaderProgram;
  }

  function loadShader(
    gl: WebGL2RenderingContext,
    type: number,
    source: string
  ): WebGLShader {
    const shader = gl.createShader(type);
    if (!shader) {
      throw new Error(`creating shader: ${type}`);
    }

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      throw new Error(`compiling shader: ${gl.getShaderInfoLog(shader)}`);
    }

    return shader;
  }

  function makeBuffer(
    gl: WebGL2RenderingContext,
    sizeOrData: any
  ): WebGLBuffer | null {
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, sizeOrData, gl.STATIC_DRAW);
    return buf;
  }

  function create_vao(
    gl: WebGL2RenderingContext,
    attrs: {
      buffer: number[];
      index: number;
      size: number;
    }[],
    index_buffer: number[]
  ): WebGLVertexArrayObject | null {
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    attrs.map((attr) => {
      const vbo = makeBuffer(gl, new Float32Array(attr.buffer));
      gl.enableVertexAttribArray(attr.index);
      gl.vertexAttribPointer(attr.index, attr.size, gl.FLOAT, false, 0, 0);
    });

    if (index_buffer) {
      const ibo = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
      gl.bufferData(
        gl.ELEMENT_ARRAY_BUFFER,
        new Uint16Array(index_buffer),
        gl.STATIC_DRAW
      );
    }

    gl.bindVertexArray(null);
    return vao;
  }
};
