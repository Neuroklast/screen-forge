import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
export function isModelAsset(asset: { type: string; name: string }) {
  return (
    /\.(glb|gltf)$/i.test(asset.name) || /gltf|model\//i.test(asset.type)
  );
}
export function ModelViewport({
  time,
  url,
  accent,
  className,
}: {
  time: number;
  url?: string;
  accent: string;
  className?: string;
}) {
  const host = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    pivot: THREE.Group;
    placeholder: THREE.Object3D;
  } | null>(null);
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 80);
    camera.position.set(0, 0.35, 4.2);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);
    const pivot = new THREE.Group();
    scene.add(pivot);
    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const key = new THREE.DirectionalLight(0xffffff, 1.1);
    key.position.set(2.4, 3.2, 4);
    scene.add(key);
    const rim = new THREE.DirectionalLight(accent, 0.7);
    rim.position.set(-3, -1, -2);
    scene.add(rim);
    const placeholder = new THREE.Group();
    const shell = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1, 0),
      new THREE.MeshStandardMaterial({
        color: accent,
        metalness: 0.35,
        roughness: 0.28,
        transparent: true,
        opacity: 0.22,
      }),
    );
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(1, 0)),
      new THREE.LineBasicMaterial({ color: accent }),
    );
    placeholder.add(shell, edges);
    pivot.add(placeholder);
    sceneRef.current = { renderer, scene, camera, pivot, placeholder };
    const fit = () => {
      const w = el.clientWidth || 1,
        h = el.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(el);
    return () => {
      observer.disconnect();
      pivot.clear();
      renderer.dispose();
      renderer.domElement.remove();
      sceneRef.current = null;
    };
  }, [accent]);
  useEffect(() => {
    const ctx = sceneRef.current;
    if (!ctx) return;
    ctx.pivot.children
      .filter((child) => child !== ctx.placeholder)
      .forEach((child) => ctx.pivot.remove(child));
    ctx.placeholder.visible = !url;
    if (!url) return;
    const loader = new GLTFLoader();
    let cancelled = false;
    loader.load(
      url,
      (gltf) => {
        if (cancelled || !sceneRef.current) return;
        ctx.placeholder.visible = false;
        const model = gltf.scene;
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3()).length() || 1;
        const center = box.getCenter(new THREE.Vector3());
        model.position.sub(center);
        model.scale.setScalar(2.2 / size);
        ctx.pivot.add(model);
      },
      undefined,
      () => {
        if (!cancelled && sceneRef.current) ctx.placeholder.visible = true;
      },
    );
    return () => {
      cancelled = true;
    };
  }, [url]);
  useEffect(() => {
    const ctx = sceneRef.current;
    if (!ctx) return;
    ctx.pivot.rotation.set(time * 0.18, time * 0.42, time * 0.07);
    ctx.renderer.render(ctx.scene, ctx.camera);
  }, [time, url]);
  return (
    <div
      ref={host}
      className={className ?? "model-viewport"}
      aria-label="Spatial model viewport"
    />
  );
}
