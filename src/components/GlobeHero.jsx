import { useEffect, useRef, useState } from "react";
import Globe from "globe.gl";

export default function GlobeHero() {
  const containerRef = useRef(null);
  const globeRef = useRef(null);
  const frameRef = useRef(null);
  const destroyedRef = useRef(false);

  const [webglError, setWebglError] = useState(false);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) return;

    destroyedRef.current = false;

    let resizeObserver = null;
    let initialized = false;

    // --------------------------------------------------
    // CLEANUP
    // --------------------------------------------------
    const cleanupGlobe = () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }

      if (resizeObserver) {
        resizeObserver.disconnect();
        resizeObserver = null;
      }

      const globe = globeRef.current;

      if (globe) {
        try {
          // globe.gl internal cleanup
          globe._destructor?.();
        } catch (error) {
          console.warn("[GlobeHero] Globe cleanup warning:", error);
        }

        globeRef.current = null;
      }

      // Remove anything left behind by globe.gl
      if (container) {
        container.innerHTML = "";
      }

      initialized = false;
    };

    // --------------------------------------------------
    // WEBGL CONTEXT TEST
    // --------------------------------------------------
    const canCreateWebGL = () => {
      try {
        const testCanvas = document.createElement("canvas");

        const context =
          testCanvas.getContext("webgl2") ||
          testCanvas.getContext("webgl") ||
          testCanvas.getContext("experimental-webgl");

        if (!context) {
          console.warn("[GlobeHero] WebGL is not available.");
          return false;
        }

        return true;
      } catch (error) {
        console.error("[GlobeHero] WebGL test failed:", error);
        return false;
      }
    };

    // --------------------------------------------------
    // INITIALIZE
    // --------------------------------------------------
    const init = () => {
      if (destroyedRef.current || initialized) {
        return;
      }

      const { width, height } = container.getBoundingClientRect();

      // Wait until the hero actually has dimensions
      if (width <= 0 || height <= 0) {
        frameRef.current = requestAnimationFrame(init);
        return;
      }

      // Check WebGL before globe.gl attempts to create
      // THREE.WebGLRenderer
      if (!canCreateWebGL()) {
        setWebglError(true);
        return;
      }

      try {
        console.log("[GlobeHero] Initializing...", {
          width,
          height,
        });

        // --------------------------------------------------
        // CREATE GLOBE
        // --------------------------------------------------
        const globe = Globe()(container)
          .width(width)
          .height(height)
          .backgroundColor("rgba(0,0,0,0)")
          .globeImageUrl(
            "https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-dark.jpg"
          )
          .showAtmosphere(true)
          .atmosphereColor("#ff6b00")
          .atmosphereAltitude(0.22)
          .hexPolygonsData([])
          .hexPolygonResolution(3)
          .hexPolygonMargin(0.3)
          .hexPolygonUseDots(true)
          .hexPolygonAltitude(0.01)
          .hexPolygonColor(() => "#ff6b00");

        if (destroyedRef.current) {
          try {
            globe._destructor?.();
          } catch {
            // Ignore cleanup errors during unmount
          }

          return;
        }

        globeRef.current = globe;
        initialized = true;

        // --------------------------------------------------
        // LOAD COUNTRY DATA
        // --------------------------------------------------
        fetch(
          "https://cdn.jsdelivr.net/gh/vasturiano/globe.gl@master/example/datasets/ne_110m_admin_0_countries.geojson"
        )
          .then((res) => {
            if (!res.ok) {
              throw new Error("Could not load country data");
            }

            return res.json();
          })
          .then((countries) => {
            if (
              !destroyedRef.current &&
              globeRef.current === globe
            ) {
              globe.hexPolygonsData(countries.features);
            }
          })
          .catch((error) => {
            if (!destroyedRef.current) {
              console.error(
                "[GlobeHero] Country data error:",
                error
              );
            }
          });

        // --------------------------------------------------
        // CAMERA
        // --------------------------------------------------
        globe.pointOfView(
          {
            lat: 20,
            lng: 78,
            altitude: 1.65,
          },
          0
        );

        // --------------------------------------------------
        // CONTROLS
        // --------------------------------------------------
        const controls = globe.controls();

        controls.enableZoom = false;
        controls.enablePan = false;
        controls.enableRotate = false;

        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.35;

        // --------------------------------------------------
        // CANVAS
        // --------------------------------------------------
        const renderer = globe.renderer();

        if (!renderer) {
          throw new Error("Globe renderer was not created.");
        }

        const canvas = renderer.domElement;

        if (!canvas) {
          throw new Error("Globe canvas was not created.");
        }

        canvas.style.position = "absolute";
        canvas.style.left = "50%";
        canvas.style.top = "50%";

        canvas.style.width = "65vw";
        canvas.style.height = "65vw";

        canvas.style.maxWidth = "none";
        canvas.style.maxHeight = "none";

        canvas.style.transform = "translate(-50%, -50%)";

        canvas.style.pointerEvents = "none";

        // --------------------------------------------------
        // HANDLE WEBGL CONTEXT LOSS
        // --------------------------------------------------
        const handleContextLost = (event) => {
          event.preventDefault();

          console.warn(
            "[GlobeHero] WebGL context lost."
          );

          setWebglError(true);
        };

        canvas.addEventListener(
          "webglcontextlost",
          handleContextLost,
          false
        );

        // Store cleanup for the canvas event
        canvas.__globeContextCleanup = () => {
          canvas.removeEventListener(
            "webglcontextlost",
            handleContextLost
          );
        };

        console.log("[GlobeHero] Mounted successfully.", {
          width,
          height,
          canvas,
        });
      } catch (error) {
        console.error(
          "[GlobeHero] Failed to create globe:",
          error
        );

        setWebglError(true);

        // Important:
        // If Globe() partially created something before throwing,
        // remove it.
        try {
          globeRef.current?._destructor?.();
        } catch {
          // Ignore cleanup errors
        }

        globeRef.current = null;

        container.innerHTML = "";
        initialized = false;
      }
    };

    // --------------------------------------------------
    // START
    // --------------------------------------------------
    init();

    // --------------------------------------------------
    // RESIZE OBSERVER
    // --------------------------------------------------
    resizeObserver = new ResizeObserver((entries) => {
      if (destroyedRef.current) return;

      const entry = entries[0];

      if (!entry || !globeRef.current) return;

      const { width, height } = entry.contentRect;

      if (width <= 0 || height <= 0) {
        return;
      }

      try {
        globeRef.current.width(width);
        globeRef.current.height(height);
      } catch (error) {
        console.warn(
          "[GlobeHero] Resize error:",
          error
        );
      }
    });

    resizeObserver.observe(container);

    // --------------------------------------------------
    // CLEANUP ON UNMOUNT
    // --------------------------------------------------
    return () => {
      destroyedRef.current = true;

      const canvas = globeRef.current?.renderer?.()
        ?.domElement;

      if (canvas?.__globeContextCleanup) {
        canvas.__globeContextCleanup();
        delete canvas.__globeContextCleanup;
      }

      cleanupGlobe();
    };
  }, []);

  // --------------------------------------------------
  // FALLBACK
  // --------------------------------------------------
  if (webglError) {
    return (
      <div
        ref={containerRef}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          background: "transparent",
          overflow: "visible",
        }}
      >
        {/* 
          Keep the hero area alive even when WebGL
          cannot be initialized.
        */}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        background: "transparent",
        overflow: "visible",
      }}
    />
  );
}