
const page = document.querySelector(".home-page");
const section = document.querySelector(".matcha-journey");
const sticky = document.querySelector(".matcha-journey__sticky");
const canvasHost = document.querySelector("#matcha-3d-canvas");
const greenMenu = document.querySelector(".matcha-green");

const header = greenMenu?.querySelector(".header");
const content = greenMenu?.querySelector(".hero-content");
const scrollCue = document.querySelector(".scroll-cue");
const fallbackImage = canvasHost?.querySelector(
    ".matcha-3d__fallback"
);

if (
    page &&
    section &&
    sticky &&
    canvasHost &&
    greenMenu &&
    header &&
    content
) {
    greenMenu.inert = true;

    // Fallback when 3D is unavailable
    function showFallback() {
        page.classList.add("is-fallback");

        greenMenu.inert = false;
        greenMenu.style.opacity = "1";
        header.style.opacity = "1";
        content.style.opacity = "1";
    }

    const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    ).matches;

    if (reducedMotion) {
        showFallback();
    } else {
        import(
            "https://cdn.jsdelivr.net/npm/three@0.186.1/build/three.module.js"
        )
            .then((THREE) => init3D(THREE))
            .catch((error) => {
                console.warn("Three.js could not start:", error);
                showFallback();
            });
    }

    function init3D(THREE) {

        // RENDERER

        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            powerPreference: "low-power"
        });

        renderer.setPixelRatio(
            Math.min(window.devicePixelRatio || 1, 1.6)
        );

        renderer.setClearColor(0xfbfbf7, 0);
        renderer.outputColorSpace = THREE.SRGBColorSpace;

        canvasHost.appendChild(renderer.domElement);

        // SCENE AND CAMERA

        const scene = new THREE.Scene();

        const camera = new THREE.PerspectiveCamera(
            40,
            1,
            0.1,
            100
        );

        // LIGHTS

        scene.add(
            new THREE.AmbientLight(0xffffff, 2)
        );

        const mainLight = new THREE.DirectionalLight(
            0xffffff,
            3
        );

        mainLight.position.set(-3, 7, 6);
        scene.add(mainLight);

        const fillLight = new THREE.DirectionalLight(
            0xd8f0c0,
            1.4
        );

        fillLight.position.set(4, 2, -3);
        scene.add(fillLight);

        // CUP

        const cup = new THREE.Group();
        scene.add(cup);

        const ceramic = new THREE.MeshStandardMaterial({
            color: 0xf1ede2,
            roughness: 0.42,
            side: THREE.DoubleSide
        });

        const cupProfile = [
            [0, 0],
            [0.94, 0],
            [1.06, 0.1],
            [1.32, 1.64],
            [1.38, 1.8],
            [1.24, 1.8],
            [1.13, 1.62],
            [0.92, 0.2],
            [0, 0.2]
        ].map(([x, y]) => new THREE.Vector2(x, y));

        cup.add(
            new THREE.Mesh(
                new THREE.LatheGeometry(cupProfile, 80),
                ceramic
            )
        );

        // CUP RIM

        const rim = new THREE.Mesh(
            new THREE.TorusGeometry(
                1.31,
                0.065,
                12,
                100
            ),
            ceramic
        );

        rim.rotation.x = Math.PI / 2;
        rim.position.y = 1.8;
        cup.add(rim);

        // HANDLE

        const handlePath = new THREE.CatmullRomCurve3([
            new THREE.Vector3(1.31, 1.5, 0),
            new THREE.Vector3(1.9, 1.6, 0),
            new THREE.Vector3(2.32, 1.18, 0),
            new THREE.Vector3(2.13, 0.68, 0),
            new THREE.Vector3(1.23, 0.59, 0)
        ]);

        cup.add(
            new THREE.Mesh(
                new THREE.TubeGeometry(
                    handlePath,
                    64,
                    0.14,
                    12,
                    false
                ),
                ceramic
            )
        );

        // MATCHA LIQUID

        const matcha = new THREE.Mesh(
            new THREE.SphereGeometry(1, 64, 32),
            new THREE.MeshStandardMaterial({
                color: 0x4b970b,
                roughness: 0.28
            })
        );

        matcha.scale.set(1.15, 0.045, 1.15);
        matcha.position.y = 1.68;
        cup.add(matcha);

        // FOAM

        const foamMaterial = new THREE.MeshStandardMaterial({
            color: 0x9bc16b,
            roughness: 0.8
        });

        const foamGeometry = new THREE.SphereGeometry(
            0.022,
            8,
            8
        );

        for (let i = 0; i < 24; i++) {

            const angle = i * 2.39996;
            const radius = 0.12 + (i % 7) * 0.115;

            const foam = new THREE.Mesh(
                foamGeometry,
                foamMaterial
            );

            foam.position.set(
                Math.cos(angle) * radius,
                1.729,
                Math.sin(angle) * radius
            );

            cup.add(foam);
        }

        // CERAMIC ACCENT

        const accent = new THREE.Mesh(
            new THREE.TorusGeometry(
                1.19,
                0.018,
                8,
                100
            ),
            new THREE.MeshStandardMaterial({
                color: 0x637d42,
                roughness: 0.55
            })
        );

        accent.rotation.x = Math.PI / 2;
        accent.position.y = 0.95;
        cup.add(accent);

        // HELPERS

        const clamp = (n) => Math.max(0, Math.min(1, n));

        const ease = (n) => {
            const t = clamp(n);
            return t * t * (3 - 2 * t);
        };

        const mix = (a, b, t) => a + (b - a) * t;

        let targetProgress = 0;
        let currentProgress = 0;
        let frameId = 0;

        // RESIZE

        function resize() {

            const width = canvasHost.clientWidth;
            const height = canvasHost.clientHeight;

            if (!width || !height) return;

            camera.aspect = width / height;
            camera.updateProjectionMatrix();

            renderer.setSize(width, height, false);
        }

        // MAIN SCROLL ANIMATION

        function draw() {

            currentProgress += (
                targetProgress - currentProgress
            ) * 0.12;

            if (
                Math.abs(targetProgress - currentProgress) < 0.0005
            ) {
                currentProgress = targetProgress;
            }

            const p = currentProgress;
            const mobile = window.innerWidth < 700;

            // Zoom into the tea
            const zoom = ease((p - 0.04) / 0.72);

            const initialScale = mobile ? 1.05 : 1.65;

            const scale = mix(
                initialScale,
                mobile ? 7.5 : 10,
                zoom
            );

            cup.scale.setScalar(scale);

            // Keep the matcha surface in focus
            cup.position.set(
                0,
                1.05 - 1.68 * scale,
                0
            );

            // Subtle cup rotation
            cup.rotation.y = mix(-0.35, 0.28, zoom);

            cup.rotation.z =
                -0.035 * Math.sin(zoom * Math.PI);

            // Camera moves above and into the matcha
            camera.position.set(
                0,
                mix(4.8, 8.6, zoom),
                mix(mobile ? 13 : 11.5, 0.2, zoom)
            );

            camera.lookAt(
                0,
                mix(0.25, 1.05, zoom),
                0
            );

            // The tea becomes the green homepage
            const greenOpacity = ease(
                (p - 0.62) / 0.22
            );

            const textOpacity = ease(
                (p - 0.80) / 0.17
            );

            greenMenu.style.opacity = String(greenOpacity);
            header.style.opacity = String(textOpacity);
            content.style.opacity = String(textOpacity);

            // Links work only after the transition
            const ready = p >= 0.97;

            greenMenu.inert = !ready;

            greenMenu.style.pointerEvents =
                ready ? "auto" : "none";

            // Hide scroll hint
            if (scrollCue) {

                scrollCue.style.opacity = String(
                    1 - ease(p / 0.15)
                );

                scrollCue.style.pointerEvents =
                    p < 0.1 ? "auto" : "none";

                scrollCue.inert = p >= 0.1;
            }

            renderer.render(scene, camera);

            frameId = 0;

            if (currentProgress !== targetProgress) {
                requestDraw();
            }
        }

        function requestDraw() {
            if (!frameId) {
                frameId = requestAnimationFrame(draw);
            }
        }

        function updateScroll() {

            const rect = section.getBoundingClientRect();

            const distance = Math.max(
                1,
                section.offsetHeight - sticky.clientHeight
            );

            targetProgress = clamp(
                -rect.top / distance
            );

            requestDraw();
        }

        // START

        resize();

        if (fallbackImage) {
            fallbackImage.hidden = true;
        }

        updateScroll();

        // Click on scroll hint
        scrollCue?.addEventListener("click", () => {

            const endY =
                window.scrollY +
                section.getBoundingClientRect().top +
                section.offsetHeight -
                sticky.clientHeight;

            window.scrollTo({
                top: endY,
                behavior: "smooth"
            });
        });

        window.addEventListener(
            "scroll",
            updateScroll,
            { passive: true }
        );

        window.addEventListener("resize", () => {
            resize();
            updateScroll();
        });
    }
}
