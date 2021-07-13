window.onload = function () {
    const canvas = document.querySelector("#glCanvas");
    const gl = canvas.getContext("webgl");

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

    const programInfo = {
        program: shaderProgram,
        attribLocations: {
            position:
                gl.getAttribLocation(shaderProgram, 'position'),
            color:
                gl.getAttribLocation(shaderProgram, 'color'),
        },
        uniformLocations: {
            mvpMatrix:
                gl.getUniformLocation(shaderProgram, 'mvpMatrix'),
        },
    };

    const buffers = initBuffers(gl);

    drawScene(gl, programInfo, buffers);
}

function initShaderProgram(gl, vsSource, fsSource) {
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        console.log(
            'Unable to initialize the shader program: '
            + gl.getProgramInfoLog(shaderProgram)
        );
        return null;
    }

    return shaderProgram;
}

function loadShader(gl, type, source) {
    const shader = gl.createShader(type);

    gl.shaderSource(shader, source);

    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.log(
            'An error occurred compiling the shaders: '
            + gl.getShaderInfoLog(shader)
        );
        gl.deleteShader(shader);
        return null;
    }

    return shader;
}

function initBuffers(gl) {
    const positionBuffer = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    const positions = [
        0.0, 1.0,
        1.0, 0.0,
        -1.0, 0.0,
    ];

    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(positions),
        gl.STATIC_DRAW
    );

    const colorBuffer = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);

    const colors = [
        1.0, 0.0, 0.0, 1.0,
        0.0, 1.0, 0.0, 1.0,
        0.0, 0.0, 1.0, 1.0,
    ];

    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(colors),
        gl.STATIC_DRAW
    );

    return {
        position: positionBuffer,
        color: colorBuffer,
    };
}

function drawScene(gl, programInfo, buffers) {
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const m = new matIV();
    const mMatrix = m.identity(m.create());
    const vMatrix = m.identity(m.create());
    const pMatrix = m.identity(m.create());
    const mvpMatrix = m.identity(m.create());

    m.lookAt([0.0, 1.0, 3.0], [0, 0, 0], [0, 1, 0], vMatrix);
    m.perspective(
        90,
        gl.canvas.clientWidth / gl.canvas.clientHeight,
        0.1,
        100,
        pMatrix
    );

    m.multiply(pMatrix, vMatrix, mvpMatrix);
    m.multiply(mvpMatrix, mMatrix, mvpMatrix);

    {
        const numComponents = 2;
        const type = gl.FLOAT;
        const normalize = false;
        const stride = 0;
        const offset = 0;
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
        gl.vertexAttribPointer(
            programInfo.attribLocations.position,
            numComponents,
            type,
            normalize,
            stride,
            offset
        );
        gl.enableVertexAttribArray(
            programInfo.attribLocations.position
        );
    }

    {
        const numComponents = 4;
        const type = gl.FLOAT;
        const normalize = false;
        const stride = 0;
        const offset = 0;
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
        gl.vertexAttribPointer(
            programInfo.attribLocations.color,
            numComponents,
            type,
            normalize,
            stride,
            offset
        );
        gl.enableVertexAttribArray(
            programInfo.attribLocations.color
        );
    }

    gl.useProgram(programInfo.program);

    gl.uniformMatrix4fv(
        programInfo.uniformLocations.mvpMatrix,
        false,
        mvpMatrix
    );

    {
        const offset = 0;
        const vertexCount = 4;
        gl.drawArrays(gl.TRIANGLE_STRIP, offset, vertexCount);
    }

    gl.flush();
}