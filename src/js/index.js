import * as THREE from 'three'
import * as dat from 'dat.gui'
import MTLLoader from './lib/MTLLoader.js'
import OBJLoader from './lib/OBJLoader.js'
import OrbitControls from './lib/OrbitControls'

MTLLoader.initMTLLoader()
OBJLoader.initOBJLoader()
OrbitControls.initOrbitControls()

class App {
  constructor() {
    this.scene = null
    this.camera = null
    this.renderer = null
    this.keyLight = null
    this.controls = null
    this.apple = new Apple()
    this.shaderConfig = null
  }

  init() {
    const Canvas = document.querySelector('#canvas')
    Canvas.width = window.innerWidth
    Canvas.height = window.innerHeight
    this.renderer = new THREE.WebGLRenderer({
      canvas: Canvas,
      antialias: true
    })
    this.renderer.setClearColor(0xf3f3f3)
    this.scene = new THREE.Scene()

    this.camera = new THREE.PerspectiveCamera(75, Canvas.width / Canvas.height, 10, 1000)
    this.camera.position.set(130, 35, -35)

    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement)

    this.keyLight = new THREE.SpotLight(0xffffff, 1, 60000, Math.PI / 2, 25)
    this.keyLight.position.set(1000, 1000, 500)
    this.keyLight.target.position.set(100, 0, 0)
    this.scene.add(this.keyLight)

    this.apple.init().then(() => {
      console.log(this.apple)
      this.scene.add(this.apple.groupMesh)
    })

    let _this = this
    // get config
    $.get('../../shader.config.json', function(data) {
      _this.shaderConfig = data
      _this.initControl()
    })

    // draw
    this.animate()
  }
  initControl() {
    let _this = this
    const gui = new dat.GUI()

    var shaderNames = ['none']
    for (var shader in _this.shaderConfig) {
      shaderNames.push(shader)
    }

    var option = {
      'Shader': 'none',
      'Light X': _this.keyLight.position.x,
      'Light Y': _this.keyLight.position.y,
      'Light Z': _this.keyLight.position.z
    }
    // shader
    gui.add(option, 'Shader', shaderNames)
      .onChange(function(value) {
        _this.applyShader(value)
      })

    // light
    var lightFolder = gui.addFolder('Light')
    lightFolder.add(option, 'Light X')
      .min(-2000).max(2000)
      .onChange(function(value) {
        _this.keyLight.position.x = value
      })
    lightFolder.add(option, 'Light Y')
      .min(-2000).max(2000)
      .onChange(function(value) {
        _this.keyLight.position.y = value
      })
    lightFolder.add(option, 'Light Z')
      .min(-2000).max(2000)
      .onChange(function(value) {
        _this.keyLight.position.z = value
      })
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this))
    this.draw()
  }

  draw() {
    console.log('draw')
    this.renderer.render(this.scene, this.camera)
  }

  applyShader(shaderName) {
    if (shaderName === 'none') {
      this.apple.appleMesh.material = this.apple.appleMat
      this.apple.stemMesh.material = this.apple.stemMat
      return
    }

    let _this = this
    // wait until the config be loaded
    if (this.shaderConfig === null) {
      setTimeout(function() {
        _this.applyShader(shaderName)
      }, 1000)
      return
    }

    let lightUniform = {
      type: 'v3',
      value: this.keyLight.position
    }

    setShader('apple', this.apple.appleMesh, {
      uniforms: {
        color: {
          type: 'v3',
          value: new THREE.Color('#f55c1f')
        },
        light: lightUniform
      }
    })

    setShader('stem', this.apple.stemMesh, {
      uniforms: {
        color: {
          type: 'v3',
          value: new THREE.Color('#60371b')
        },
        light: lightUniform
      }
    })

    function setShader(meshName, mesh, qualifiers) {
      let config = _this.shaderConfig[shaderName] && _this.shaderConfig[shaderName][meshName]
      // load
      // if (!config) {
      //   alert('no such shader')
      //   return
      // }
      $.get(`../../shader/${config.path}.vs`, (vs) => {
        $.get(`../../shader/${config.path}.fs`, (fs) => {
          let material = new THREE.ShaderMaterial({
            vertexShader: vs,
            fragmentShader: fs,
            uniforms: qualifiers.uniforms
          })
          mesh.material = material
        })
      })
    }
  }
}

class Apple {
  constructor() {
    this.appleMesh = null
    this.stemMesh = null
    this.groupMesh = null
    this.appleMat = null
    this.stemMat = null
  }
  init() {
    let _this = this
    return new Promise((resolve) => {
      let mtlLoader = new THREE.MTLLoader()
      mtlLoader.setPath('../../model/')

      // load the 3D model
      mtlLoader.load('apple.mtl', function(materials) {
        materials.preload()

        // model loader
        var objLoader = new THREE.OBJLoader()
        objLoader.setMaterials(materials)
        objLoader.setPath('./../model/')
        objLoader.load('apple.obj', function(obj) {
          obj.traverse(function(child) {
            if (child instanceof THREE.Mesh) {
              if (!_this.appleMesh) {
                _this.appleMesh = child
                _this.appleMat = _this.appleMesh.material
              } else {
                _this.stemMesh = child
                _this.stemMat = _this.stemMesh.material
              }
            }
          })
          _this.groupMesh = obj
          _this.groupMesh.position.set(-50, -50, 0)
          resolve()
        })
      })
    })
  }
}

window.onload = () => {
  const app = new App()
  app.init()
}
