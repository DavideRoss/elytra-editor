App.directive 'three', () ->
    element =
        restrict: 'E'
        replace: true
        template: '<div id="three-render"></div>'
        scope:
            model: '='
            lockControls: '='
            errors: '='

        link: ($scope, e) ->

            scene = null
            light = null
            helper = null
            camera = null
            controls = null

            textureLoader = null
            textures = {}

            modelObjects = []

            e.ready () ->
                renderer = new THREE.WebGLRenderer
                    antialias: false

                # scene = new THREE.Scene()

                textureLoader = new THREE.TextureLoader()
                scene = new THREE.Scene()

                # ===== Light =====================================================================

                light = new THREE.AmbientLight 0xffffff
                helper = new THREE.GridHelper 32, 32, 0x0000ff, 0xaaaaaa

                # ===== Camera ====================================================================

                camera = new THREE.PerspectiveCamera 60, e[0].clientWidth / e[0].clientHeight, .1, 1000

                camera.position.set(0, 15, 30)

                camera.lookAt new THREE.Vector3 8, 8, 8
                controls = new THREE.OrbitControls camera
                controls.target = new THREE.Vector3 8, 8, 8

                controls.minDistance = 10
                controls.maxDistance = 1000
                controls.zoomSpeed = .5

                # controls.enabled = false

                e[0].addEventListener 'wheel', () ->
                    controls.update()

                # ===== Init ======================================================================

                renderer.setClearColor 0xffffff
                renderer.setSize e[0].clientWidth, e[0].clientHeight

                $scope.loaded = true

                e[0].appendChild renderer.domElement

                radius = 300

                animate = () ->
                    requestAnimationFrame animate
                    renderer.render scene, camera if scene

                animate()

            $scope.$watch 'lockControls', () ->
                controls.enabled = $scope.lockControls if controls
            , true

            $scope.$watch 'model', () ->
                return if !$scope.model || !$scope.loaded
                $scope.errors = []

                scene = new THREE.Scene()
                scene.add light
                scene.add helper
                scene.add camera

                async.eachOf $scope.model.textures, (v, k, cb) ->
                    if k == 'particle'
                        $scope.errors.push 'Particle found in textures: not yet supported (found "' + v + '")'

                    textures[k] = new Image()
                    textures[k].onload = () ->
                        cb()

                    textures[k].onerror = () ->
                        $scope.$apply () ->
                            $scope.errors.push 'Cannot load texture "' + v + '", loading default texture instead'
                            textures[k].src = 'images/blocks/missing_texture.png'

                    textures[k].src = 'images/' + v + '.png'
                , () ->
                    $scope.renderModel()

            $scope.renderModel = () ->
                facesNames = ['west', 'east', 'up', 'down', 'south', 'north']

                $scope.model.elements.forEach (e) ->
                    size = [
                        e.to[0] - e.from[0],
                        e.to[1] - e.from[1],
                        e.to[2] - e.from[2]
                    ]

                    materials = _.map facesNames, (k) ->
                        face = e.faces[k]

                        if !face
                            if k == 'west'
                                face = e.faces['east']
                            else if k == 'east'
                                face = e.faces['west']
                            else if k == 'up'
                                face = e.faces['down']
                            else if k == 'down'
                                face = e.faces['up']
                            else if k == 'south'
                                face = e.faces['north']
                            else if k == 'north'
                                face = e.faces['south']

                        canvas = document.createElement 'canvas'
                        canvasSize = 64
                        canvas.width = canvas.height = canvasSize

                        ctx = canvas.getContext '2d'
                        ctx.imageSmoothingEnabled = false

                        rotationOffset = [0, 0]

                        if face
                            if face.rotation
                                ctx.translate canvasSize / 2, canvasSize / 2
                                ctx.rotate face.rotation * Math.PI / 180
                                rotationOffset = [canvasSize / 2, canvasSize / 2]

                            ctx.drawImage(
                                textures[face.texture.replace('#', '')],
                                face.uv[0], face.uv[1], face.uv[2] - face.uv[0], face.uv[3] - face.uv[1],
                                -rotationOffset[0], -rotationOffset[1], canvasSize, canvasSize
                            )

                        tex = new THREE.Texture canvas
                        tex.needsUpdate = true
                        tex.magFilter = THREE.NearestFilter
                        tex.minFilter = THREE.NearestFilter

                        material = new THREE.MeshPhongMaterial
                            map: tex

                    faceMaterial = new THREE.MultiMaterial materials

                    pivot = new THREE.Object3D
                    box = new THREE.BoxGeometry size[0], size[1], size[2]
                    boxMesh = new THREE.Mesh box, faceMaterial
                    boxMesh.position.set (size[0] / 2) + e.from[0], (size[1] / 2) + e.from[1], (size[2] / 2) + e.from[2]

                    if e.rotation
                        if e.rotation.axis == 'x'
                            pivot.position.y += e.rotation.origin[1]
                            pivot.position.z += e.rotation.origin[2]

                            boxMesh.position.y -= e.rotation.origin[1]
                            boxMesh.position.z -= e.rotation.origin[2]

                            pivot.rotation.x = toRadians e.rotation.angle

                        if e.rotation.axis == 'y'
                            pivot.position.x += e.rotation.origin[0]
                            pivot.position.z += e.rotation.origin[2]

                            boxMesh.position.x -= e.rotation.origin[0]
                            boxMesh.position.z -= e.rotation.origin[2]

                            pivot.rotation.y = toRadians e.rotation.angle

                        if e.rotation.axis == 'z'
                            pivot.position.x += e.rotation.origin[0]
                            pivot.position.y += e.rotation.origin[1]

                            boxMesh.position.x -= e.rotation.origin[0]
                            boxMesh.position.y -= e.rotation.origin[1]

                            pivot.rotation.z = toRadians e.rotation.angle


                    pivot.add boxMesh
                    scene.add pivot

                    modelObjects.push pivot

    return element

toRadians = (angle) ->
    return angle * (Math.PI / 180)
