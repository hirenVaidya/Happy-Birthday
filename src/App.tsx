import { useState, useRef, Suspense, useMemo, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Stars, Sparkles, Float, ContactShadows, Environment } from '@react-three/drei'
import { motion, AnimatePresence } from 'framer-motion'
import * as THREE from 'three'

function Balloon({ color, position, speed, floatOffset }: { color: string, position: [number, number, number], speed: number, floatOffset: number }) {
  const groupRef = useRef<THREE.Group>(null)
  
  // Calculate initial radius and angle based on position for orbiting
  const radius = useMemo(() => Math.sqrt(position[0]*position[0] + position[2]*position[2]), [position])
  const initialAngle = useMemo(() => Math.atan2(position[2], position[0]), [position])

  useFrame((state) => {
    if (groupRef.current) {
      const time = state.clock.elapsedTime
      
      // Orbiting around the center
      const angle = initialAngle + time * speed * 0.3
      groupRef.current.position.x = Math.cos(angle) * radius
      groupRef.current.position.z = Math.sin(angle) * radius
      
      // Gentle floating up and down
      groupRef.current.position.y = position[1] + Math.sin(time * speed + floatOffset) * 0.8
      
      // Slight rotation of the balloon itself
      groupRef.current.rotation.y = Math.sin(time * 0.5) * 0.5
      groupRef.current.rotation.z = Math.sin(time * 0.3) * 0.1
    }
  })

  return (
    <group ref={groupRef} position={position}>
      <mesh castShadow>
        <sphereGeometry args={[0.6, 32, 32]} />
        <meshPhysicalMaterial color={color} roughness={0.1} transmission={0.4} thickness={0.5} clearcoat={1} />
      </mesh>
      <mesh position={[0, -0.6, 0]} castShadow>
        <coneGeometry args={[0.1, 0.2, 16]} />
        <meshPhysicalMaterial color={color} roughness={0.2} />
      </mesh>
      <mesh position={[0, -1.6, 0]}>
        <cylinderGeometry args={[0.005, 0.005, 2]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.3} />
      </mesh>
    </group>
  )
}

function Confetti() {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const CONFETTI_COUNT = 250
  
  const particles = useMemo(() => {
    const temp = []
    for (let i = 0; i < CONFETTI_COUNT; i++) {
      temp.push({
        position: new THREE.Vector3((Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2),
        velocity: new THREE.Vector3((Math.random() - 0.5) * 6, Math.random() * 8 + 4, (Math.random() - 0.5) * 6),
        rotation: new THREE.Vector3(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI),
        rotationSpeed: new THREE.Vector3(Math.random() * 10, Math.random() * 10, Math.random() * 10),
        color: new THREE.Color().setHSL(Math.random(), 0.8, 0.6)
      })
    }
    return temp
  }, [])

  useFrame((state, delta) => {
    if (!meshRef.current) return
    particles.forEach((particle, i) => {
      particle.velocity.y -= delta * 6 // gravity
      
      // air resistance
      particle.velocity.x *= 0.99
      particle.velocity.z *= 0.99
      
      particle.position.addScaledVector(particle.velocity, delta)
      particle.rotation.addScaledVector(particle.rotationSpeed, delta)
      
      if (particle.position.y < -4) { // reset when fallen
        particle.position.set((Math.random() - 0.5) * 2, 0, (Math.random() - 0.5) * 2)
        particle.velocity.set((Math.random() - 0.5) * 6, Math.random() * 10 + 5, (Math.random() - 0.5) * 6)
      }

      dummy.position.copy(particle.position)
      dummy.rotation.set(particle.rotation.x, particle.rotation.y, particle.rotation.z)
      dummy.updateMatrix()
      
      meshRef.current!.setMatrixAt(i, dummy.matrix)
      meshRef.current!.setColorAt(i, particle.color)
    })
    meshRef.current.instanceMatrix.needsUpdate = true
    meshRef.current.instanceColor!.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, CONFETTI_COUNT]} castShadow position={[0, 0, 0]}>
      <planeGeometry args={[0.2, 0.2]} />
      <meshBasicMaterial side={THREE.DoubleSide} />
    </instancedMesh>
  )
}

function GiftBox({ isOpen }: { isOpen: boolean }) {
  const groupRef = useRef<THREE.Group>(null)
  const lidRef = useRef<THREE.Group>(null)
  
  useFrame((state, delta) => {
    const time = state.clock.elapsedTime
    if (isOpen && lidRef.current) {
      // Lid flies up playfully and spins continuously!
      lidRef.current.position.y = THREE.MathUtils.lerp(lidRef.current.position.y, 4 + Math.sin(time * 2) * 0.5, delta * 2)
      lidRef.current.rotation.x = THREE.MathUtils.lerp(lidRef.current.rotation.x, -0.2, delta * 2)
      lidRef.current.rotation.y += delta * 1.5 // constant spin
      lidRef.current.rotation.z = THREE.MathUtils.lerp(lidRef.current.rotation.z, 0.3, delta * 2)
      
      if (groupRef.current) {
        // Box bounces gently
        groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, -1.5 + Math.sin(time * 3) * 0.2, delta * 2)
        // Box rotates slowly
        groupRef.current.rotation.y += delta * 0.2
      }
    }
  })

  const boxColor = "#f472b6" 
  const ribbonColor = "#fbbf24" 

  return (
    <group ref={groupRef} position={[0, -0.5, 0]}>
      <Float speed={2} rotationIntensity={0.2} floatIntensity={0.2} floatingRange={[-0.1, 0.1]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[2, 1.5, 2]} />
          <meshStandardMaterial color={boxColor} roughness={0.2} metalness={0.1} />
        </mesh>
        
        <mesh castShadow>
          <boxGeometry args={[2.05, 1.55, 0.4]} />
          <meshStandardMaterial color={ribbonColor} roughness={0.1} metalness={0.6} />
        </mesh>
        <mesh castShadow>
          <boxGeometry args={[0.4, 1.55, 2.05]} />
          <meshStandardMaterial color={ribbonColor} roughness={0.1} metalness={0.6} />
        </mesh>

        <group ref={lidRef} position={[0, 0.8, 0]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[2.1, 0.4, 2.1]} />
            <meshStandardMaterial color={boxColor} roughness={0.2} metalness={0.1} />
          </mesh>
          <mesh castShadow>
            <boxGeometry args={[2.15, 0.45, 0.4]} />
            <meshStandardMaterial color={ribbonColor} roughness={0.1} metalness={0.6} />
          </mesh>
          <mesh castShadow>
            <boxGeometry args={[0.4, 0.45, 2.15]} />
            <meshStandardMaterial color={ribbonColor} roughness={0.1} metalness={0.6} />
          </mesh>
          <mesh position={[0, 0.4, 0]} castShadow>
            <sphereGeometry args={[0.3, 32, 32]} />
            <meshStandardMaterial color={ribbonColor} roughness={0.1} metalness={0.6} />
          </mesh>
        </group>
      </Float>
    </group>
  )
}

function Scene({ isOpen }: { isOpen: boolean }) {
  const balloonColors = ['#f472b6', '#a78bfa', '#60a5fa', '#34d399', '#fbbf24', '#f87171']

  return (
    <>
      <ambientLight intensity={0.8} />
      <spotLight position={[10, 20, 15]} angle={0.4} penumbra={1} intensity={2} castShadow />
      <pointLight position={[-10, -10, -10]} intensity={1} color="#f472b6" />
      <pointLight position={[10, 10, -10]} intensity={1} color="#a78bfa" />
      
      <Stars radius={50} depth={50} count={3000} factor={4} saturation={1} fade speed={1.5} />
      
      {/* 3D Dynamic Confetti Explosion */}
      <Confetti />
      
      <Balloon color={balloonColors[0]} position={[-3, 2, -3]} speed={1.2} floatOffset={0} />
      <Balloon color={balloonColors[1]} position={[4, 1, -2]} speed={0.9} floatOffset={1} />
      <Balloon color={balloonColors[2]} position={[-2, -1, -5]} speed={1.1} floatOffset={2} />
      <Balloon color={balloonColors[3]} position={[3, 3, -4]} speed={1.5} floatOffset={3} />
      <Balloon color={balloonColors[4]} position={[-4, 3, -1]} speed={1.3} floatOffset={4} />
      <Balloon color={balloonColors[5]} position={[2, -2, -3]} speed={1.0} floatOffset={5} />

      {isOpen && (
        <Sparkles count={500} scale={15} size={6} speed={0.8} opacity={1} color="#fde047" />
      )}
      
      <GiftBox isOpen={isOpen} />

      <ContactShadows position={[0, -3, 0]} opacity={0.6} scale={15} blur={2.5} far={4} />

      <OrbitControls 
        enablePan={false} 
        enableZoom={false}
        minDistance={6} 
        maxDistance={12} 
        autoRotate={true}
        autoRotateSpeed={0.4} // slowed down camera rotation to focus on object animations
        maxPolarAngle={Math.PI / 2}
      />
    </>
  )
}

export default function App() {
  const [isOpen] = useState(true)
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 0.5 // pleasant background volume
      // Try to autoplay on mount
      audioRef.current.play().then(() => {
        setIsPlaying(true)
      }).catch(() => {
        console.log("Autoplay blocked. User needs to interact first.")
      })
    }
  }, [])

  const toggleMusic = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
        setIsPlaying(false)
      } else {
        audioRef.current.play()
        setIsPlaying(true)
      }
    }
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 1.2, delayChildren: 1.5 }
    }
  }

  const item = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    show: { opacity: 1, y: 0, scale: 1, transition: { duration: 1, type: "spring" as const } }
  }

  return (
    <div className="w-full h-screen relative bg-gradient-to-br from-violet-400 via-fuchsia-400 to-pink-400 overflow-hidden">
      
      {/* Hidden Audio Element */}
      <audio ref={audioRef} src="/birthday.mp3" loop />
      
      {/* Floating Music Toggle Button */}
      <button 
        onClick={toggleMusic}
        className="absolute top-4 right-4 z-50 bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 text-white rounded-full p-3 shadow-lg transition-all"
        title={isPlaying ? "Pause Music" : "Play Music"}
      >
        {isPlaying ? '🎵' : '🔇'}
      </button>

      {/* 3D Canvas Layer */}
      <Canvas shadows camera={{ position: [0, 1, 9], fov: 45 }}>
        <Suspense fallback={null}>
          <Scene isOpen={isOpen} />
        </Suspense>
      </Canvas>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
            className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-2 sm:p-4 md:p-8 z-10"
          >
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="w-full max-w-5xl max-h-[95vh] overflow-y-auto custom-scrollbar bg-white/10 backdrop-blur-md border border-white/20 p-4 sm:p-6 md:p-8 rounded-2xl md:rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] pointer-events-auto flex flex-col items-center gap-2 sm:gap-3 text-center"
            >
              <motion.h1 
                variants={item}
                className="text-2xl sm:text-3xl md:text-5xl font-extrabold bg-gradient-to-r from-pink-300 via-purple-300 to-amber-200 bg-clip-text text-transparent drop-shadow-lg mb-1"
              >
                Happy Birthday Priyanshi!
              </motion.h1>

              <motion.div variants={item} className="w-full relative px-2 md:px-6">
                <p className="text-white/95 text-sm sm:text-lg md:text-xl font-medium leading-relaxed italic drop-shadow-md">
                  Watching you grow into the person you are today has been such a beautiful journey.
                </p>
              </motion.div>

              <motion.div variants={item} className="w-24 md:w-32 h-[2px] bg-gradient-to-r from-transparent via-pink-400 to-transparent opacity-60 my-1" />

              <motion.p variants={item} className="text-amber-50 text-xs sm:text-base md:text-lg font-medium leading-relaxed drop-shadow-md">
                <strong className="text-amber-300 text-2xl sm:text-3xl md:text-4xl font-bold block mb-1 drop-shadow-[0_0_15px_rgba(251,191,36,0.6)]">18!</strong>
                Officially old enough to make your own decisions… 
                and young enough to blame your parents when they go wrong. 😉😂
              </motion.p>

              <motion.div variants={item} className="w-24 md:w-32 h-[2px] bg-gradient-to-r from-transparent via-purple-400 to-transparent opacity-60 my-1" />

              <motion.p variants={item} className="text-white/90 text-xs sm:text-sm md:text-base lg:text-lg font-medium leading-relaxed px-1 sm:px-2 text-justify md:text-center">
                <span className="text-pink-300 font-semibold drop-shadow-[0_0_15px_rgba(244,114,182,0.6)]">Look how far you’ve come.</span> Never lose that beautiful little girl inside you — the one who dreams big, laughs freely, and finds happiness in the smallest things. As you step into this new chapter of your life, I hope you always have the courage to chase what makes you happy, the strength to get through the difficult days, and the wisdom to choose what truly matters. May you create countless beautiful memories, meet people who make your life brighter, and never forget how loved and special you are. ❤️ Keep smiling that beautiful smile, keep being the wonderful person you are, and never be afraid to become an even better version of yourself. Here’s to 18 years of you and to all the amazing years waiting ahead! 🥂✨
              </motion.p>

              <motion.div variants={item} className="w-24 md:w-32 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent opacity-60 my-1" />

              <motion.p variants={item} className="text-pink-200 text-xs sm:text-base md:text-lg font-medium leading-relaxed drop-shadow-md">
                May this year bring you happiness, adventures, love, and everything your heart wishes for. 🌸
              </motion.p>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
