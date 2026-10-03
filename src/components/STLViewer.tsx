import React, { Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stage, Center } from '@react-three/drei';
import { STLLoader } from 'three-stdlib';
import { useLoader } from '@react-three/fiber';
import * as THREE from 'three';

interface STLViewerProps {
  url: string;
  color?: string;
}

function Model({ url, color = '#0071e3' }: STLViewerProps) {
  const geometry = useLoader(STLLoader, url);
  
  // 计算模型的边界框，将其居中
  const computedGeometry = useMemo(() => {
    geometry.computeBoundingBox();
    geometry.center();
    return geometry;
  }, [geometry]);

  return (
    <mesh geometry={computedGeometry} castShadow receiveShadow>
      <meshStandardMaterial 
        color={color} 
        roughness={0.4} 
        metalness={0.6} 
      />
    </mesh>
  );
}

export default function STLViewer({ url, color }: STLViewerProps) {
  return (
    <div className="w-full h-full min-h-[300px] bg-gray-50 rounded-2xl overflow-hidden cursor-move">
      <Canvas shadows camera={{ position: [0, 0, 100], fov: 50 }}>
        <Suspense fallback={null}>
          <Stage environment="city" intensity={0.5} adjustCamera>
            <Center>
              <Model url={url} color={color} />
            </Center>
          </Stage>
        </Suspense>
        <OrbitControls 
          makeDefault 
          autoRotate 
          autoRotateSpeed={1} 
          enablePan={true} 
          enableZoom={true} 
        />
      </Canvas>
    </div>
  );
}
