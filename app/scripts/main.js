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
    Three.js skybox
===================================== */

function loadThree(canvasImg) {
    var width = window.innerWidth, height = window.innerHeight / 2;
    var size = 256;
    // var canvas = document.getElementById('canvas'),
    //     ctx = canvas.getContext('2d');

    var canvas, camera, scene, renderer, geometry, texture, mesh, controls;
    var simulateRain;

    init();
    render();

    function init() {

        renderer = new THREE.WebGLRenderer();
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(width, height);
        document.body.appendChild(renderer.domElement);

        scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2( 0x142d41, 0.002 );

        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
        camera.position.z = 2;
        scene.add(camera);

        controls = new THREE.OrbitControls(camera, renderer.domElement);
        // controls.addEventListener('change'); // remove when using animation loop
        // enable animation loop when using damping or autorotation
        //controls.enableDamping = true;
        //controls.dampingFactor = 0.25;
        controls.enableZoom = false;


        texture = new THREE.Texture(canvasImg);
        texture.minFilter = THREE.LinearFilter;
        texture.needsUpdate = true;

        var material = new THREE.MeshBasicMaterial({ map: texture });
        geometry = new THREE.SphereGeometry(600, 32, 32);
        mesh = new THREE.Mesh(geometry, material);
        // mesh.rotation.set(Math.PI, 0, 0);
        mesh.material.side = THREE.DoubleSide;
        scene.add(mesh);

        var geometry = new THREE.PlaneGeometry( 5000, 5000, 5000 );
        var material = new THREE.MeshBasicMaterial( {color: 0xffff00, side: THREE.DoubleSide} );
        var plane = new THREE.Mesh( geometry, material );
        plane.rotation.set(Math.PI / 2, 0, 0);
        plane.position.y = -200;
        // scene.add( plane );

        /* ==================================================== */

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

        /* ==================================================== */
        
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