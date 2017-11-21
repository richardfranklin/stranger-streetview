"use strict";

/* =====================================
    Canvas Loader
===================================== */

var panoCanvas,
    panoDepthCanvas;

var load_canvas = function () {
    // Create a PanoLoader object
    var loader = new GSVPANO.PanoLoader();

    loader.setZoom(3);

    // Implement the onPanoramaLoad handler
    loader.onPanoramaLoad = function () {

    panoCanvas = this.canvas;
    depth_loader();

    /*
            Do your thing with the panorama:
            this.canvas: an HTML5 canvas with the texture
            this.copyright: the copyright of the images
        */
    };

    // Invoke the load method with a LatLng point
    loader.load(new google.maps.LatLng(52.1721951, -0.5259921));
};

/* =====================================
    Depth Map Loader
===================================== */


var depth_loader = function() {

    var panoLoader = new GSVPANO.PanoLoader();
    var depthLoader = new GSVPANO.PanoDepthLoader();
    
    panoLoader.setZoom(3);
    
    depthLoader.onDepthLoad = function() {
    
        var x, y, canvas, context, image, w, h, c;
        
        canvas = document.createElement("canvas");
        context = canvas.getContext('2d');
        w = this.depthMap.width;
        h = this.depthMap.height;
        canvas.setAttribute('width', w);
        canvas.setAttribute('height', h);
        
        image = context.getImageData(0, 0, w, h);
        for(y=0; y<h; ++y) {
            for(x=0; x<w; ++x) {
                c = this.depthMap.depthMap[y*w + x] / 50 * 255;
                image.data[4*(y*w + x)    ] = c;
                image.data[4*(y*w + x) + 1] = c;
                image.data[4*(y*w + x) + 2] = c;
                image.data[4*(y*w + x) + 3] = 255;
            }
        }
        context.putImageData(image, 0, 0);
        var gDepthMap = this.depthMap;
        // document.body.appendChild(canvas);

        panoDepthCanvas = canvas;

        loadThree(panoCanvas, panoDepthCanvas);

    };

    panoLoader.onPanoramaLoad = function() {
        depthLoader.load(this.panoId);
    };

    panoLoader.load(new google.maps.LatLng(52.1721951, -0.5259921));
};

$(window).load(function() {
    load_canvas();
    // loadThree(panoCanvas);
});


/* =====================================
    Three.js
===================================== */

function loadThree(panoCanvas, panoDepthCanvas) {

    var container, composer, canvas, camera, scene, renderer, geometry, texture, mesh, controls;
    var simulateRain;

    init();
    render();

    function init() {

        /* =====================================
            Renderer
        ===================================== */

        function getWindowSize() {
            return {
                'width': window.innerWidth,
                'height': window.innerHeight,
                'aspect': (window.innerWidth / window.innerHeight)
            };
        }

        renderer = new THREE.WebGLRenderer({
            antialias: true
        });

        renderer.setPixelRatio(window.devicePixelRatio);

        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // Add to container in body
        var winSize = getWindowSize();
        container = document.createElement('div');
        document.body.appendChild(container);

        // Set container size
        renderer.setSize(winSize.width, winSize.height);
        container.appendChild(renderer.domElement);

        /* =====================================
            Scene + fog
        ===================================== */
        scene = new THREE.Scene();
        // scene.fog = new THREE.FogExp2(0x0a1721, 0.002, 0.002);

        /* =====================================
            Light
        ===================================== */
        var light;

        light = new THREE.DirectionalLight(0xa2c2ce, 1.25);
        light.position.set(-70, 40, 40);
        // light.position.multiplyScalar(1.2);

        light.castShadow = true;
        light.shadowCameraVisible = true;

        light.shadow.mapSize.width = 712;
        light.shadow.mapSize.height = 712;

        var d = 200;

        light.shadow.camera.left = -d;
        light.shadow.camera.right = d;
        light.shadow.camera.top = d;
        light.shadow.camera.bottom = -d;

        light.shadow.camera.far = 1000;
        // light.shadowDarkness = 0.1;

        scene.add(light);

        /* =====================================
            Camera
        ===================================== */
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
        camera.position.z = 0.5;
        scene.add(camera);


        /* =====================================
            Post Processing
        ===================================== */
        composer = new THREE.EffectComposer( renderer );
        composer.addPass( new THREE.RenderPass( scene, camera ) );
        
        var dotScreenEffect = new THREE.ShaderPass( THREE.DotScreenShader );
        dotScreenEffect.uniforms[ 'scale' ].value = 4;
        // composer.addPass( dotScreenEffect );
        
        var luminosityEffect = new THREE.ShaderPass( THREE.LuminosityHighPassShader ); 
        luminosityEffect.uniforms[ 'luminosityThreshold' ].value = 0.05;
        luminosityEffect.uniforms[ 'smoothWidth' ].value = 0.4;
        luminosityEffect.uniforms[ 'defaultColor' ].value = new THREE.Color( 0x15273f );
        luminosityEffect.uniforms[ 'defaultOpacity' ].value = 1;
        // composer.addPass( luminosityEffect );

        var hueSaturationEffect = new THREE.ShaderPass( THREE.HueSaturationShader ); 
        // hueSaturationEffect.uniforms[ 'hue' ].value = 0.8;
        hueSaturationEffect.uniforms[ 'saturation' ].value = -0.8;
        composer.addPass( hueSaturationEffect ); 

        var filmEffect = new THREE.ShaderPass( THREE.FilmShader ); 
        filmEffect.uniforms[ 'nIntensity' ].value = 0.2;
        filmEffect.uniforms[ 'sIntensity' ].value = 0.2;
        filmEffect.uniforms[ 'grayscale' ].value = 0;
        composer.addPass( filmEffect );

        var colorCorrectionEffect = new THREE.ShaderPass( THREE.ColorCorrectionShader ); 
        // composer.addPass( colorCorrectionEffect );

        var vignetteEffect = new THREE.ShaderPass( THREE.VignetteShader ); 
        vignetteEffect.uniforms[ 'offset' ].value = 1;
        vignetteEffect.uniforms[ 'darkness' ].value = 1.1;
        composer.addPass( vignetteEffect );

        var freiChenEffect = new THREE.ShaderPass( THREE.FreiChenShader ); 
        freiChenEffect.uniforms[ 'aspect' ].value = new THREE.Vector2( 2056, 2056 );
        // composer.addPass( freiChenEffect );

        var toneMapShaderEffect = new THREE.ShaderPass( THREE.ToneMapShader ); 
        toneMapShaderEffect.uniforms[ 'averageLuminance' ].value = 1;
         toneMapShaderEffect.uniforms[ 'luminanceMap' ].value = 2;
         toneMapShaderEffect.uniforms[ 'maxLuminance' ].value = 8.0;
         toneMapShaderEffect.uniforms[ 'minLuminance' ].value = 3;
        toneMapShaderEffect.uniforms[ 'middleGrey' ].value = 4;
        // composer.addPass( toneMapShaderEffect );

        var rgbEffect = new THREE.ShaderPass( THREE.RGBShiftShader );
        rgbEffect.uniforms[ 'amount' ].value = 0.0015;
        rgbEffect.renderToScreen = true;
        composer.addPass( rgbEffect );

        /* =====================================
            Orbit controls
        ===================================== */
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        // enable animation loop when using damping or autorotation
        //controls.enableDamping = true;
        //controls.dampingFactor = 0.25;
        controls.enableZoom = false;

        /* =====================================
            Canvas texture loader
        ===================================== */
        texture = new THREE.Texture(panoCanvas);
        texture.minFilter = THREE.LinearFilter;
        texture.needsUpdate = true;

        /* =====================================
            Street view Sphere
        ===================================== */
        var material = new THREE.MeshBasicMaterial({
            map: texture
        });
        geometry = new THREE.SphereGeometry(600, 32, 32);
        mesh = new THREE.Mesh(geometry, material);
        // mesh.rotation.set(Math.PI, 0, 0);
        mesh.material.side = THREE.DoubleSide;
        scene.add(mesh);

        /* =====================================
            DEPTH Canvas texture loader
        ===================================== */
        var textureDepth = new THREE.Texture(panoDepthCanvas);
        textureDepth.minFilter = THREE.LinearFilter;
        textureDepth.needsUpdate = true;
        
        /* =====================================
            DEPTH Street view Sphere
        ===================================== */
        var depthMaterial = new THREE.MeshBasicMaterial({
            map: textureDepth,
            transparent: true
        });
        var depthGeometry = new THREE.SphereGeometry(500, 32, 32);
        var depthMesh = new THREE.Mesh(depthGeometry, depthMaterial);
        // mesh.rotation.set(Math.PI, 0, 0);
        depthMesh.material.side = THREE.DoubleSide;
        scene.add(depthMesh);

        depthMaterial.opacity = 0.6;

        /* =====================================
            Inner Sphere
        ===================================== */

        var innertexture = new THREE.TextureLoader().load("img/vines-texture.png");
        innertexture.wrapS = THREE.RepeatWrapping;
        innertexture.wrapT = THREE.RepeatWrapping;
        innertexture.repeat.set(1, 1);
        innertexture.minFilter = THREE.LinearFilter;

        var innermaterial = new THREE.MeshBasicMaterial({
            map: innertexture,
            opacity: 0.5,
            transparent: true
        });
        //var innergeometry = new THREE.SphereGeometry(30, 8, 8);
        var innergeometry = new THREE.PlaneGeometry( 295, 387, 32 );
        innergeometry.rotateX(-Math.PI / 2);

        var innermesh = new THREE.Mesh(innergeometry, innermaterial);
        innermesh.material.side = THREE.DoubleSide;
        innermesh.position.y = -50;
        // scene.add(innermesh);


        /* =====================================
            Shadow Plane
        ===================================== */
        var geometry = new THREE.PlaneGeometry(5000, 5000, 5000);

        var material = new THREE.ShadowMaterial({
            transparent: true,
            opacity: 0.2
        });

        var plane = new THREE.Mesh(geometry, material);
        plane.rotateX(-Math.PI / 2);
        plane.position.y = -24;
        plane.receiveShadow = true;
        // scene.add(plane);

        /* =====================================
            Object loader
        ===================================== */

        var onProgress = function (xhr) {
            if (xhr.lengthComputable) {
                var percentComplete = xhr.loaded / xhr.total * 100;
                console.log(Math.round(percentComplete, 2) + '% downloaded');
            }
        };

        var onError = function (xhr) {};

        /* ======== Object Texture ======== */

        // var mtlLoader = new THREE.MTLLoader();

        // mtlLoader.setPath('/models/demogorgon/');

        // mtlLoader.load('demogorgon.mtl', function (materials) {
        //     materials.preload();
        //     var objLoader = new THREE.OBJLoader();
        //     objLoader.setMaterials(materials);
        //     objLoader.setPath('/models/demogorgon/');
        //     objLoader.load('demogorgon.obj', function (object) {
        //         object.position.y = -25;
        //         object.position.x = 50;
        //         object.scale.set(0.15, 0.15, 0.15);
        //         object.rotation.set(0, Math.PI * 1.8, 0);
        //         // scene.add(object);

        //         object.traverse(function (child) {
        //             if (child instanceof THREE.Mesh) {
        //                 child.castShadow = true;
        //             }
        //         });

        //     }, onProgress, onError);
        // });


        /* =====================================
            Particle 3D
        ===================================== */


        /* =====================================
            Particle 3D
        ===================================== */

        var textureLoader = new THREE.TextureLoader();

        var particleCount = 1000;
        var pMaterial = new THREE.PointsMaterial({
           color: 0xFFFFFF,
           size: 6,
           blending: THREE.AdditiveBlending,
           depthTest: false,
           transparent: true,
           opacity: 0.2,
           map: textureLoader.load("/img/particle.png")
        });

        var particles = new THREE.Geometry;


        for (var i = 0; i < particleCount; i++) {
            // Initial positions and valocities
            var pX = Math.random() * 1000 - 500,
            pY = Math.random() * 500 - 250,
            pZ = Math.random() * 1000 - 500,
            particle = new THREE.Vector3(pX, pY, pZ);
            particle.velocity = {};
            particle.velocity.y = - -((Math.random()) * 0.2);
            particle.velocity.x = (((Math.random() * 2) - 1) * 0.2);
            particle.velocity.z = (((Math.random() * 2) - 1) * 0.2);
            particles.vertices.push(particle);
        }

        var particleSystem = new THREE.Points(particles, pMaterial);
        scene.add(particleSystem);

        simulateRain = function(){
            var pCount = particleCount;
            while (pCount--) {
              var particle = particles.vertices[pCount];
              if (particle.y < -200) {
                // Reset particles and set new velocity
                particle.y = 200;
                particle.x = Math.random() * 1000 - 500;
                particle.z = Math.random() * 1000 - 500;
                particle.velocity.y = -((Math.random()) * 0.2);
                particle.velocity.x = (((Math.random() * 2) - 1) * 0.2);
                particle.velocity.z = (((Math.random() * 2) - 1) * 0.2);
              }
          
              particle.y += particle.velocity.y;
              particle.x += particle.velocity.x;
              particle.x += particle.velocity.z;
            }
          
            particles.verticesNeedUpdate = true;
          };


        /* =====================================
            Particles
        ===================================== */

        /* =====================================
            Particles (rain)
        ===================================== */

        controls.update();
    }

    /* =====================================
        Render
    ===================================== */
    function render() {
        requestAnimationFrame(render);
        composer.render(scene, camera);
        simulateRain();
    };
}
