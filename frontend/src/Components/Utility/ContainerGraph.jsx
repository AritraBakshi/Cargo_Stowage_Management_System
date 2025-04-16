import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

export default function Container3DView({ container }) {
  const mountRef = useRef(null);

  useEffect(() => {
    if (!container) return;

    // Basic setup
    const scene = new THREE.Scene();
    const width = mountRef.current.clientWidth;
    const height = 400;
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    mountRef.current.innerHTML = ""; // Clear previous render
    mountRef.current.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(1, 1, 1);
    scene.add(ambientLight, directionalLight);

    // Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;

    // Draw container (wireframe box)
    const { width: w, height: h, depth: d } = container.dimensions;
    const containerGeometry = new THREE.BoxGeometry(w, h, d);
    const containerMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      wireframe: true,
    });
    const containerMesh = new THREE.Mesh(containerGeometry, containerMaterial);
    containerMesh.position.set(0, 0, 0);
    scene.add(containerMesh);

    // Draw items
    container.items.forEach((item, i) => {
      const s = item.position.start_coordinates;
      const e = item.position.end_coordinates;

      const itemW = e.width - s.width;
      const itemD = e.depth - s.depth;
      const itemH = e.height - s.height;

      const itemGeometry = new THREE.BoxGeometry(itemW, itemH, itemD);
      const itemMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(`hsl(${(i * 50) % 360}, 70%, 60%)`),
      });

      const itemMesh = new THREE.Mesh(itemGeometry, itemMaterial);

      // Position item from container center
      itemMesh.position.set(
        s.width + itemW / 2 - w / 2,
        s.height + itemH / 2 - h / 2,
        s.depth + itemD / 2 - d / 2
      );

      scene.add(itemMesh);
    });

    // Camera position
    camera.position.set(w, h, d);
    camera.lookAt(0, 0, 0);

    // Render loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      renderer.dispose();
      controls.dispose();
    };
  }, [container]);

  return <div ref={mountRef} className="w-full h-[400px] rounded border" />;
}
