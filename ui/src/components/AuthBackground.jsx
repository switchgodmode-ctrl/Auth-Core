import { Canvas } from "@react-three/fiber";
import { Float, Stars } from "@react-three/drei";
import { useMemo } from "react";

function Aura() {
  const brand = useMemo(() => {
    const s = getComputedStyle(document.documentElement);
    const c = s.getPropertyValue("--brand").trim() || "#4f46e5";
    return c;
  }, []);
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        background:
          `radial-gradient(800px 400px at 20% -10%, color-mix(in srgb, ${brand} 24%, transparent), transparent),
           radial-gradient(700px 350px at 80% -20%, color-mix(in srgb, ${brand} 18%, transparent), transparent)`
      }}
    />
  );
}

function Orb() {
  return (
    <Float rotationIntensity={0.2} floatIntensity={0.5} position={[0, 0, 0]}>
      <mesh>
        <torusKnotGeometry args={[0.8, 0.18, 100, 16]} />
        <meshStandardMaterial color="#ffffff" emissiveIntensity={0.3} wireframe />
      </mesh>
    </Float>
  );
}

export default function AuthBackground() {
  return (
    <div style={{
  position: "absolute",
  inset: 0,
  pointerEvents: "none",
  zIndex: 0
}}>
      <Canvas camera={{ position: [0, 0, 3.6], fov: 60 }}>
        <ambientLight intensity={0.6} />
        <Stars radius={40} depth={20} count={400} factor={3} fade />
        <Orb />
      </Canvas>
      <Aura />
    </div>
  );
}
