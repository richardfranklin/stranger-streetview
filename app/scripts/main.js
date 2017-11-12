"use strict";

/* =====================================
    Canvas Loader
===================================== */

var load_canvas = function () {
    // Create a PanoLoader object
    var loader = new GSVPANO.PanoLoader();

    loader.setZoom(3);

    // Implement the onPanoramaLoad handler
    loader.onPanoramaLoad = function () {

        loadThree(this.canvas);
        console.log(this.canvas);
        /*
            Do your thing with the panorama:
            this.canvas: an HTML5 canvas with the texture
            this.copyright: the copyright of the images
        */
    };

    // Invoke the load method with a LatLng point
    loader.load(new google.maps.LatLng(52.1721951, -0.5259921));
}



/* =====================================
    Three.js
===================================== */

function loadThree(canvasImg) {
    var width = window.innerWidth,
        height = window.innerHeight / 2;
    var size = 256;
    // var canvas = document.getElementById('canvas'),
    //     ctx = canvas.getContext('2d');

    var canvas, camera, scene, renderer, geometry, texture, mesh, controls;
    var simulateRain;

    init();
    render();

    function init() {

        /* =====================================
            Renderer
        ===================================== */
        renderer = new THREE.WebGLRenderer();
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(width, height);

        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        document.body.appendChild(renderer.domElement);

        /* =====================================
            Scene + fog
        ===================================== */
        scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(0x142d41, 0.002);
        

        /* =====================================
            Light
        ===================================== */
        var directionalLight = new THREE.DirectionalLight(0xa2c2ce, 1.7);
        directionalLight.castShadow = true; 
        scene.add(directionalLight);

        var light = new THREE.DirectionalLight(0xa2c2ce, 1.7);
        //light.position.set(0, 0, 0);
        light.position.multiplyScalar(1.2);
    
        light.castShadow = true;
        // THREE.CameraHelper( light.shadow.camera );
    
        light.shadowMapWidth = 712;
        light.shadowMapHeight = 712;
        
        /* =====================================
            Camera
        ===================================== */
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
        camera.position.z = 2;
        scene.add(camera);

        /* =====================================
            Orbit controls
        ===================================== */
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        // controls.addEventListener('change'); // remove when using animation loop
        // enable animation loop when using damping or autorotation
        //controls.enableDamping = true;
        //controls.dampingFactor = 0.25;
        controls.enableZoom = false;

        /* =====================================
            Canvas texture loader
        ===================================== */
        texture = new THREE.Texture(canvasImg);
        texture.minFilter = THREE.LinearFilter;
        texture.needsUpdate = true;

        /* =====================================
            Sphere
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
            Plane
        ===================================== */
        var geometry = new THREE.PlaneGeometry(5000, 5000, 5000);
        var material = new THREE.MeshPhongMaterial({
            color: 0xffff00,
            side: THREE.DoubleSide
        });
        var plane = new THREE.Mesh(geometry, material);
        plane.rotation.set(Math.PI / 2, 0, 0);
        plane.position.y = -24;
        plane.receiveShadow = true;
        scene.add( plane );

        /* =====================================
            Shadow Plane
        ===================================== */
        var planeGeometry = new THREE.PlaneGeometry( 5000, 5000 );
        planeGeometry.rotateX(Math.PI / 2 );
        
        
        var planeMaterial = new THREE.ShadowMaterial();
        planeMaterial.opacity = 0.2;
        
        //var plane = new THREE.Mesh( planeGeometry, planeMaterial );
        //plane.position.y = -24;
        //plane.receiveShadow = true;
        // scene.add( plane );

        /* =====================================
            Object loader
        ===================================== */

        var onProgress = function ( xhr ) {
            if ( xhr.lengthComputable ) {
                var percentComplete = xhr.loaded / xhr.total * 100;
                console.log( Math.round(percentComplete, 2) + '% downloaded' );
            }
        };

        var onError = function ( xhr ) { };

        /* ======== Object Texture ======== */

        var mtlLoader = new THREE.MTLLoader();

        mtlLoader.setPath('/models/demogorgon/');
        
        mtlLoader.load('demogorgon.mtl', function (materials) {
            materials.preload();
            var objLoader = new THREE.OBJLoader();
            objLoader.setMaterials(materials);
            objLoader.setPath('/models/demogorgon/');
            objLoader.load('demogorgon.obj', function (object) {
                object.position.y = -25;
                object.position.x = 50;
                object.scale.set(0.15, 0.15, 0.15);
                object.rotation.set(0, Math.PI * 1.8, 0);
                scene.add(object);

                object.traverse( function ( child ) {
                    if ( child instanceof THREE.Mesh ) {
                        child.castShadow = true;
                    }
                });

            }, onProgress, onError);
        });

        /* ======== instantiate a loader ======== */

        //var loader = new THREE.OBJLoader();

        // load a resource
        // loader.load(
        //     // resource URL
        //     'models/demogorgon/demogorgon.obj',
        //     // called when resource is loaded
        //     function (object) {
        //         scene.add(object);
        //         object.position.y = -25;
        //         object.position.x = 50;
        //         object.scale.set(0.15, 0.15, 0.15);
        //         object.rotation.set(0, Math.PI * 1.8, 0);

        //         object.traverse(function (child) {
        //             if (child instanceof THREE.Mesh) {
        //                 child.material.map = objtexture;
        //             }
        //         });
        //     },

        //     // called when loading is in progresses
        //     function (xhr) {
        //         console.log((xhr.loaded / xhr.total * 100) + '% loaded');
        //     },
        //     // called when loading has errors
        //     function (error) {
        //         console.log('An error happened');
        //     }
        // );


        /* =====================================
            Particles
        ===================================== */
        var particleCount = 300;
        var pMaterial = new THREE.PointCloudMaterial({
            color: 0xFFFFFF,
            size: 3,
            blending: THREE.AdditiveBlending,
            depthTest: false,
            transparent: true,
            src: 'http://i.imgur.com/cTALZ.png'
        });
        var particles = new THREE.Geometry;

        for (var i = 0; i < particleCount; i++) {
            var pX = Math.random() * 1000 - 500,
                pY = Math.random() * 500 - 250,
                pZ = Math.random() * 1000 - 500,
                particle = new THREE.Vector3(pX, pY, pZ);
            particle.velocity = {};
            particle.velocity.y = -0.5;
            particles.vertices.push(particle);
        }

        var particleSystem = new THREE.PointCloud(particles, pMaterial);
        particleSystem.position.y = 100;
        scene.add(particleSystem);

        /* =====================================
            Particles (rain)
        ===================================== */
        simulateRain = function () {
            // console.log('rain');
            var pCount = particleCount;
            while (pCount--) {
                var particle = particles.vertices[pCount];
                if (particle.y < -200) {
                    particle.y = 200;
                    particle.velocity.y = -0.2;
                }

                particle.velocity.y -= Math.random() * .0001;

                particle.y += particle.velocity.y;
            }

            particles.verticesNeedUpdate = true;
        };


        controls.update();

    }

    /* =====================================
        Render
    ===================================== */
    function render() {
        requestAnimationFrame(render);
        renderer.render(scene, camera);
        simulateRain();
    };
}



// function loadThree(imagePath) {

//     var fov = 70;
//     var canvas, ctx, container, mesh, renderer, camera, scene, material;

//     container = document.getElementById('pano');
//     canvas = imagePath;

//     ctx = canvas.getContext('2d');

//     container = document.getElementById('pano');

//     camera = new THREE.PerspectiveCamera(fov, window.innerWidth / window.innerHeight, 1, 1100);
//     camera.target = new THREE.Vector3(0, 0, 0);

//     scene = new THREE.Scene();
//     scene.add(camera);

//     renderer = new THREE.WebGLRenderer();
//     renderer.autoClearColor = false;
//     renderer.setSize(window.innerWidth, window.innerHeight);

//     material = new THREE.ShaderMaterial({

//         uniforms: {
//             map: { type: "t", value: THREE.ImageUtils.loadTexture('/img/placeholder.jpg') },
//         },
//         vertexShader: document.getElementById('vs-sphere').textContent,
//         fragmentShader: document.getElementById('fs-sphere').textContent,
//         side: THREE.DoubleSide

//     });

//     var faces = 50;
//     mesh = new THREE.Mesh( new THREE.SphereGeometry( 500, 60, 40 ), material );
//     scene.add( mesh );

//     container.appendChild( renderer.domElement );

// }

/* =====================================
    Window Load
===================================== */


$(window).load(function () {
    load_canvas();
});