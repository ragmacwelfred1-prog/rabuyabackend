
import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text, Box, Plane } from '@react-three/drei';

interface ParkingSlot {
    id: number;
    slot_number: string;
    status: 'available' | 'occupied' | 'maintenance';
    nightly_rate: number;
}

interface Props {
    slots: ParkingSlot[];
    onSelectSlot: (slot: ParkingSlot) => void;
}

const getSlotNumber = (slot: ParkingSlot): number => {
    const match = slot.slot_number.match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
};

const isLeftSlot = (slot: ParkingSlot): boolean => {
    return slot.slot_number.toUpperCase().startsWith('A');
};

const Slot3D: React.FC<{ slot: ParkingSlot; position: [number, number, number]; onClick: () => void }> = ({ slot, position, onClick }) => {
    const color =
        slot.status === 'available' ? '#10B981' :
        slot.status === 'occupied' ? '#F59E0B' :
        '#EF4444';

    return (
        <group position={[position[0], 0, position[2]]} onClick={onClick}>
            <Box args={[1.2, 0.1, 2.2]} position={[0, 0, 0]}>
                <meshStandardMaterial color={color} roughness={0.3} metalness={0.1} />
            </Box>
            <Text
                position={[0, 0.25, 0]}
                fontSize={0.2}
                color="white"
                anchorX="center"
                anchorY="middle"
                outlineWidth={0.02}
                outlineColor="black"
                rotation={[0, Math.PI, 0]}
            >
                {slot.slot_number}
            </Text>
            {slot.status !== 'available' && (
                <Box args={[1.0, 0.05, 2.0]} position={[0, -0.08, 0]}>
                    <meshStandardMaterial color="#000000" opacity={0.4} transparent />
                </Box>
            )}
        </group>
    );
};

export const ParkingMap3D: React.FC<Props> = ({ slots, onSelectSlot }) => {
   
    const leftSlotsRaw = slots.filter(s => isLeftSlot(s));
    const rightSlotsRaw = slots.filter(s => !isLeftSlot(s));
    const leftSlots = [...leftSlotsRaw].sort((a, b) => getSlotNumber(a) - getSlotNumber(b));
    const rightSlots = [...rightSlotsRaw].sort((a, b) => getSlotNumber(a) - getSlotNumber(b));
    const finalLeft = leftSlots.slice(0, 8);
    const finalRight = rightSlots.slice(0, 8);

    // Simetriko posisyon
    const slotWidth = 1.2;
    const walkwayWidth = 2.2;
    const margin = 0.3;
    const leftCenter = -(walkwayWidth / 2 + margin + slotWidth / 2);
    const rightCenter = +(walkwayWidth / 2 + margin + slotWidth / 2);
    const leftStartX = leftCenter;
    const rightStartX = rightCenter;

    const spacingZ = 2.5;
    const startZ = -4.0;       
    const endZ = startZ + (Math.max(finalLeft.length, finalRight.length) - 1) * spacingZ;


    const entranceZ = -7.2;     
    const signageZ = -7.6;       

    const floorWidth = Math.abs(leftStartX) + Math.abs(rightStartX) + slotWidth + 1.5;
    const floorLength = Math.abs(startZ - endZ) + 8; 

    return (
        <div style={{ width: '100%', height: '550px', background: '#1e293b', borderRadius: 12, overflow: 'hidden' }}>
            <Canvas camera={{ position: [0, 6, 12], fov: 45 }}>
                <ambientLight intensity={0.6} />
                <pointLight position={[0, 6, 0]} intensity={0.8} />
                <directionalLight position={[2, 5, 3]} intensity={0.5} />
                <OrbitControls enablePan enableZoom enableRotate target={[0, 0, -2]} />

                {/* Asphalt floor */}
                <Plane args={[floorWidth, floorLength]} position={[0, -0.15, (startZ + endZ) / 2]} rotation={[-Math.PI / 2, 0, 0]}>
                    <meshStandardMaterial color="#2d2d2d" roughness={0.8} metalness={0.1} />
                </Plane>

                <gridHelper args={[floorWidth, 20]} position={[0, -0.1, (startZ + endZ) / 2]} />

                {/* Pedestrian walkway */}
                <Plane args={[walkwayWidth, floorLength - 0.5]} position={[0, -0.05, (startZ + endZ) / 2]} rotation={[-Math.PI / 2, 0, 0]}>
                    <meshStandardMaterial color="#9CA3AF" roughness={0.6} metalness={0.05} />
                </Plane>

                {/* Puting gilid ng walkway */}
                <Box args={[0.1, 0.05, floorLength - 0.5]} position={[-walkwayWidth/2, -0.02, (startZ + endZ) / 2]}>
                    <meshStandardMaterial color="white" />
                </Box>
                <Box args={[0.1, 0.05, floorLength - 0.5]} position={[walkwayWidth/2, -0.02, (startZ + endZ) / 2]}>
                    <meshStandardMaterial color="white" />
                </Box>

                {/* Zebra crossing (inilipat din) */}
                {[-6.8, -6.0].map(z => (
                    <group key={z} position={[0, -0.03, z]}>
                        {[-0.8, -0.3, 0.2, 0.7].map(x => (
                            <Box key={x} args={[0.3, 0.05, 0.6]} position={[x, 0, 0]}>
                                <meshStandardMaterial color="white" />
                            </Box>
                        ))}
                    </group>
                ))}

                {/* Entrance / Exit area - inilipat */}
                <group position={[0, 0.2, entranceZ]}>
                    <Box args={[4.5, 0.1, 1.8]} position={[0, 0, 0]}>
                        <meshStandardMaterial color="#3B82F6" emissive="#3B82F6" emissiveIntensity={0.2} />
                    </Box>
                    <Text
                        position={[0, 0.4, 0]}
                        fontSize={0.28}
                        color="white"
                        anchorX="center"
                        outlineWidth={0.02}
                        rotation={[0, Math.PI, 0]}
                    >
                        ENTRANCE / EXIT
                    </Text>
                </group>

                {/* RABUYA PARKING signage - inilipat */}
                <group position={[0, 1.4, signageZ]}>
                    <Box args={[5.5, 0.35, 0.6]} position={[0, 0, 0]}>
                        <meshStandardMaterial color="#F59E0B" metalness={0.7} roughness={0.2} />
                    </Box>
                    <Text
                        position={[0, 0.4, 0.1]}
                        fontSize={0.7}
                        color="#FFD700"
                        anchorX="center"
                        anchorY="middle"
                        outlineWidth={0.03}
                        outlineColor="black"
                        fontWeight="bold"
                        rotation={[0, Math.PI, 0]}
                    >
                        RABUYA PARKING
                    </Text>
                </group>

                {/* Kaliwang slots (A1-A8) */}
                {finalLeft.map((slot, idx) => (
                    <Slot3D
                        key={slot.id}
                        slot={slot}
                        position={[leftStartX, 0, startZ + idx * spacingZ]}
                        onClick={() => onSelectSlot(slot)}
                    />
                ))}

                {/* Kanang slots (B1-B8) */}
                {finalRight.map((slot, idx) => (
                    <Slot3D
                        key={slot.id}
                        slot={slot}
                        position={[rightStartX, 0, startZ + idx * spacingZ]}
                        onClick={() => onSelectSlot(slot)}
                    />
                ))}

                {/* Sidewalk edges */}
                <Box args={[0.2, 0.2, floorLength]} position={[leftStartX - 0.9, 0.1, (startZ + endZ) / 2]}>
                    <meshStandardMaterial color="#6B7280" />
                </Box>
                <Box args={[0.2, 0.2, floorLength]} position={[rightStartX + 0.9, 0.1, (startZ + endZ) / 2]}>
                    <meshStandardMaterial color="#6B7280" />
                </Box>
            </Canvas>
        </div>
    );
};