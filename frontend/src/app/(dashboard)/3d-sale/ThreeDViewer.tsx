"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import * as THREE from "three";
import { X, Shield, Info, Loader2, UserPlus } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useProjectStore } from "@/store/useProjectStore";
import api from "@/lib/api";
import { Unit, Customer } from "@/types/project.types";

// ============================================================
// Constants and Types
// ============================================================
// ============================================================
type Status = 'available' | 'sold' | 'reserved' | 'not_for_sale';

interface UnitData {
    system_id: number | null;
    id: string;
    block: string;
    block_id?: number;
    fi: number;
    fl: string;
    col: number;
    row: number;
    cephe: string;
    status: Status;
    owner?: string;
    customer_id?: number | null;
    phone?: string;
    note?: string;
}

const SC_HEX: Record<Status, number> = { available: 0x27AE60, sold: 0xC8102E, reserved: 0xE67E22, not_for_sale: 0x95A5A6 };
const SC_CSS: Record<Status, string> = { available: '#27AE60', sold: '#C8102E', reserved: '#E67E22', not_for_sale: '#95A5A6' };
const SL: Record<Status, string> = { available: 'Satışa Açık', sold: 'Satıldı', reserved: 'Rezerve', not_for_sale: 'Satışa Kapalı' };

// Block-to-units map used by Three.js scene builder
interface BlockSceneConfig {
    block: import('@/types/project.types').Block;
    floors: string[];            // sorted floor labels, e.g. ["Zemin Kat","1. Kat",...]
    floorTags: string[];         // matching floor_no codes, e.g. ["Z","1",...]
    faces: string[];             // unique face codes, e.g. ["CK","CE","GK","GE"]
    faceLabels: Record<string, string>; // face_code → cephe label
}

// Parse unit_no → { blockCode, floorTag, faceCode }
function parseUnitNo(unit_no: string, blockCode: string): { floorTag: string; faceCode: string } | null {
    if (!unit_no.startsWith(blockCode)) return null;
    const rest = unit_no.slice(blockCode.length); // e.g. "1CK" or "ZCK" or "roofCK"
    // floorTag is numeric chars or "Z" or "roof" at start, faceCode is the remainder
    const m = rest.match(/^(-?\d+|Z|roof)(.+)$/);
    if (!m) return null;
    return { floorTag: m[1], faceCode: m[2] };
}

// ============================================================
// Main Component
// ============================================================
export default function ThreeDViewer() {
    const mountRef = useRef<HTMLDivElement>(null);
    const [data, setData] = useState<Record<string, UnitData>>({});
    const [blockConfigs, setBlockConfigs] = useState<BlockSceneConfig[]>([]);
    const [layoutMode, setLayoutMode] = useState(false);
    const [labelMode, setLabelMode] = useState(false);
    const [layoutBlocks, setLayoutBlocks] = useState<import('@/types/project.types').Block[]>([]);
    const [savingLayout, setSavingLayout] = useState(false);
    const [camTheta, setCamTheta] = useState(-Math.PI * 0.75); // For compass
    const [sceneLabels, setSceneLabels] = useState<Array<{ id?: number; text: string; x: number; z: number; rotation: number; color: string; scale: number }>>([]);

    // Global Auth and Context
    const { isAuthenticated } = useAuthStore();
    const { activeProject } = useProjectStore();

    // The user requested that anyone logged into the ERP can edit 3D sales
    const isAdmin = isAuthenticated;

    const [listFilter, setListFilter] = useState<Status | 'all'>('all');
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [hoverId, setHoverId] = useState<string | null>(null);
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
    const [isFetching, setIsFetching] = useState(true);
    const [customers, setCustomers] = useState<Customer[]>([]);

    // Modals and UI State
    const [showEdit, setShowEdit] = useState(false);
    const [editForm, setEditForm] = useState<Partial<UnitData> & {
        status?: Status;
        net_area?: number;
        gross_area?: number;
        list_price?: number;
    }>({});
    const [toastMsg, setToastMsg] = useState('');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    // THREE.js References exposed to React
    const threeRef = useRef<{
        setUnitHighlight: (id: string, on: boolean) => void;
        refreshUnitLabel: (id: string) => void;
        doZoom: (f: number) => void;
        setView: (name: string) => void;
    } | null>(null);

    // Load blocks + units dynamically
    useEffect(() => {
        if (!activeProject) { setIsFetching(false); return; }
        setIsFetching(true);

        const load = async () => {
            try {
                // 1. Fetch blocks
                const blocksRes = await api.get('/blocks', { params: { active_project_id: activeProject.id } });
                const blocks: import('@/types/project.types').Block[] = blocksRes.data?.data || blocksRes.data || [];
                setLayoutBlocks(blocks);

                // 1b. Fetch scene labels
                try {
                    const labelsRes = await api.get('/scene-labels', { params: { active_project_id: activeProject.id } });
                    setSceneLabels(labelsRes.data || []);
                } catch { /* labels optional */ }

                // 2. Fetch all units
                const unitsRes = await api.get('/units', { params: { active_project_id: activeProject.id } });
                const serverUnits: Unit[] = unitsRes.data?.data || unitsRes.data || [];

                // 3. Build block configs & data map
                const newData: Record<string, UnitData> = {};
                const configs: BlockSceneConfig[] = [];

                blocks.forEach(block => {
                    const blockCode = block.code || block.name.charAt(0).toUpperCase();
                    const blockUnits = serverUnits.filter(u => u.block_id === block.id);

                    if (blockUnits.length === 0) return;

                    // Collect unique floors (preserve order from floor_no)
                    const floorMap = new Map<string, string>(); // floorTag → label
                    const faceSet = new Set<string>();
                    const faceLabels: Record<string, string> = {};

                    blockUnits.forEach((u: Unit) => {
                        const parsed = parseUnitNo(u.unit_no, blockCode);
                        if (!parsed) return;
                        if (!floorMap.has(parsed.floorTag)) {
                            floorMap.set(parsed.floorTag, u.floor_no || parsed.floorTag);
                        }
                        faceSet.add(parsed.faceCode);
                        if (!faceLabels[parsed.faceCode]) faceLabels[parsed.faceCode] = u.unit_no;
                    });

                    // Sort floors: bodrum (negative) first, then Z, then numbers, then roof
                    const sortedFloorTags = Array.from(floorMap.keys()).sort((a, b) => {
                        const numA = a === 'Z' ? 0 : a === 'roof' ? 9999 : parseInt(a);
                        const numB = b === 'Z' ? 0 : b === 'roof' ? 9999 : parseInt(b);
                        return numA - numB;
                    });

                    const floors = sortedFloorTags.map(t => floorMap.get(t)!);
                    const faces = Array.from(faceSet);

                    configs.push({ block, floors, floorTags: sortedFloorTags, faces, faceLabels });

                    // Populate data map
                    sortedFloorTags.forEach((flTag, fi) => {
                        faces.forEach((faceCode, col) => {
                            const id = (u: Unit) => u.unit_no === `${blockCode}${flTag}${faceCode}`;
                            const su = blockUnits.find(id);
                            const unitId = `${blockCode}${flTag}${faceCode}`;
                            newData[unitId] = {
                                system_id: su ? (su.id as number) : null,
                                id: unitId,
                                block: blockCode,
                                block_id: block.id,
                                fi,
                                fl: flTag,
                                col,
                                row: 0,
                                cephe: faceLabels[faceCode] || faceCode,
                                status: su ? (su.status as Status) : 'available',
                                owner: '',
                                phone: '',
                                note: '',
                            };
                        });
                    });
                });

                setBlockConfigs(configs);
                setData(newData);
            } catch (err) {
                console.error('3D load error', err);
            } finally {
                setIsFetching(false);
            }
        };

        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeProject]);

    const fetchUnits = async (_baseData: Record<string, UnitData>) => {
        // Legacy: no-op now, kept for compatibility
    };

    // Fetch Customers
    useEffect(() => {
        if (!activeProject || !isAdmin) return;
        const fetchCustomers = async () => {
            try {
                const response = await api.get('/customers');
                // The CRM might return nested data from the Laravel resource
                setCustomers(response.data.data || response.data);
            } catch (err) {
                console.error("Customers error", err);
            }
        };
        fetchCustomers();
    }, [activeProject, isAdmin]);

    const showToast = (msg: string) => {
        setToastMsg(msg);
        setTimeout(() => setToastMsg(''), 2800);
    };

    // Her iki state'i senkronize güncelle: layout editorde anlık 3D önizleme
    const updateBlockLayout = (blkId: number, updates: Partial<import('@/types/project.types').Block>) => {
        setLayoutBlocks(prev => prev.map(b => b.id === blkId ? { ...b, ...updates } : b));
        setBlockConfigs(prev => prev.map(cfg =>
            cfg.block.id === blkId
                ? { ...cfg, block: { ...cfg.block, ...updates } }
                : cfg
        ));
    };

    // ============================================================
    // THREE.js Initialization
    // ============================================================
    useEffect(() => {
        if (!mountRef.current || Object.keys(data).length === 0) return;

        let W = mountRef.current.clientWidth;
        let H = mountRef.current.clientHeight;

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(W, H);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFShadowMap;
        renderer.setClearColor(0xECEEF2);
        mountRef.current.appendChild(renderer.domElement);

        const scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(0xECEEF2, 0.012);

        const camera = new THREE.PerspectiveCamera(42, W / H, 0.1, 300);

        const amb = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(amb);

        const sun = new THREE.DirectionalLight(0xffffff, 0.85);
        sun.position.set(-8, 18, -12);
        sun.castShadow = true;
        sun.shadow.camera.left = -20; sun.shadow.camera.right = 20;
        sun.shadow.camera.top = 20; sun.shadow.camera.bottom = -20;
        sun.shadow.mapSize.width = 2048; sun.shadow.mapSize.height = 2048;
        scene.add(sun);

        const fill = new THREE.DirectionalLight(0xddeeff, 0.2);
        fill.position.set(10, 5, 10);
        scene.add(fill);

        const gGeo = new THREE.PlaneGeometry(100, 100);
        const gMat = new THREE.MeshLambertMaterial({ color: 0xDFE3E8 });
        const ground = new THREE.Mesh(gGeo, gMat);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        scene.add(ground);

        const grid = new THREE.GridHelper(80, 40, 0xC8C8CC, 0xD8D8DC);
        grid.position.y = 0.01;
        scene.add(grid);

        // Units Building Variables
        const UW = 2.0, UD = 2.0, UH = 0.9, UGAP = 0.14;
        const BLOCK_GAP = 4.2;

        const unitGroups: Record<string, THREE.Group> = {};

        function faceColor(hexInt: number, brightness: number) {
            const r = (hexInt >> 16 & 0xff) / 255;
            const g = (hexInt >> 8 & 0xff) / 255;
            const b = (hexInt & 0xff) / 255;
            return new THREE.Color(
                Math.min(1, r * brightness),
                Math.min(1, g * brightness),
                Math.min(1, b * brightness)
            );
        }

        function makeLabel(id: string, owner?: string, status?: Status) {
            const cvs2 = document.createElement('canvas');
            cvs2.width = 256; cvs2.height = 64;
            const ctx = cvs2.getContext('2d')!;
            ctx.fillStyle = 'rgba(255,255,255,0.0)';
            ctx.fillRect(0, 0, 256, 64);
            ctx.fillStyle = 'rgba(255,255,255,0.95)';
            ctx.font = 'bold 20px Montserrat,sans-serif';
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(id, 128, owner ? 20 : 32);
            if (owner) {
                ctx.font = '14px Montserrat,sans-serif';
                ctx.fillStyle = 'rgba(255,255,255,0.78)';
                ctx.fillText(owner.substring(0, 14), 128, 44);
            }
            const tex = new THREE.CanvasTexture(cvs2);
            const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
            const sp = new THREE.Sprite(mat);
            sp.scale.set(UW * 1.0, UH * 0.65, 1);
            sp.position.y = 0;
            sp.userData.isLabel = true;
            return sp;
        }

        function createUnitGroup(id: string) {
            const u = data[id];
            if (!u) return new THREE.Group();
            const base = SC_HEX[u.status];
            const group = new THREE.Group();
            group.userData.unitID = id;

            const geo = new THREE.BoxGeometry(UW, UH, UD);
            const mats = [
                new THREE.MeshLambertMaterial({ color: faceColor(base, 0.78) }),
                new THREE.MeshLambertMaterial({ color: faceColor(base, 0.70) }),
                new THREE.MeshLambertMaterial({ color: faceColor(base, 1.30) }),
                new THREE.MeshLambertMaterial({ color: faceColor(base, 0.45) }),
                new THREE.MeshLambertMaterial({ color: faceColor(base, 0.88) }),
                new THREE.MeshLambertMaterial({ color: faceColor(base, 0.95) }),
            ];

            const mesh = new THREE.Mesh(geo, mats);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            mesh.userData.unitID = id;
            group.add(mesh);

            const edges = new THREE.EdgesGeometry(geo);
            const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.25 });
            const lines = new THREE.LineSegments(edges, lineMat);
            lines.userData.isEdge = true;
            group.add(lines);

            group.add(makeLabel(id, u.owner, u.status));

            return group;
        }

        function makeTextSprite(text: string, color: string, scale: number) {
            const c = document.createElement('canvas');
            c.width = 512; c.height = 96;
            const ctx = c.getContext('2d')!;
            ctx.font = 'bold 40px Montserrat,sans-serif';
            ctx.fillStyle = color || '#444';
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(text, 256, 48);
            const tex = new THREE.CanvasTexture(c);
            const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
            const sp = new THREE.Sprite(mat);
            sp.scale.set((scale || 1) * 5.5, (scale || 1) * 1.0, 1);
            return sp;
        }

        function buildBuildings() {
            const stepX = UW + UGAP;  // X ekseninde adım (sütunlar arası)
            const stepZ = UD + UGAP;  // Z ekseninde adım (sıralar arası)

            blockConfigs.forEach(cfg => {
                const bl = cfg.block;
                const blockCode = bl.code || bl.name.charAt(0).toUpperCase();
                const numFaces = cfg.faces.length;
                const perRow = Math.max(1, bl.faces_per_row ?? numFaces); // Satır başında kaç daire
                const numCols = Math.min(perRow, numFaces);  // X sütun sayısı
                const numRows = Math.ceil(numFaces / numCols); // Z satır sayısı

                const bx = bl.scene_x ?? 0;
                const bz = bl.scene_z ?? 0;
                const angleRad = ((bl.scene_angle ?? 0) * Math.PI) / 180;
                const ca = Math.cos(angleRad);
                const sa = Math.sin(angleRad);

                // Bloğun toplam genişlik/derinliği merkezlensin
                const totalX = (numCols - 1) * stepX;
                const totalZ = (numRows - 1) * stepZ;

                cfg.floorTags.forEach((flTag, fi) => {
                    const y = fi * (UH + UGAP) + UH / 2;
                    cfg.faces.forEach((faceCode, fi2) => {
                        const id = `${blockCode}${flTag}${faceCode}`;
                        const col = fi2 % numCols;   // X indeksi
                        const row = Math.floor(fi2 / numCols); // Z indeksi

                        // Merkeze göre lokal koordinat
                        const lx = (col * stepX) - totalX / 2;
                        const lz = (row * stepZ) - totalZ / 2;

                        // Blok rotasyonu uygula
                        const ux = bx + lx * ca - lz * sa;
                        const uz = bz + lx * sa + lz * ca;

                        const g = createUnitGroup(id);
                        g.position.set(ux, y, uz);
                        g.rotation.y = -angleRad;
                        scene.add(g);
                        unitGroups[id] = g;
                    });
                });
            });
        }

        function addLabels() {
            // Helper: flat text on ground
            function makeGroundLabel(text: string, color: string, scale: number) {
                const c = document.createElement('canvas');
                c.width = 1024; c.height = 256;
                const ctx = c.getContext('2d')!;
                ctx.font = 'bold 80px Montserrat,sans-serif';
                ctx.fillStyle = color || '#444';
                ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillText(text, 512, 128);
                const tex = new THREE.CanvasTexture(c);
                tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
                const mat = new THREE.MeshLambertMaterial({ map: tex, transparent: true, depthWrite: false });
                const geo = new THREE.PlaneGeometry(scale * 8, scale * 2);
                const mesh = new THREE.Mesh(geo, mat);
                mesh.rotation.x = -Math.PI / 2;
                return mesh;
            }

            // Block name + floor labels
            blockConfigs.forEach(cfg => {
                const bl = cfg.block;
                const bx = bl.scene_x ?? 0;
                const bz = bl.scene_z ?? 0;
                const numFloors = cfg.floorTags.length;
                const numFaces = cfg.faces.length;
                const perRow = Math.max(1, bl.faces_per_row ?? numFaces);
                const numCols = Math.min(perRow, numFaces);
                const stX = UW + UGAP;

                const lblBlock = makeTextSprite(bl.name.toUpperCase(), '#C8102E', 0.7);
                lblBlock.position.set(bx, numFloors * (UH + UGAP) + 0.9, bz);
                scene.add(lblBlock);

                cfg.floorTags.forEach((flTag, fi) => {
                    const label = flTag === 'Z' ? 'ZEMİN' : flTag === 'roof' ? 'ÇATI' : flTag + '.KAT';
                    const sp = makeTextSprite(label, '#C8102E', 0.4);
                    sp.position.set(bx - (numCols * stX) / 2 - 1.5, fi * (UH + UGAP) + UH / 2, bz);
                    scene.add(sp);
                });
            });

            // Dynamic scene labels from backend
            sceneLabels.forEach(lbl => {
                const gl = makeGroundLabel(lbl.text, lbl.color || '#1A6B9A', lbl.scale || 1.0);
                gl.position.set(lbl.x, 0.02, lbl.z);
                gl.rotation.z = -(lbl.rotation * Math.PI) / 180;
                scene.add(gl);
            });
        }

        buildBuildings();
        addLabels();

        // Camera Orbit
        let camTheta = -Math.PI * 0.75, camPhi = 0.75, camR = 26;
        const camTarget = new THREE.Vector3(0, 3, 0);
        let isDragging = false, isRightDrag = false;
        let lastMX = 0, lastMY = 0, downMX = 0, downMY = 0, wasDrag = false;

        const VIEWS: Record<string, { th: number, ph: number, r: number }> = {
            'n': { th: Math.PI * 0.25, ph: 0.75, r: 26 },
            's': { th: -Math.PI * 0.75, ph: 0.75, r: 26 },
            'e': { th: Math.PI * 0.75, ph: 0.75, r: 26 },
            'w': { th: -Math.PI * 0.25, ph: 0.75, r: 26 },
            'reset': { th: -Math.PI * 0.75, ph: 0.75, r: 26 },
        };

        function updateCamera() {
            const x = camR * Math.sin(camPhi) * Math.sin(camTheta) + camTarget.x;
            const y = camR * Math.cos(camPhi) + camTarget.y;
            const z = camR * Math.sin(camPhi) * Math.cos(camTheta) + camTarget.z;
            camera.position.set(x, y, z);
            camera.lookAt(camTarget);
        }
        updateCamera();

        const doZoom = (f: number) => { camR *= f; camR = Math.max(5, Math.min(70, camR)); updateCamera(); };
        const setView = (name: string) => {
            const v = VIEWS[name] || VIEWS['reset'];
            camTheta = v.th; camPhi = v.ph; camR = v.r;
            updateCamera();
        };

        // React Interface
        threeRef.current = {
            setUnitHighlight: (id: string, on: boolean) => {
                const g = unitGroups[id]; if (!g) return;
                const u = data[id]; if (!u) return;
                const base = SC_HEX[u.status];
                g.children.forEach(c => {
                    if (c.type === 'Mesh') {
                        const mesh = c as THREE.Mesh;
                        const mats = mesh.material as THREE.MeshLambertMaterial[];
                        if (!Array.isArray(mats)) return;
                        const brs = [0.78, 0.70, 1.30, 0.45, 0.88, 0.95];
                        mats.forEach((m, i) => {
                            const b = brs[i] * (on ? 1.22 : 1.0);
                            m.color.copy(faceColor(base, b));
                            m.emissive.set(on ? 0.08 : 0, on ? 0.08 : 0, on ? 0.08 : 0);
                        });
                    }
                    if (c.userData.isEdge) {
                        const line = c as THREE.LineSegments;
                        const mat = line.material as THREE.LineBasicMaterial;
                        mat.color.set(on ? 0xC8102E : 0xffffff);
                        mat.opacity = on ? 0.8 : 0.25;
                    }
                });
            },
            refreshUnitLabel: (id: string) => {
                const g = unitGroups[id]; if (!g) return;
                const u = data[id]; if (!u) return;
                const newLabel = makeLabel(id, u.owner, u.status);
                let oldLabel: THREE.Object3D | null = null;
                g.children.forEach(c => { if (c.userData.isLabel) oldLabel = c; });
                if (oldLabel) g.remove(oldLabel);
                g.add(newLabel);
                threeRef.current?.setUnitHighlight(id, false);
            },
            doZoom,
            setView
        };

        // Interaction handlers
        const canvas = renderer.domElement;
        const raycaster = new THREE.Raycaster();
        const mouse2d = new THREE.Vector2();

        function getHitUnit(ex: number, ey: number) {
            if (!mountRef.current) return null;
            const rect = mountRef.current.getBoundingClientRect();
            mouse2d.x = ((ex - rect.left) / W) * 2 - 1;
            mouse2d.y = -((ey - rect.top) / H) * 2 + 1;
            raycaster.setFromCamera(mouse2d, camera);
            const meshes: THREE.Object3D[] = [];
            Object.values(unitGroups).forEach(g => {
                g.children.forEach(c => { if (c.type === 'Mesh') meshes.push(c); });
            });
            const hits = raycaster.intersectObjects(meshes);
            return hits.length > 0 ? hits[0].object.userData.unitID : null;
        }

        const onMouseDown = (e: MouseEvent) => {
            e.preventDefault();
            isDragging = true; isRightDrag = (e.button === 2 || e.button === 1);
            lastMX = e.clientX; lastMY = e.clientY; downMX = e.clientX; downMY = e.clientY; wasDrag = false;
            canvas.style.cursor = 'grabbing';
        };

        const onMouseMoveDoc = (e: MouseEvent) => {
            if (!isDragging) return;
            const dx = e.clientX - lastMX; const dy = e.clientY - lastMY;
            if (Math.abs(e.clientX - downMX) + Math.abs(e.clientY - downMY) > 4) wasDrag = true;
            if (!isRightDrag) {
                camTheta -= dx * 0.007; camPhi += dy * 0.007;
                camPhi = Math.max(0.08, Math.min(Math.PI * 0.47, camPhi));
                setCamTheta(camTheta); // Push to React for compass overlay
            } else {
                const right = new THREE.Vector3();
                right.crossVectors(camera.getWorldDirection(new THREE.Vector3()), camera.up).normalize();
                camTarget.addScaledVector(right, -dx * 0.02);
                camTarget.y += dy * 0.02;
            }
            lastMX = e.clientX; lastMY = e.clientY;
            updateCamera();
        };

        const onMouseUpDoc = () => {
            isDragging = false; canvas.style.cursor = 'grab';
            setTimeout(() => { wasDrag = false; }, 40);
        };

        const onMouseMove = (e: MouseEvent) => {
            if (wasDrag || isDragging) {
                setHoverId(null);
                return;
            }
            const id = getHitUnit(e.clientX, e.clientY);
            setHoverId(id);
            if (id) {
                setTooltipPos({ x: e.clientX, y: e.clientY });
            }
        };

        const onClick = (e: MouseEvent) => {
            if (wasDrag) return;
            const id = getHitUnit(e.clientX, e.clientY);
            if (id) {
                setSelectedId(id);
            }
        };

        let tPrev: number | null = null;
        const onTouchStart = (e: TouchEvent) => {
            e.preventDefault();
            if (e.touches.length === 1) { isDragging = true; lastMX = e.touches[0].clientX; lastMY = e.touches[0].clientY; downMX = lastMX; downMY = lastMY; wasDrag = false; }
            if (e.touches.length === 2) { isDragging = false; tPrev = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY); }
        };
        const onTouchMove = (e: TouchEvent) => {
            e.preventDefault();
            if (e.touches.length === 1 && isDragging) {
                const dx = e.touches[0].clientX - lastMX; const dy = e.touches[0].clientY - lastMY;
                if (Math.abs(e.touches[0].clientX - downMX) + Math.abs(e.touches[0].clientY - downMY) > 6) wasDrag = true;
                camTheta -= dx * 0.009; camPhi += dy * 0.009; camPhi = Math.max(0.08, Math.min(Math.PI * 0.47, camPhi));
                lastMX = e.touches[0].clientX; lastMY = e.touches[0].clientY; updateCamera();
            }
            if (e.touches.length === 2 && tPrev !== null) {
                const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
                camR *= tPrev / d; camR = Math.max(5, Math.min(70, camR)); tPrev = d; updateCamera();
            }
        };
        const onTouchEnd = (e: TouchEvent) => {
            isDragging = false; tPrev = null;
            if (!wasDrag && e.changedTouches.length > 0) {
                const t = e.changedTouches[0];
                const id = getHitUnit(t.clientX, t.clientY);
                if (id) setSelectedId(id);
            }
            setTimeout(() => { wasDrag = false; }, 50);
        };

        canvas.addEventListener('mousedown', onMouseDown);
        document.addEventListener('mousemove', onMouseMoveDoc);
        document.addEventListener('mouseup', onMouseUpDoc);
        canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        canvas.addEventListener('wheel', (e) => { e.preventDefault(); camR *= e.deltaY > 0 ? 1.1 : 0.91; camR = Math.max(5, Math.min(70, camR)); updateCamera(); }, { passive: false });
        canvas.addEventListener('mousemove', onMouseMove);
        canvas.addEventListener('click', onClick);
        canvas.addEventListener('mouseleave', () => setHoverId(null));
        canvas.addEventListener('touchstart', onTouchStart, { passive: false });
        canvas.addEventListener('touchmove', onTouchMove, { passive: false });
        canvas.addEventListener('touchend', onTouchEnd);

        // Animation loop
        let reqId: number;
        const animate = () => {
            reqId = requestAnimationFrame(animate);
            renderer.render(scene, camera);
        };
        animate();

        const onResize = () => {
            if (!mountRef.current) return;
            W = mountRef.current.clientWidth; H = mountRef.current.clientHeight;
            camera.aspect = W / H; camera.updateProjectionMatrix();
            renderer.setSize(W, H);
        };
        window.addEventListener('resize', onResize);

        return () => {
            cancelAnimationFrame(reqId);
            window.removeEventListener('resize', onResize);
            document.removeEventListener('mousemove', onMouseMoveDoc);
            document.removeEventListener('mouseup', onMouseUpDoc);
            if (mountRef.current) mountRef.current.removeChild(renderer.domElement);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data, blockConfigs]); // Reloads THREE when data or blockConfigs changes

    // ============================================================
    // Handlers for Select and Hover syncing
    // ============================================================
    const prevHover = useRef<string | null>(null);
    const prevSelect = useRef<string | null>(null);

    useEffect(() => {
        if (!threeRef.current) return;
        if (prevHover.current && prevHover.current !== selectedId) {
            threeRef.current.setUnitHighlight(prevHover.current, false);
        }
        if (hoverId && hoverId !== selectedId) {
            threeRef.current.setUnitHighlight(hoverId, true);
        }
        prevHover.current = hoverId;
    }, [hoverId, selectedId]);

    useEffect(() => {
        if (!threeRef.current) return;
        if (prevSelect.current) {
            threeRef.current.setUnitHighlight(prevSelect.current, false);
        }
        if (selectedId) {
            threeRef.current.setUnitHighlight(selectedId, true);
            // Determine what to do when selected
            if (isAdmin) {
                setEditForm({ ...data[selectedId] });
                setShowEdit(true);
            } else {
                if (!isMobileSidebarOpen) {
                    setIsMobileSidebarOpen(true);
                }
            }
        }
        prevSelect.current = selectedId;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedId, isAdmin]);

    // ============================================================
    // Admin Login + Edit Logic
    // ============================================================

    const saveUnit = async () => {
        if (!selectedId || !editForm.status || !activeProject) return;

        try {
            const currentItem = data[selectedId];

            // Build Unit Form mapping
            const payload: any = {
                unit_no: selectedId,
                status: editForm.status,
                net_area: editForm.net_area || null, // Optional tracking
                gross_area: editForm.gross_area || null,
                list_price: editForm.list_price || null,
                // We will send customer ID to backend manually if backend supports it directly on Unit.
                // Otherwise we just save visual notes for now until full CRM backend bind is verified.
            };

            if (currentItem.system_id) {
                // UPDATE
                await api.put(`/units/${currentItem.system_id}`, payload);
            } else {
                // CREATE
                const res = await api.post('/units', {
                    ...payload,
                    unit_type: 'Daire',
                    block_id: data[selectedId]?.block_id,
                }, { params: { active_project_id: activeProject?.id } });

                if (res.data?.data) {
                    currentItem.system_id = res.data.data.id as number;
                }
            }

            const newData = { ...data };
            newData[selectedId] = {
                ...newData[selectedId],
                status: editForm.status as Status,
                owner: editForm.owner || '',
                customer_id: editForm.customer_id,
                phone: editForm.phone || '',
                note: editForm.note || ''
            };

            setData(newData);
            threeRef.current?.refreshUnitLabel(selectedId);
            setShowEdit(false);
            showToast(selectedId + ' bilgileri güncellendi!');
        } catch (err) {
            console.error(err);
            showToast('Hata: Bir sorun oluştu.');
        }
    };

    // ============================================================
    // Derived State (Stats & List)
    // ============================================================
    const allUnits = Object.values(data);
    const stats = {
        total: allUnits.length,
        available: allUnits.filter(u => u.status === 'available').length,
        sold: allUnits.filter(u => u.status === 'sold').length,
        reserved: allUnits.filter(u => u.status === 'reserved').length,
        closed: allUnits.filter(u => u.status === 'not_for_sale').length,
    };

    const filteredUnits = useMemo(() => {
        return allUnits
            .filter(u => listFilter === 'all' || u.status === listFilter)
            .sort((a, b) => a.id.localeCompare(b.id));
    }, [allUnits, listFilter]);

    if (Object.keys(data).length === 0) return null;

    return (
        <div className="flex flex-col h-full bg-[#eceef2] font-sans text-[#1a1a2e]">

            {/* Project Context Header Overlay */}
            {!activeProject && (
                <div className="absolute inset-0 z-50 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center pointer-events-auto">
                    <Shield className="text-[#C8102E] mb-4" size={48} />
                    <div className="font-[Bebas_Neue] text-2xl tracking-[3px] text-[#1a1a2e]">Aktif proje seçilmedi</div>
                    <div className="text-[#8892A0] text-sm mt-2 max-w-sm text-center">3D Satış Ekranını kullanabilmek için lütfen sol menüden projenizi (örn: ZENITH EDREMİT) seçin.</div>
                </div>
            )}

            {isFetching && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-white/90 shadow px-4 py-2 rounded-full border border-slate-200 flex items-center gap-2 text-sm text-slate-600">
                    <Loader2 size={16} className="animate-spin text-[#C8102E]" /> Yükleniyor...
                </div>
            )}

            {/* LEGEND */}
            <div className="flex justify-start md:justify-center overflow-x-auto gap-4 md:gap-6 px-4 py-2 bg-white border-b border-[#DDE1E7] shrink-0 w-full hide-scrollbar flex-nowrap whitespace-nowrap">
                {Object.entries(SC_CSS).map(([k, color]) => (
                    <div key={k} className="flex items-center gap-1.5 text-[8px] md:text-[9px] tracking-[1.5px] uppercase text-[#8892A0]">
                        <div className="w-2 md:w-2.5 h-2 md:h-2.5 rounded-[2px]" style={{ backgroundColor: color }}></div>
                        {SL[k as Status]}
                    </div>
                ))}
            </div>

            {/* BODY */}
            <div className="flex flex-1 overflow-hidden relative w-full">
                {/* VIEWPORT (THREE.js) */}
                <div className="flex-1 relative overflow-hidden bg-gradient-to-br from-[#F5F6F8] to-[#E8EAEE] w-full touch-none" ref={mountRef}>

                    {/* Zoom Controls */}
                    <div className="absolute top-3 left-3 flex flex-col gap-1 z-10">
                        <button className="w-[28px] md:w-[32px] h-[28px] md:h-[32px] bg-white/90 border border-[#DDE1E7] text-[#8892A0] text-lg rounded-[3px] flex items-center justify-center hover:bg-[#C8102E] hover:border-[#C8102E] hover:text-white transition-colors shadow-sm" onClick={() => threeRef.current?.doZoom(0.88)}>+</button>
                        <button className="w-[28px] md:w-[32px] h-[28px] md:h-[32px] bg-white/90 border border-[#DDE1E7] text-[#8892A0] text-lg rounded-[3px] flex items-center justify-center hover:bg-[#C8102E] hover:border-[#C8102E] hover:text-white transition-colors shadow-sm" onClick={() => threeRef.current?.doZoom(1.14)}>-</button>
                        {isAdmin && (
                            <button
                                className={`w-[28px] md:w-[32px] h-[28px] md:h-[32px] text-[8px] font-bold border rounded-[3px] flex items-center justify-center transition-colors shadow-sm mt-1 ${layoutMode ? 'bg-amber-500 border-amber-500 text-white' : 'bg-white/90 border-[#DDE1E7] text-[#8892A0] hover:bg-amber-100 hover:border-amber-400'
                                    }`}
                                title="Blok Düzeni"
                                onClick={() => setLayoutMode(v => !v)}
                            >
                                ☉
                            </button>
                        )}
                    </div>

                    {/* Block Layout Editor Panel */}
                    {layoutMode && isAdmin && (
                        <div className="absolute top-3 left-14 z-20 bg-white/95 border border-amber-300 rounded-xl shadow-xl p-4 w-72 max-h-[80vh] overflow-y-auto">
                            <div className="flex items-center justify-between mb-3">
                                <span className="font-bold text-sm text-amber-700">Blok Konumu Ayarla</span>
                                <button onClick={() => setLayoutMode(false)} className="text-slate-400 hover:text-slate-600"><X size={14} /></button>
                            </div>
                            <p className="text-[10px] text-slate-500 mb-3">Blokların 3D sahnedeki X/Z koordinatlarını ve açısını düzenleyin.</p>
                            <div className="space-y-4">
                                {layoutBlocks.map(blk => (
                                    <div key={blk.id} className="border rounded-lg p-3 space-y-2">
                                        <div className="font-semibold text-xs text-slate-700 flex items-center gap-1">
                                            <span className="w-5 h-5 bg-primary text-white rounded flex items-center justify-center text-[9px] font-bold">{blk.code || blk.name.charAt(0)}</span>
                                            {blk.name}
                                        </div>
                                        <div className="grid grid-cols-3 gap-2">
                                            <div>
                                                <label className="text-[9px] text-slate-400 uppercase tracking-wide">X Konum</label>
                                                <input
                                                    type="number" step="0.5"
                                                    value={blk.scene_x ?? 0}
                                                    onChange={e => updateBlockLayout(blk.id, { scene_x: parseFloat(e.target.value) })}
                                                    className="w-full border rounded px-2 py-1 text-xs font-mono"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[9px] text-slate-400 uppercase tracking-wide">Z Konum</label>
                                                <input
                                                    type="number" step="0.5"
                                                    value={blk.scene_z ?? 0}
                                                    onChange={e => updateBlockLayout(blk.id, { scene_z: parseFloat(e.target.value) })}
                                                    className="w-full border rounded px-2 py-1 text-xs font-mono"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[9px] text-slate-400 uppercase tracking-wide">Açı (°)</label>
                                                <input
                                                    type="number" step="5" min="0" max="360"
                                                    value={blk.scene_angle ?? 0}
                                                    onChange={e => updateBlockLayout(blk.id, { scene_angle: parseFloat(e.target.value) })}
                                                    className="w-full border rounded px-2 py-1 text-xs font-mono"
                                                />
                                            </div>
                                        </div>
                                        {/* Satır başı daire ayarı */}
                                        <div className="pt-1 border-t">
                                            <label className="text-[9px] text-slate-400 uppercase tracking-wide">Satır başı daire (satır x sütun)</label>
                                            <div className="flex items-center gap-2 mt-1">
                                                <input
                                                    type="number" min="1" max="20" step="1"
                                                    value={blk.faces_per_row ?? 4}
                                                    onChange={e => updateBlockLayout(blk.id, { faces_per_row: parseInt(e.target.value) })}
                                                    className="w-20 border rounded px-2 py-1 text-xs font-mono"
                                                />
                                                <span className="text-[10px] text-slate-400">
                                                    {(() => {
                                                        const n = 4; // örnek
                                                        const pr = blk.faces_per_row ?? n;
                                                        const cols = Math.min(pr, n);
                                                        const rows = Math.ceil(n / cols);
                                                        return `${cols} sütun × ${rows} satır`;
                                                    })()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button
                                disabled={savingLayout}
                                onClick={async () => {
                                    setSavingLayout(true);
                                    try {
                                        await Promise.all(layoutBlocks.map(blk =>
                                            api.put(`/blocks/${blk.id}`, {
                                                name: blk.name,
                                                code: blk.code,
                                                scene_x: blk.scene_x ?? 0,
                                                scene_z: blk.scene_z ?? 0,
                                                scene_angle: blk.scene_angle ?? 0,
                                                faces_per_row: blk.faces_per_row ?? 4,
                                                active_project_id: activeProject?.id,
                                            })
                                        ));
                                        // Reload to apply new positions
                                        setBlockConfigs([]);
                                        setData({});
                                        setLayoutMode(false);
                                        // Trigger re-fetch
                                        setIsFetching(true);
                                        const blocksRes = await api.get('/blocks', { params: { active_project_id: activeProject?.id } });
                                        const blocks = blocksRes.data?.data || blocksRes.data || [];
                                        setLayoutBlocks(blocks);
                                        showToast('Blok konumları kaydedildi! Sayfa yenileniyor...');
                                        setTimeout(() => window.location.reload(), 800);
                                    } catch {
                                        showToast('Kaydetme hatası!');
                                    } finally {
                                        setSavingLayout(false);
                                    }
                                }}
                                className="mt-4 w-full bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-2 disabled:opacity-60"
                            >
                                {savingLayout ? <Loader2 size={12} className="animate-spin" /> : null}
                                Konumları Kaydet
                            </button>
                        </div>
                    )}

                    {/* ─── Compass ─── */}
                    {(() => {
                        // Convert camTheta to compass bearing (degrees from North)
                        // camTheta=0 → East, -PI/2 → North, PI/2 → South, ±PI → West
                        const bearing = ((-camTheta - Math.PI / 2) * 180 / Math.PI + 360) % 360;
                        const dirs = ['K', 'KD', 'D', 'GD', 'G', 'GB', 'B', 'KB'];
                        const idx = Math.round(bearing / 45) % 8;
                        return (
                            <div className="absolute bottom-14 right-3 z-10 select-none">
                                <div className="relative w-16 h-16">
                                    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg" style={{ transform: `rotate(${bearing}deg)`, transition: 'transform 0.1s ease' }}>
                                        {/* Rose */}
                                        <circle cx="50" cy="50" r="46" fill="white" fillOpacity="0.88" stroke="#DDE1E7" strokeWidth="2" />
                                        {/* N pointer */}
                                        <polygon points="50,8 44,50 56,50" fill="#C8102E" />
                                        {/* S pointer */}
                                        <polygon points="50,92 44,50 56,50" fill="#666" />
                                        {/* Center dot */}
                                        <circle cx="50" cy="50" r="5" fill="#333" />
                                        {/* N label */}
                                        <text x="50" y="6" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#C8102E" style={{ transform: 'rotate(0deg)' }}>K</text>
                                    </svg>
                                </div>
                                <div className="text-center text-[8px] font-bold text-slate-500 mt-0.5">{dirs[idx]}</div>
                            </div>
                        );
                    })()}

                    {/* ─── Label Mode Button ─── */}
                    {isAdmin && (
                        <button
                            className={`absolute bottom-24 right-3 z-10 w-8 h-8 text-[8px] font-bold border rounded flex items-center justify-center shadow transition-colors ${labelMode ? 'bg-teal-500 border-teal-500 text-white' : 'bg-white/90 border-[#DDE1E7] text-slate-500 hover:bg-teal-50'}`}
                            title="Zemin Etiketleri"
                            onClick={() => setLabelMode(v => !v)}
                        >
                            𝐓
                        </button>
                    )}

                    {/* ─── Label Editor Panel ─── */}
                    {labelMode && isAdmin && (
                        <div className="absolute bottom-3 right-14 z-20 bg-white/95 border border-teal-300 rounded-xl shadow-xl p-4 w-80 max-h-[75vh] overflow-y-auto">
                            <div className="flex items-center justify-between mb-3">
                                <span className="font-bold text-sm text-teal-700">Zemin Etiketleri</span>
                                <button onClick={() => setLabelMode(false)} className="text-slate-400 hover:text-slate-600"><X size={14} /></button>
                            </div>
                            <p className="text-[10px] text-slate-500 mb-3">3D zeminde istediğin yere etiket ekle: Göl, Çevre Yolu, Kale vs.</p>
                            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                                {sceneLabels.map((lbl, i) => (
                                    <div key={lbl.id ?? i} className="border rounded p-2 space-y-1.5">
                                        <div className="flex gap-1">
                                            <input
                                                className="flex-1 border rounded px-2 py-1 text-xs font-medium"
                                                placeholder="Etiket metni"
                                                value={lbl.text}
                                                onChange={e => setSceneLabels(prev => prev.map((l, j) => j === i ? { ...l, text: e.target.value } : l))}
                                            />
                                            <input type="color" value={lbl.color} onChange={e => setSceneLabels(prev => prev.map((l, j) => j === i ? { ...l, color: e.target.value } : l))} className="w-8 h-7 border rounded cursor-pointer" />
                                        </div>
                                        <div className="grid grid-cols-4 gap-1">
                                            {[{ k: 'x', lb: 'X' }, { k: 'z', lb: 'Z' }, { k: 'rotation', lb: 'Açı' }, { k: 'scale', lb: 'Boyut' }].map(f => (
                                                <div key={f.k}>
                                                    <label className="text-[8px] text-slate-400 uppercase">{f.lb}</label>
                                                    <input
                                                        type="number" step={f.k === 'scale' ? 0.1 : f.k === 'rotation' ? 5 : 0.5}
                                                        value={(lbl as any)[f.k]}
                                                        onChange={e => setSceneLabels(prev => prev.map((l, j) => j === i ? { ...l, [f.k]: parseFloat(e.target.value) } : l))}
                                                        className="w-full border rounded px-1 py-1 text-xs font-mono"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex gap-1">
                                            <button className="flex-1 bg-teal-500 hover:bg-teal-600 text-white text-[10px] font-bold py-1 rounded"
                                                onClick={async () => {
                                                    if (lbl.id) {
                                                        await api.put(`/scene-labels/${lbl.id}`, { ...lbl, active_project_id: activeProject?.id });
                                                    } else {
                                                        const r = await api.post('/scene-labels', { ...lbl, active_project_id: activeProject?.id });
                                                        setSceneLabels(prev => prev.map((l, j) => j === i ? r.data : l));
                                                    }
                                                    // Refresh scene
                                                    setBlockConfigs(c => [...c]);
                                                    showToast('Etiket kaydedildi!');
                                                }}>Kaydet</button>
                                            <button className="bg-red-100 hover:bg-red-200 text-red-600 text-[10px] font-bold py-1 px-2 rounded"
                                                onClick={async () => {
                                                    if (lbl.id) await api.delete(`/scene-labels/${lbl.id}`);
                                                    setSceneLabels(prev => prev.filter((_, j) => j !== i));
                                                    setBlockConfigs(c => [...c]);
                                                }}>Sil</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button
                                className="mt-3 w-full border-2 border-dashed border-teal-300 text-teal-600 text-xs font-bold py-2 rounded-lg hover:bg-teal-50"
                                onClick={() => setSceneLabels(prev => [...prev, { text: 'Yeni Etiket', x: 0, z: 0, rotation: 0, color: '#1A6B9A', scale: 1.0 }])}
                            >
                                + Yeni Etiket
                            </button>
                        </div>
                    )}

                    {/* View Buttons */}
                    <div className="absolute top-3 right-3 flex flex-col md:flex-row flex-wrap gap-1.5 justify-end z-10 max-w-[150px] md:max-w-[400px]">
                        {[
                            { id: 'n', label: "Kuzey'den" },
                            { id: 's', label: "Güney'den" },
                            { id: 'e', label: "Doğu'dan" },
                            { id: 'w', label: "Batı'dan" },
                            { id: 'reset', label: "Sıfırla" },
                        ].map(v => (
                            <button
                                key={v.id}
                                className="bg-white/90 border border-[#DDE1E7] text-[#8892A0] px-2 md:px-3 py-1 md:py-1.5 text-[8px] md:text-[9px] tracking-[1.5px] uppercase rounded-[3px] hover:text-[#C8102E] hover:border-[#C8102E] transition-colors shadow-sm"
                                onClick={() => threeRef.current?.setView(v.id)}
                            >
                                {v.label}
                            </button>
                        ))}
                    </div>

                    {/* Stats Bar */}
                    <div className="absolute bottom-0 left-0 right-0 flex bg-white/95 border-t border-[#DDE1E7] z-10 w-full overflow-x-auto hide-scrollbar">
                        {[
                            { id: 'total', color: '#C8102E', label: 'Toplam', val: stats.total },
                            { id: 'available', color: '#27AE60', label: 'Açık', val: stats.available },
                            { id: 'sold', color: '#C8102E', label: 'Satıldı', val: stats.sold },
                            { id: 'reserved', color: '#E67E22', label: 'Rezerve', val: stats.reserved },
                            { id: 'not_for_sale', color: '#95A5A6', label: 'Kapalı', val: stats.closed },
                        ].map((st, i) => (
                            <div key={st.id} className={`flex-1 min-w-[60px] p-1.5 md:p-2.5 text-center ${i !== 4 ? 'border-r border-[#DDE1E7]' : ''}`}>
                                <div className="font-[Bebas_Neue] text-xl md:text-2xl leading-none" style={{ color: st.color }}>{st.val}</div>
                                <div className="text-[7px] md:text-[8px] tracking-[1.5px] uppercase text-[#8892A0] mt-[1px] md:mt-[2px] truncate px-1">{st.label}</div>
                            </div>
                        ))}
                    </div>

                    <div className="absolute bottom-12 md:bottom-16 left-1/2 -translate-x-1/2 text-[7px] md:text-[8px] tracking-[1.5px] uppercase text-[#8892A0] bg-white/90 px-3 py-1 md:px-4 md:py-1.5 border border-[#DDE1E7] rounded-full whitespace-nowrap pointer-events-none z-10 shadow-sm opacity-80 backdrop-blur-sm">
                        Tıkla: <span className="text-[#C8102E] font-bold">Detay</span> | Sürükle: Döndür
                    </div>

                </div>

                {/* SIDEBAR LIST (Desktop & Mobile Sheet) */}
                <div className={`${isMobileSidebarOpen ? 'translate-x-0' : 'translate-x-full'} md:translate-x-0 fixed md:relative z-40 top-[52px] md:top-0 right-0 bottom-0 md:h-auto w-[280px] md:w-[270px] bg-white border-l border-[#DDE1E7] flex flex-col shrink-0 transition-transform duration-300 shadow-2xl md:shadow-none`}>
                    <div className="p-[14px] md:p-[18px] border-b border-[#DDE1E7] flex items-center gap-2 relative">
                        <div className="font-[Bebas_Neue] text-base md:text-lg tracking-[3px] md:tracking-[4px] text-[#C8102E]">Daireler</div>
                        <div className="bg-[#fdeef1] text-[#C8102E] text-[9px] md:text-[10px] font-bold px-2 py-0.5 rounded-full">{filteredUnits.length}</div>
                        {isMobileSidebarOpen && (
                            <button
                                className="md:hidden absolute right-3 text-[#8892A0] p-1 bg-slate-100 rounded hover:bg-slate-200"
                                onClick={() => setIsMobileSidebarOpen(false)}
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>
                    <div className="p-2.5 md:p-3.5 border-b border-[#DDE1E7] flex gap-1.5 flex-wrap">
                        {['all', 'available', 'sold', 'reserved', 'not_for_sale'].map(f => (
                            <button
                                key={f}
                                className={`px-2 py-1 text-[8px] tracking-[1px] uppercase border rounded-full transition-colors ${listFilter === f ? 'border-[#C8102E] text-[#C8102E] bg-[#fdeef1]' : 'border-[#DDE1E7] text-[#8892A0] bg-transparent hover:border-[#C8102E] hover:text-[#C8102E] hover:bg-[#fdeef1]'}`}
                                onClick={() => setListFilter(f as any)}
                            >
                                {f === 'all' ? 'Tümü' : SL[f as Status]}
                            </button>
                        ))}
                    </div>
                    <div className="flex-1 overflow-y-auto w-full custom-scrollbar py-1">
                        {filteredUnits.map(u => (
                            <div
                                key={u.id}
                                id={`li-${u.id}`}
                                className={`p-3 border-b border-black/5 flex items-center gap-2.5 cursor-pointer transition-colors hover:bg-slate-50 ${selectedId === u.id ? 'bg-[#fdeef1] border-l-[3px] border-l-[#C8102E]' : ''}`}
                                onClick={() => {
                                    setSelectedId(u.id);
                                    if (isAdmin) {
                                        setEditForm({ ...u });
                                        setShowEdit(true);
                                    }
                                }}
                            >
                                <div className="w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: SC_CSS[u.status] }}></div>
                                <div className="text-[10px] font-bold tracking-[1px] min-w-[55px]">{u.id}</div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-[10px] text-[#444] whitespace-nowrap overflow-hidden text-ellipsis">{u.owner || '—'}</div>
                                    <div className="text-[8px] tracking-[1px] uppercase mt-0.5" style={{ color: SC_CSS[u.status] }}>{SL[u.status]}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* TOOLTIP */}
            <div
                className={`fixed pointer-events-none z-[2000] bg-white border border-[#DDE1E7] border-l-[3px] border-l-[#C8102E] px-3 md:px-3.5 py-2 md:py-2.5 rounded shadow-[0_4px_16px_rgba(0,0,0,0.12)] transition-opacity duration-100 min-w-[150px] md:min-w-[180px] ${hoverId && !showEdit ? 'opacity-100' : 'opacity-0'}`}
                style={{ left: tooltipPos.x + 16, top: tooltipPos.y - 8 }}
            >
                {hoverId && data[hoverId] && (
                    <>
                        <div className="font-bold tracking-[1.5px] text-[#C8102E] text-[10px] md:text-[12px] mb-1">{hoverId} — {data[hoverId].fi === 0 ? 'Zemin Kat' : data[hoverId].fl + '. Kat'}</div>
                        <div className="text-[8px] md:text-[9px] tracking-[1.5px] uppercase" style={{ color: SC_CSS[data[hoverId].status] }}>{SL[data[hoverId].status]}</div>
                        <div className="text-[#8892A0] text-[8px] md:text-[10px] mt-1.5 leading-[1.6]">
                            {data[hoverId].cephe}<br />
                            {data[hoverId].owner && <>Alıcı: <span className="text-[#444]">{data[hoverId].owner}</span><br /></>}
                            {data[hoverId].phone && <>Tel: <span className="text-[#444]">{data[hoverId].phone}</span><br /></>}
                            {data[hoverId].note && <>Not: <span className="text-[#444]">{data[hoverId].note}</span></>}
                        </div>
                    </>
                )}
            </div>

            {showEdit && selectedId && data[selectedId] && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-[5px] z-[3000] flex items-center justify-center p-4">
                    <div className="bg-white border border-[#DDE1E7] border-t-[3px] border-t-[#C8102E] w-[410px] max-w-[95vw] rounded-md shadow-[0_20px_50px_rgba(0,0,0,0.15)] animate-in fade-in slide-in-from-bottom-2 flex flex-col max-h-[90vh]">
                        <div className="px-5 py-4 border-b border-[#DDE1E7] flex justify-between items-start shrink-0">
                            <div>
                                <div className="font-[Bebas_Neue] text-xl md:text-2xl tracking-[4px] text-[#C8102E]">Daire {selectedId}</div>
                                <div className="text-[8px] md:text-[9px] tracking-[2px] text-[#8892A0] mt-[2px] uppercase">Blok {data[selectedId].block} · {data[selectedId].fi === 0 ? 'Zemin Kat' : data[selectedId].fl + '. Kat'} · {data[selectedId].cephe}</div>
                            </div>
                            <button className="text-[#8892A0] hover:text-[#C8102E] p-1 -mt-1 -mr-2" onClick={() => setShowEdit(false)}><X size={20} /></button>
                        </div>
                        <div className="p-5 overflow-y-auto">
                            <div className="mb-3.5">
                                <label className="block text-[8px] tracking-[3px] uppercase text-[#8892A0] mb-1.5">Durum</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {['available', 'sold', 'reserved', 'not_for_sale'].map(s => (
                                        <div
                                            key={s}
                                            className={`px-3 py-2.5 border cursor-pointer flex items-center gap-2 text-[10px] md:text-[11px] rounded-[3px] transition-colors ${editForm.status === s ? 'border-[#C8102E] bg-[#fdeef1]' : 'border-[#DDE1E7] bg-[#f7f8fa] hover:border-[#bbb] hover:bg-white'}`}
                                            onClick={() => setEditForm(prev => ({ ...prev, status: s as Status }))}
                                        >
                                            <div className="w-2.5 h-2.5 rounded-[2px]" style={{ backgroundColor: SC_CSS[s as Status] }}></div>
                                            {SL[s as Status]}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="mb-3.5">
                                <label className="block text-[8px] tracking-[3px] uppercase text-[#8892A0] mb-1.5 flex items-center gap-1">
                                    <UserPlus size={10} /> Müşteri Ata
                                </label>
                                <select
                                    className="w-full bg-[#f7f8fa] border border-[#DDE1E7] text-[#1a1a2e] px-3 py-2 text-[12px] rounded-[3px] outline-none focus:border-[#C8102E] focus:bg-white transition-colors appearance-none"
                                    value={editForm.customer_id || ''}
                                    onChange={e => {
                                        const cid = e.target.value ? Number(e.target.value) : undefined;
                                        const c = customers.find(x => x.id === cid);
                                        setEditForm(prev => ({
                                            ...prev,
                                            customer_id: cid,
                                            owner: c ? (c.first_name ? `${c.first_name} ${c.last_name || ''}` : c.company_name) : prev.owner,
                                            phone: c ? c.phone : prev.phone
                                        }));
                                    }}
                                >
                                    <option value="">-- Müşteri Seçin --</option>
                                    {customers.map(c => (
                                        <option key={c.id} value={c.id}>
                                            {c.first_name ? `${c.first_name} ${c.last_name || ''}` : c.company_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="mb-3.5">
                                <label className="block text-[8px] tracking-[3px] uppercase text-[#8892A0] mb-1.5">Manuel Alıcı Adı / Firma</label>
                                <input
                                    type="text"
                                    className="w-full bg-[#f7f8fa] border border-[#DDE1E7] text-[#1a1a2e] px-3 py-2 text-[12px] rounded-[3px] outline-none focus:border-[#C8102E] focus:bg-white transition-colors"
                                    placeholder="Manuel isim giriniz..."
                                    value={editForm.owner || ''}
                                    onChange={e => setEditForm(prev => ({ ...prev, owner: e.target.value }))}
                                />
                            </div>
                            <div className="mb-3.5">
                                <label className="block text-[8px] tracking-[3px] uppercase text-[#8892A0] mb-1.5">Telefon</label>
                                <input
                                    type="text"
                                    className="w-full bg-[#f7f8fa] border border-[#DDE1E7] text-[#1a1a2e] px-3 py-2 text-[12px] rounded-[3px] outline-none focus:border-[#C8102E] focus:bg-white transition-colors"
                                    placeholder="05xx xxx xx xx"
                                    value={editForm.phone || ''}
                                    onChange={e => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                                />
                            </div>
                            <div className="mb-3.5">
                                <label className="block text-[8px] tracking-[3px] uppercase text-[#8892A0] mb-1.5">Not</label>
                                <input
                                    type="text"
                                    className="w-full bg-[#f7f8fa] border border-[#DDE1E7] text-[#1a1a2e] px-3 py-2 text-[12px] rounded-[3px] outline-none focus:border-[#C8102E] focus:bg-white transition-colors"
                                    placeholder="Ek bilgi..."
                                    value={editForm.note || ''}
                                    onChange={e => setEditForm(prev => ({ ...prev, note: e.target.value }))}
                                />
                            </div>
                        </div>
                        <div className="p-5 pt-3 border-t border-[#DDE1E7] flex gap-2 shrink-0">
                            <button className="flex-1 bg-transparent text-[#8892A0] border border-[#DDE1E7] py-2.5 text-[10px] md:text-[11px] font-semibold tracking-[2px] uppercase rounded-[3px] hover:text-[#1a1a2e] transition-colors" onClick={() => setShowEdit(false)}>İptal</button>
                            <button className="flex-[1.5] bg-[#C8102E] hover:bg-[#E8294A] text-white py-2.5 text-[10px] md:text-[11px] font-bold tracking-[2px] uppercase rounded-[3px] transition-colors" onClick={saveUnit}>Kaydet</button>
                        </div>
                    </div>
                </div>
            )}

            {/* TOAST */}
            <div className={`fixed bottom-5 right-5 z-[4000] bg-white border-l-[3px] border-l-[#C8102E] text-[#1a1a2e] px-4 py-3 text-[11px] md:text-[12px] font-medium rounded shadow-[0_4px_16px_rgba(0,0,0,0.12)] transition-all duration-300 pointer-events-none ${toastMsg ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
                {toastMsg}
            </div>

        </div>
    );
}
