// src/components/three-d/FarmScene.jsx
import React, { useRef, Suspense, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, Html, Text, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

// ... (AnimatedModel component remains the same) ...
function AnimatedModel({ position, scale, speed, floatAmplitude, modelPath }) {
  const meshRef = useRef();
  const { scene } = useGLTF(modelPath);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += speed;
      meshRef.current.position.y = position[1] + Math.sin(clock.elapsedTime * speed * 5) * floatAmplitude;
    }
  });

  return (
    <primitive object={scene.clone()} ref={meshRef} position={position} scale={scale} castShadow receiveShadow />
  );
}

// ... (ThreeDButton component remains the same) ...
function ThreeDButton({ position, label, onClick, color = "#4a90e2", hoverColor = "#357bd8", textColor = "white" }) {
  const meshRef = useRef();
  const [hovered, setHover] = React.useState(false);
  const { raycaster, mouse, camera } = useThree();

  const handleClick = useCallback(() => {
    if (onClick) onClick();
  }, [onClick]);

  useFrame(() => {
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects([meshRef.current]);
    if (intersects.length > 0 && !hovered) {
      setHover(true);
      document.body.style.cursor = 'pointer';
    } else if (intersects.length === 0 && hovered) {
      setHover(false);
      document.body.style.cursor = 'auto';
    }
  });

  return (
    <mesh
      position={position}
      ref={meshRef}
      onClick={handleClick}
      onPointerOver={() => setHover(true)}
      onPointerOut={() => setHover(false)}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[4, 1.2, 0.5]} />
      <meshStandardMaterial color={hovered ? hoverColor : color} />
      <Text
        position={[0, 0, 0.26]}
        fontSize={0.5}
        color={textColor}
        anchorX="center"
        anchorY="middle"
        font="/fonts/Inter-Bold.json" // Make sure you have this font or remove the prop
      >
        {label}
      </Text>
    </mesh>
  );
}

// --- FarmScene component accepts a new `showButtons` prop ---
const FarmScene = ({ onFarmerToolsClick, onBuyerMarketplaceClick, showButtons }) => { // <--- ADD showButtons
  const loadingFallback = () => (
    <Html center className="loading-text">
      <p style={{ color: 'white', fontSize: '2em' }}>Loading 3D assets...</p>
    </Html>
  );

  return (
    <Canvas
      camera={{ position: [7, 7, 7], fov: 60 }}
      style={{ width: '100%', height: '100%', background: 'transparent' }}
      shadows
    >
      <Environment preset="forest" background />
      <ambientLight intensity={0.7} />
      <directionalLight position={[10, 15, 10]} intensity={1.5} castShadow />
      <spotLight position={[-10, 20, -5]} angle={0.3} penumbra={1} intensity={1} castShadow />
      <pointLight position={[0, 5, 0]} intensity={0.5} />

      <mesh receiveShadow rotation-x={-Math.PI / 2} position={[0, -1.5, 0]}>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#6B8E23" />
      </mesh>

      <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[3, 3, 3]} />
        <meshStandardMaterial color="sienna" />
      </mesh>
      <mesh position={[0, 3, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.7, 0.7, 4, 32]} />
        <meshStandardMaterial color="darkgray" />
      </mesh>

      <Suspense fallback={loadingFallback()}>
        {/* Animated Models */}
        <AnimatedModel position={[5, -1, 5]} scale={[0.8, 0.8, 0.8]} speed={0.05} floatAmplitude={0.2} modelPath="/models/corn.glb" />
        <AnimatedModel position={[-4, -1, -6]} scale={[0.02, 0.02, 0.02]} speed={0.03} floatAmplitude={0.15} modelPath="/models/tractor.glb" />
        <AnimatedModel position={[1, -1, -4]} scale={[0.5, 0.5, 0.5]} speed={0.07} floatAmplitude={0.25} modelPath="/models/hay_bale.glb" />
        <AnimatedModel position={[7, -0.5, -2]} scale={[0.8,0.8,0.8]} speed={0.04} floatAmplitude={0.1} modelPath="/models/scarecrow.glb" />
        <AnimatedModel position={[-6, -0.5, 3]} scale={[0.8,0.8,0.8]} speed={0.06} floatAmplitude={0.2} modelPath="/models/vegetable_cart.glb" />

        {/* Render 3D Buttons conditionally based on showButtons prop */}
        {showButtons && ( // <--- RENDER BUTTONS CONDITIONALLY
          <>
            <ThreeDButton
              position={[0, -0.5, 6]}
              label="Are you a Farmer?"
              onClick={onFarmerToolsClick}
              color="#38a169"
              hoverColor="#2f855a"
            />
            <ThreeDButton
              position={[0, -2, 6]}
              label="Continue as Buyer"
              onClick={onBuyerMarketplaceClick}
              color="#4299e1"
              hoverColor="#3182ce"
            />
          </>
        )}
      </Suspense>

      <OrbitControls enableZoom enablePan enableRotate />
    </Canvas>
  );
};

export default FarmScene;