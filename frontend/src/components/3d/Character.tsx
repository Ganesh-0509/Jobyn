import React, { useEffect, useRef, useState, Suspense } from 'react';
import { useFrame, useGraph } from '@react-three/fiber';
import { useGLTF, useAnimations, OrbitControls, SpotLight, Center } from '@react-three/drei';
import * as THREE from 'three';

interface CharacterProps {
  modelUrl: string;
  position?: [number, number, number];
  scale?: number;
  rotation?: [number, number, number];
  onClick?: () => void;
}

export const CharacterModel: React.FC<CharacterProps> = ({ 
  modelUrl, 
  position = [0, -1, 0], 
  scale = 1,
  rotation = [0, 0, 0],
  onClick 
}) => {
  const group = useRef<THREE.Group>(null);
  
  // Load the GLB model using suspense
  const { scene, materials, animations } = useGLTF(modelUrl);
  // Clone scene so it can be reused safely if needed
  const clone = React.useMemo(() => scene.clone(), [scene]);
  const { nodes } = useGraph(clone);
  
  // Set up animations
  const { actions, names } = useAnimations(animations, group);
  const [activeAction, setActiveAction] = useState<string | null>(null);

  // Auto-play the first animation (usually idle or talking)
  useEffect(() => {
    if (names.length > 0) {
      // Find idle or talking animation, defaults to the first one available
      const defaultAnim = names.find(n => n.toLowerCase().includes('idle') || n.toLowerCase().includes('talk')) || names[0];
      const action = actions[defaultAnim];
      if (action) {
        action.reset().fadeIn(0.5).play();
        setActiveAction(defaultAnim);
      }
    }
    
    // Cleanup/Dispose on unmount
    return () => {
      Object.values(actions).forEach(action => action?.stop());
      scene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          if (mesh.geometry) mesh.geometry.dispose();
          if (mesh.material) {
            if (Array.isArray(mesh.material)) {
              mesh.material.forEach(m => m.dispose());
            } else {
              mesh.material.dispose();
            }
          }
        }
      });
    };
  }, [actions, names, scene]);

  // Handle click for interactive animation switching
  const handleClick = (e: any) => {
    e.stopPropagation();
    if (onClick) onClick();
    
    // Play a "talk" or alternative animation on click if available
    if (names.length > 1) {
      const altAnim = names.find(n => n !== activeAction && n.toLowerCase().includes('talk')) || names[1];
      if (activeAction && actions[activeAction] && actions[altAnim]) {
        actions[activeAction]?.fadeOut(0.5);
        actions[altAnim]?.reset().fadeIn(0.5).play();
        setActiveAction(altAnim);
        
        // Return to idle after a few seconds
        setTimeout(() => {
          if (group.current && activeAction) { // Check if still mounted
            actions[altAnim]?.fadeOut(0.5);
            actions[activeAction]?.reset().fadeIn(0.5).play();
            setActiveAction(activeAction);
          }
        }, 3000);
      }
    }
  };

  // Add subtle breathing/idle sway if no animations exist
  useFrame((state, delta) => {
    if (names.length === 0 && group.current) {
      group.current.position.y = position[1] + Math.sin(state.clock.elapsedTime) * 0.05;
    }
  });

  return (
    <group 
      ref={group} 
      position={position} 
      scale={scale} 
      rotation={rotation}
      onClick={handleClick}
      dispose={null}
    >
      <primitive object={clone} />
    </group>
  );
};

// Preload the model to prevent UI freezing
// usage requires exact path to be known, but handled generically here

export default function CharacterScene({ modelUrl, scale = 1, ...props }: CharacterProps) {
  return (
    <Suspense fallback={null}>
      {/* Fallback to simple lighting instead of remote Environment preset, avoids ERR_NAME_NOT_RESOLVED */}
      
      {/* 3-Point Lighting for a clean, premium look without heavy shadows */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={1} color="#ffffff" />
      <directionalLight position={[-5, 3, -5]} intensity={0.5} color="#b0c4de" />
      
      {/* Spotlight for dramatic rim/highlight effect */}
      <SpotLight
        position={[0, 5, 2]}
        angle={0.3}
        penumbra={1}
        intensity={2}
        distance={10}
        color="#aaccff"
      />
      
      <Center top position={[0, -2, 0]}>
        <group scale={scale}>
          <CharacterModel modelUrl={modelUrl} {...props} position={[0, 0, 0]} />
        </group>
      </Center>
      
      <OrbitControls 
        enablePan={true} 
        enableZoom={true} 
        minPolarAngle={Math.PI / 4} 
        maxPolarAngle={Math.PI / 1.5} 
        autoRotate
        autoRotateSpeed={0.5}
        target={[0, 2, 0]}
      />
    </Suspense>
  );
}
