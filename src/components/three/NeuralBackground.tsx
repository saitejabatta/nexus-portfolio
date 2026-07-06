"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

const NODE_COUNT = 90;
const LINK_DISTANCE = 3.2;
const SPREAD = 14;

/** Build a random node cloud and the edges between nearby nodes (once). */
function useNeuralGeometry() {
  return useMemo(() => {
    const positions = new Float32Array(NODE_COUNT * 3);
    const nodes: THREE.Vector3[] = [];

    for (let i = 0; i < NODE_COUNT; i++) {
      const v = new THREE.Vector3(
        (Math.random() - 0.5) * SPREAD,
        (Math.random() - 0.5) * SPREAD * 0.7,
        (Math.random() - 0.5) * SPREAD * 0.5,
      );
      nodes.push(v);
      positions.set([v.x, v.y, v.z], i * 3);
    }

    const linePoints: number[] = [];
    for (let i = 0; i < NODE_COUNT; i++) {
      for (let j = i + 1; j < NODE_COUNT; j++) {
        if (nodes[i].distanceTo(nodes[j]) < LINK_DISTANCE) {
          linePoints.push(
            nodes[i].x, nodes[i].y, nodes[i].z,
            nodes[j].x, nodes[j].y, nodes[j].z,
          );
        }
      }
    }

    return {
      positions,
      lines: new Float32Array(linePoints),
    };
  }, []);
}

function Network() {
  const group = useRef<THREE.Group>(null);
  const lineMat = useRef<THREE.LineBasicMaterial>(null);
  const { positions, lines } = useNeuralGeometry();

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (group.current) {
      // Slow idle rotation + gentle pointer parallax
      group.current.rotation.y = t * 0.04 + state.pointer.x * 0.25;
      group.current.rotation.x = Math.sin(t * 0.15) * 0.06 + state.pointer.y * 0.15;
    }
    if (lineMat.current) {
      // Breathing edge opacity — the "thinking" pulse (kept faint for readability)
      lineMat.current.opacity = 0.05 + Math.sin(t * 0.8) * 0.025;
    }
  });

  return (
    <group ref={group}>
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          color="#22d3ee"
          size={0.09}
          sizeAttenuation
          transparent
          opacity={0.4}
          depthWrite={false}
        />
      </points>

      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[lines, 3]} />
        </bufferGeometry>
        <lineBasicMaterial
          ref={lineMat}
          color="#1e3a6e"
          transparent
          opacity={0.05}
          depthWrite={false}
        />
      </lineSegments>
    </group>
  );
}

/** Full-bleed animated neural net behind the experience. */
export function NeuralBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10">
      <Canvas
        camera={{ position: [0, 0, 16], fov: 60 }}
        dpr={[1, 1.75]}
        gl={{ antialias: true, alpha: true }}
      >
        <Network />
      </Canvas>
    </div>
  );
}
