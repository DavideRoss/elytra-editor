(function() {
  var App, toRadians;

  App = angular.module('App', ['ngRoute', 'ngResource']);

  App.run([
    '$rootScope', '$http', function($rootScope, $http) {
      var httpPromise;
      httpPromise = $http.get('jsons/bookshelf_rel.json');
      return httpPromise.then(function(res) {
        return setTimeout(function() {
          $rootScope.model = res.data;
          return $rootScope.$apply();
        }, 100);
      });
    }
  ]);

  App.directive('three', function() {
    var element;
    element = {
      restrict: 'E',
      replace: true,
      template: '<div id="three-render"></div>',
      scope: {
        model: '='
      },
      link: function($scope, e) {
        var scene, textureLoader, textures;
        scene = null;
        textureLoader = null;
        textures = {};
        e.ready(function() {
          var animate, camera, controls, helper, light, radius, renderer;
          renderer = new THREE.WebGLRenderer({
            antialias: true
          });
          scene = new THREE.Scene();
          textureLoader = new THREE.TextureLoader();
          light = new THREE.AmbientLight(0xffffff);
          scene.add(light);
          helper = new THREE.GridHelper(32, 32, 0x0000ff, 0xaaaaaa);
          scene.add(helper);
          scene.add(new THREE.AxisHelper(20));
          camera = new THREE.PerspectiveCamera(70, e[0].clientWidth / e[0].clientHeight, .1, 10000);
          scene.add(camera);
          camera.position.z = 30;
          camera.position.y = 15;
          camera.lookAt(new THREE.Vector3(8, 8, 8));
          controls = new THREE.OrbitControls(camera);
          controls.target = new THREE.Vector3(8, 8, 8);
          controls.minDistance = 10;
          controls.maxDistance = 1000;
          controls.zoomSpeed = .5;
          e[0].addEventListener('wheel', function() {
            return controls.update();
          });
          renderer.setClearColor(0xffffff);
          renderer.setSize(e[0].clientWidth, e[0].clientHeight);
          $scope.loaded = true;
          e[0].appendChild(renderer.domElement);
          radius = 300;
          animate = function() {
            requestAnimationFrame(animate);
            return renderer.render(scene, camera);
          };
          return animate();
        });
        $scope.$watch('model', function() {
          if (!$scope.model || !$scope.loaded) {
            return;
          }
          $scope.model.elements = [$scope.model.elements[80], $scope.model.elements[81], $scope.model.elements[88]];
          return async.eachOf($scope.model.textures, function(v, k, cb) {
            textures[k] = new Image();
            textures[k].onload = function() {
              return cb();
            };
            return textures[k].src = 'images/' + v + '.png';
          }, function() {
            return $scope.renderModel();
          });
        });
        return $scope.renderModel = function() {
          var facesNames;
          facesNames = ['west', 'east', 'up', 'down', 'south', 'north'];
          return $scope.model.elements.forEach(function(e) {
            var box, boxMesh, faceMaterial, helper, materials, pivot, size;
            size = [e.to[0] - e.from[0], e.to[1] - e.from[1], e.to[2] - e.from[2]];
            materials = _.map(facesNames, function(k) {
              var canvas, canvasSize, ctx, face, material, rotationOffset, tex;
              face = e.faces[k];
              if (!face) {
                if (k === 'west') {
                  face = e.faces['east'];
                } else if (k === 'east') {
                  face = e.faces['west'];
                } else if (k === 'up') {
                  face = e.faces['down'];
                } else if (k === 'down') {
                  face = e.faces['up'];
                } else if (k === 'south') {
                  face = e.faces['north'];
                } else if (k === 'north') {
                  face = e.faces['south'];
                }
              }
              canvas = document.createElement('canvas');
              canvasSize = 64;
              canvas.width = canvas.height = canvasSize;
              ctx = canvas.getContext('2d');
              ctx.imageSmoothingEnabled = false;
              rotationOffset = [0, 0];
              if (face) {
                if (face.rotation) {
                  ctx.translate(canvasSize / 2, canvasSize / 2);
                  ctx.rotate(face.rotation * Math.PI / 180);
                  rotationOffset = [canvasSize / 2, canvasSize / 2];
                }
                console.log(k, face.uv[0], face.uv[1], face.uv[2] - face.uv[0], face.uv[3] - face.uv[1]);
                console.log('uvs', face.uv);
                ctx.drawImage(textures[face.texture.replace('#', '')], face.uv[0], face.uv[1], face.uv[2] - face.uv[0], face.uv[3] - face.uv[1], -rotationOffset[0], -rotationOffset[1], canvasSize, canvasSize);
              }
              document.getElementById('debug-div').appendChild(canvas);
              tex = new THREE.Texture(canvas);
              tex.needsUpdate = true;
              tex.magFilter = THREE.NearestFilter;
              return material = new THREE.MeshPhongMaterial({
                map: tex
              });
            });
            faceMaterial = new THREE.MultiMaterial(materials);
            console.log('========================================');
            pivot = new THREE.Object3D;
            box = new THREE.BoxGeometry(size[0], size[1], size[2]);
            boxMesh = new THREE.Mesh(box, faceMaterial);
            boxMesh.position.x = (size[0] / 2) + e.from[0];
            boxMesh.position.y = (size[1] / 2) + e.from[1];
            boxMesh.position.z = (size[2] / 2) + e.from[2];
            if (e.rotation) {
              if (e.rotation.axis === 'x') {
                pivot.position.y += e.rotation.origin[1];
                pivot.position.z += e.rotation.origin[2];
                boxMesh.position.y -= e.rotation.origin[1];
                boxMesh.position.z -= e.rotation.origin[2];
                pivot.rotation.x = toRadians(e.rotation.angle);
              }
              if (e.rotation.axis === 'y') {
                pivot.position.x += e.rotation.origin[0];
                pivot.position.z += e.rotation.origin[2];
                boxMesh.position.x -= e.rotation.origin[0];
                boxMesh.position.z -= e.rotation.origin[2];
                pivot.rotation.y = toRadians(e.rotation.angle);
              }
              if (e.rotation.axis === 'z') {
                pivot.position.x += e.rotation.origin[0];
                pivot.position.y += e.rotation.origin[1];
                boxMesh.position.x -= e.rotation.origin[0];
                boxMesh.position.y -= e.rotation.origin[1];
                pivot.rotation.z = toRadians(e.rotation.angle);
              }
            }
            pivot.add(boxMesh);
            helper = new THREE.BoxHelper(pivot, 0xffffff);
            scene.add(helper);
            return scene.add(pivot);
          });
        };
      }
    };
    return element;
  });

  toRadians = function(angle) {
    return angle * (Math.PI / 180);
  };

}).call(this);

//# sourceMappingURL=../maps/app.js.map