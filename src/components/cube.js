import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import * as handpose from '@tensorflow-models/handpose';
import '@tensorflow/tfjs';

const Cube = () => {
  const containerRef = useRef(null);
  const handposeRef = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => {
    let camera, scene, renderer, cube;

    const init = async () => {
      // Set up camera
      camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
      );
      camera.position.z = 5;

      // Set up scene
      scene = new THREE.Scene();

      // Create cube geometry
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
      cube = new THREE.Mesh(geometry, material);
      scene.add(cube);

      // Set up renderer
      renderer = new THREE.WebGLRenderer({ alpha: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      containerRef.current.appendChild(renderer.domElement);

      // Initialize handpose model
      try {
        handposeRef.current = await handpose.load();
        trackHand();
      } catch (error) {
        console.error('Failed to load handpose model:', error);
      }

      // Render loop
      const animate = () => {
        requestAnimationFrame(animate);
        renderer.render(scene, camera);
      };

      animate();
    };

    const trackHand = async () => {
      const video = document.createElement('video');
      video.width = window.innerWidth;
      video.height = window.innerHeight;

      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      video.srcObject = stream;
      video.play();

      video.onloadedmetadata = () => {
        videoRef.current = video;
        const videoTexture = new THREE.VideoTexture(videoRef.current);
        videoTexture.minFilter = THREE.LinearFilter;
        videoTexture.magFilter = THREE.LinearFilter;
        // videoTexture.format = THREE.RGBFormat;

        const handDetection = async () => {
          if (!handposeRef.current) return;

          const predictions = await handposeRef.current.estimateHands(
            videoRef.current
          );

          if (predictions.length > 0) {
            const hand = predictions[0].landmarks;
            const thumbTip = hand[4];
            const indexTip = hand[8];

            const thumbX = thumbTip[0];
            const thumbY = thumbTip[1];

            const indexX = indexTip[0];
            const indexY = indexTip[1];

            // Calculate rotation based on hand movement
            const rotationX = (thumbY - indexY) * 0.01;
            const rotationY = (thumbX - indexX) * 0.01;

            cube.rotation.x = rotationX;
            cube.rotation.y = rotationY;
          }

          requestAnimationFrame(handDetection);
        };

        handDetection();
      };
    };

    init();
  }, []);

  return <div ref={containerRef} />;
};

export default Cube;
