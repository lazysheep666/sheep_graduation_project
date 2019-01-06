import '../css/index.styl'
import Load from './Load'
import {vsSource} from './VertexShader'
import {fsSource} from './FragmentShader'

const body = document.querySelector('#body')
body.onload = () => {
  const canvas = document.querySelector('#glcanvas')
  const gl = canvas.getContext('webgl')
  if (!gl) {
    alert('Unable to initialize WebGL. Your browser or machine may not support it.')
    return
  }

  // Set clear color to black, fully opaque
  gl.clearColor(0.0, 0.0, 0.0, 1.0)
  // Clear the color buffer with specified clear color
  gl.clear(gl.COLOR_BUFFER_BIT)

  const shaderProgram = Load.initShaderProgram(gl, vsSource, fsSource)

  gl.useProgram(shaderProgram)

  // 信息
  const programInfo = {
    program: shaderProgram,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram, 'a_position')
    }
  }

  let positionBuffer = gl.createBuffer()
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)

  // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)

  let positions = [
    0, 0,
    0, 1,
    1, 0
  ]
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW)
  // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
  let size = 2 // 2 components per iteration
  let type = gl.FLOAT // the data is 32bit floats
  let normalize = false // don't normalize the data
  let stride = 0 // 0 = move forward size * sizeof(type) each iteration to get the next position
  let offset = 0 // start at the beginning of the buffer
  gl.vertexAttribPointer(
    programInfo.attribLocations.vertexPosition,
    size, type, normalize, stride, offset
  )
  gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition)
  var primitiveType = gl.TRIANGLES
  var count = 3
  gl.drawArrays(primitiveType, offset, count)
}
