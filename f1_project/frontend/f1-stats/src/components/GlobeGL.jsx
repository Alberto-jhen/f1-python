import { useEffect, useRef, useState } from 'react';
import Globe from 'globe.gl';

export function GlobeGL({ markers, onMarkerClick, config }) {
  const containerRef = useRef(null);
  const globeRef = useRef(null);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    const timeout = setTimeout(() => {
      setStatus((current) => (current === 'loading' ? 'timeout' : current));
    }, 5000);

    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      setTimeout(() => setStatus('timeout'), 0);
      return;
    }

    try {
      const globeInstance = Globe();
      const globe = globeInstance(containerRef.current)
        .width(rect.width)
        .height(rect.height)
        .globeImageUrl('https://unpkg.com/three-globe@2.24.13/example/img/earth-night.jpg')
        .backgroundColor('rgba(0,0,0,0)')
        .showAtmosphere(true)
        .showGlobe(true)
        .atmosphereColor(config.atmosphereColor || '#ffffff')
        .atmosphereAltitude(config.atmosphereAltitude || 0.1)
        .onGlobeReady(() => setStatus('ready'))
        .labelsData(markers)
        .labelLat((d) => d.lat)
        .labelLng((d) => d.lng)
        .labelText((d) => d.label)
        .labelSize((d) => d.size || 1.4)
        .labelDotRadius((d) => d.dotRadius || 0.5)
        .labelColor((d) => d.color || '#ffffff')
        .labelAltitude((d) => d.altitude || 0.02)
        .onLabelClick((d) => {
          if (typeof onMarkerClick === 'function') {
            onMarkerClick(d);
          }
        });

      globeRef.current = globe;

      const handleResize = () => {
        if (!containerRef.current || !globeRef.current) return;
        const newRect = containerRef.current.getBoundingClientRect();
        globeRef.current.width(newRect.width).height(newRect.height);
      };

      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        if (globeRef.current) {
          globeRef.current._destructor();
          globeRef.current = null;
        }
      };
    } catch (error) {
      console.error('GlobeGL init error:', error);
      setTimeout(() => setStatus('error'), 0);
    }

    return () => {
      if (globeRef.current) {
        globeRef.current._destructor();
        globeRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!globeRef.current) return;
    globeRef.current.labelsData(markers);
  }, [markers]);

  return (
    <div className='relative w-full h-full'>
      <div ref={containerRef} className='absolute inset-0 w-full h-full' />
      {status === 'loading' && (
        <div className='absolute inset-0 flex items-center justify-center text-zinc-500 text-xs uppercase tracking-widest'>
          Loading globe...
        </div>
      )}
      {status === 'error' && (
        <div className='absolute inset-0 flex items-center justify-center text-red-500 text-xs uppercase tracking-widest'>
          Failed to load globe
        </div>
      )}
      {status === 'timeout' && (
        <div className='absolute inset-0 flex items-center justify-center text-yellow-500 text-xs uppercase tracking-widest'>
          Globe init timed out
        </div>
      )}
    </div>
  );
}
