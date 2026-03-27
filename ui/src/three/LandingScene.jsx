import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, OrbitControls, Float, Html, Stars } from "@react-three/drei";
import { useRef, useMemo } from "react";

function GlowMaterial({ color = "#4f46e5" }) {
  return (
    <meshStandardMaterial
      color="#cbd5e1"
      roughness={0.2}
      metalness={0.85}
      emissive={color}
      emissiveIntensity={0.35}
    />
  );
}

function Padlock() {
  return (
    <group>
      <mesh position={[0, -0.15, 0]}>
        <boxGeometry args={[0.6, 0.7, 0.25]} />
        <GlowMaterial />
      </mesh>
      <mesh position={[0, 0.35, 0]}>
        <torusGeometry args={[0.28, 0.08, 24, 64]} />
        <GlowMaterial />
      </mesh>
    </group>
  );
}

function Shield() {
  return (
    <group rotation={[0, Math.PI / 8, 0]}>
      <mesh>
        <sphereGeometry args={[0.42, 32, 32]} />
        <GlowMaterial />
      </mesh>
      <mesh scale={[0.85, 0.85, 0.85]}>
        <sphereGeometry args={[0.42, 32, 32]} />
        <meshStandardMaterial color="#111827" roughness={0.8} metalness={0.2} />
      </mesh>
    </group>
  );
}

function LicenceCard() {
  return (
    <group rotation={[0.15, -0.25, 0]}>
      <mesh>
        <boxGeometry args={[1, 0.6, 0.06]} />
        <GlowMaterial />
      </mesh>
      <mesh position={[0, 0, 0.035]}>
        <planeGeometry args={[0.92, 0.52]} />
        <meshStandardMaterial color="#0b0f19" />
      </mesh>
    </group>
  );
}

function TokenChip() {
  return (
    <group rotation={[0.6, 0.2, 0.1]}>
      <mesh>
        <cylinderGeometry args={[0.35, 0.35, 0.12, 48]} />
        <GlowMaterial />
      </mesh>
      <mesh position={[0, 0.065, 0]}>
        <ringGeometry args={[0.08, 0.18, 48]} />
        <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={0.4} />
      </mesh>
    </group>
  );
}

function Fingerprint() {
  return (
    <mesh rotation={[Math.PI / 4, 0, 0]}>
      <torusKnotGeometry args={[0.28, 0.08, 120, 16]} />
      <meshStandardMaterial color="#a78bfa" emissive="#a78bfa" emissiveIntensity={0.4} wireframe />
    </mesh>
  );
}

function BinaryStream() {
  const ref = useRef();
  useFrame((state) => {
    if (ref.current) ref.current.position.y = Math.sin(state.clock.elapsedTime * 0.6) * 0.2;
  });
  return (
    <group ref={ref} position={[0, -0.8, -1.5]}>
      <mesh rotation={[-0.2, 0, 0]}>
        <planeGeometry args={[5, 2, 1, 1]} />
        <meshStandardMaterial color="#0e1422" />
      </mesh>
      <mesh rotation={[-0.2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[5, 2]} />
        <meshBasicMaterial color="#4f46e5" transparent opacity={0.12} />
      </mesh>
    </group>
  );
}

function CameraRig() {
  const group = useRef();
  useFrame(({ mouse }) => {
    if (!group.current) return;
    group.current.rotation.y = mouse.x * 0.2;
    group.current.rotation.x = -mouse.y * 0.1;
  });
  return (
    <group ref={group}>
      <Float rotationIntensity={0.4} floatIntensity={0.8}>
        <Padlock />
      </Float>
      <Float rotationIntensity={0.3} floatIntensity={0.7} position={[1.4, 0.2, 0]}>
        <Shield />
      </Float>
      <Float rotationIntensity={0.3} floatIntensity={0.7} position={[-1.6, -0.2, 0]}>
        <LicenceCard />
      </Float>
      <Float rotationIntensity={0.25} floatIntensity={0.6} position={[0.8, -0.6, 0]}>
        <TokenChip />
      </Float>
      <Float rotationIntensity={0.25} floatIntensity={0.6} position={[-0.6, 0.8, 0]}>
        <Fingerprint />
      </Float>
      <BinaryStream />
    </group>
  );
}

export default function LandingScene() {
  const mobile = useMemo(() => globalThis.matchMedia && matchMedia("(max-width: 640px)").matches, []);
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <Canvas camera={{ position: [0, 0, 3], fov: 55 }} gl={{ antialias: true }}>
        <ambientLight intensity={0.6} />
        <spotLight position={[5, 6, 5]} angle={0.45} penumbra={0.4} intensity={1.2} />
        <Environment preset="city" />
        {mobile ? (
          <Float rotationIntensity={0.3} floatIntensity={0.7}>
            <Padlock />
          </Float>
        ) : (
          <CameraRig />
        )}
        <Stars radius={50} depth={20} count={500} factor={4} fade />
        <OrbitControls enableZoom={false} enablePan={false} />
      </Canvas>
    </div>
  );
}
