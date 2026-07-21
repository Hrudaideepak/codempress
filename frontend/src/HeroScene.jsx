import { Canvas } from "@react-three/fiber";
import { Float, Icosahedron, MeshDistortMaterial } from "@react-three/drei";

function FloatingGem({ position, color, scale }) {
  return (
    <Float speed={2} rotationIntensity={1.5} floatIntensity={1.2}>
      <Icosahedron args={[1, 0]} position={position} scale={scale}>
        <MeshDistortMaterial
          color={color}
          distort={0.3}
          speed={1.5}
          roughness={0.1}
          metalness={0.4}
        />
      </Icosahedron>
    </Float>
  );
}

export default function HeroScene() {
  return (
    <div className="hero-3d" aria-hidden="true">
      <Canvas camera={{ position: [0, 0, 6], fov: 50 }} dpr={[1, 2]} tabIndex={-1} style={{ outline: 'none' }}>
        <ambientLight intensity={0.9} />
        <directionalLight position={[5, 5, 5]} intensity={1.1} />
        <pointLight position={[-5, -3, 2]} intensity={0.6} color="#f43f5e" />
        <FloatingGem position={[2.6, 0.8, 0]} color="#7c3aed" scale={0.9} />
        <FloatingGem position={[3.8, -1.1, -1]} color="#f43f5e" scale={0.55} />
        <FloatingGem position={[1.9, -1.4, -2]} color="#a78bfa" scale={0.4} />
      </Canvas>
    </div>
  );
}
