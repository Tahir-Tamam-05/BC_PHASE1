import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-draw';
import { Button } from '@/components/ui/button';
import { MapPin, Trash2, Info, PenTool } from 'lucide-react';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface LatLng {
  lat: number;
  lng: number;
}

interface GISLandMapProps {
  onBoundaryChange: (boundary: LatLng[], area: number) => void;
  initialBoundary?: LatLng[];
  readOnly?: boolean;
  className?: string;
}

function calculatePolygonArea(coords: LatLng[]): number {
  if (coords.length < 3) return 0;
  
  const toRadians = (deg: number) => (deg * Math.PI) / 180;
  const earthRadius = 6371000;
  
  let total = 0;
  const n = coords.length;
  
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const xi = toRadians(coords[i].lng);
    const yi = toRadians(coords[i].lat);
    const xj = toRadians(coords[j].lng);
    const yj = toRadians(coords[j].lat);
    
    total += (xj - xi) * (2 + Math.sin(yi) + Math.sin(yj));
  }
  
  const areaM2 = Math.abs((total * earthRadius * earthRadius) / 2);
  const areaHectares = areaM2 / 10000;
  
  return Math.round(areaHectares * 100) / 100;
}

export default function GISLandMap({ onBoundaryChange, initialBoundary, readOnly = false, className = '' }: GISLandMapProps) {
  const [boundary, setBoundary] = useState<LatLng[]>(initialBoundary || []);
  const [area, setArea] = useState<number>(0);
  const [isDrawing, setIsDrawing] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const drawnLayerRef = useRef<L.FeatureGroup | null>(null);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    if (initialBoundary && initialBoundary.length > 0) {
      setBoundary(initialBoundary);
      const calculatedArea = calculatePolygonArea(initialBoundary);
      setArea(calculatedArea);
    }
  }, [initialBoundary]);

  useEffect(() => {
    if (!mapContainerRef.current || isInitializedRef.current) return;
    isInitializedRef.current = true;

    const map = L.map(mapContainerRef.current, {
      center: [0, 0],
      zoom: 2,
      scrollWheelZoom: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);
    drawnLayerRef.current = drawnItems;
    mapRef.current = map;

    if (!readOnly) {
      const drawControl = new (L.Control as any).Draw({
        position: 'topright',
        draw: {
          polygon: {
            allowIntersection: false,
            drawError: {
              color: '#e1e1e1',
              message: '<strong>Error:</strong> Shape edges cannot cross!',
            },
            shapeOptions: {
              color: '#10b981',
              fillColor: '#10b981',
              fillOpacity: 0.3,
              weight: 2,
            },
          },
          rectangle: false,
          circle: false,
          circlemarker: false,
          marker: false,
          polyline: false,
        },
        edit: false,
      });
      map.addControl(drawControl);

      map.on((L as any).Draw.Event.CREATED, (e: any) => {
        const layer = e.layer;
        drawnItems.clearLayers();
        drawnItems.addLayer(layer);

        const latLngs = layer.getLatLngs()[0] as L.LatLng[];
        const coords = latLngs.map((ll: L.LatLng) => ({ lat: ll.lat, lng: ll.lng }));
        
        setBoundary(coords);
        const calculatedArea = calculatePolygonArea(coords);
        setArea(calculatedArea);
        onBoundaryChange(coords, calculatedArea);
        setIsDrawing(false);
      });

      map.on((L as any).Draw.Event.DRAWSTART, () => {
        setIsDrawing(true);
      });

      map.on((L as any).Draw.Event.DRAWSTOP, () => {
        setIsDrawing(false);
      });
    }

    if (initialBoundary && initialBoundary.length > 0) {
      const latLngs = initialBoundary.map(p => [p.lat, p.lng] as [number, number]);
      const polygon = L.polygon(latLngs, {
        color: '#10b981',
        fillColor: '#10b981',
        fillOpacity: 0.3,
        weight: 2,
      });
      drawnItems.addLayer(polygon);
      
      const bounds = L.latLngBounds(latLngs);
      map.fitBounds(bounds, { padding: [50, 50] });
    }

    return () => {
      map.remove();
      mapRef.current = null;
      isInitializedRef.current = false;
    };
  }, [readOnly, onBoundaryChange, initialBoundary]);

  const clearBoundary = useCallback(() => {
    if (drawnLayerRef.current) {
      drawnLayerRef.current.clearLayers();
    }
    setBoundary([]);
    setArea(0);
    onBoundaryChange([], 0);
  }, [onBoundaryChange]);

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="w-4 h-4" />
          <span>{readOnly ? 'Land boundary visualization' : 'Draw your land boundary on the map'}</span>
        </div>
        {!readOnly && boundary.length > 0 && (
          <Button type="button" variant="outline" size="sm" onClick={clearBoundary}>
            <Trash2 className="w-4 h-4 mr-1" />
            Clear & Redraw
          </Button>
        )}
      </div>

      <div 
        ref={mapContainerRef}
        className="relative rounded-lg overflow-hidden border" 
        style={{ height: '400px', width: '100%' }}
      />

      {area > 0 && (
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Info className="w-4 h-4 text-primary" />
            <span className="font-semibold text-primary">Calculated Land Area</span>
          </div>
          <p className="text-2xl font-bold text-primary">{area.toFixed(2)} hectares</p>
          <p className="text-xs text-muted-foreground mt-1">
            Area automatically calculated from drawn polygon boundaries
          </p>
        </div>
      )}

      {!readOnly && boundary.length === 0 && !isDrawing && (
        <div className="bg-muted/50 border rounded-lg p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <PenTool className="w-4 h-4 text-primary" />
            <span className="font-medium">How to draw your land boundary:</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Click the polygon tool (pentagon icon) in the top-right corner of the map, 
            then click to place points around your land boundary. Close the shape by clicking on the first point.
          </p>
        </div>
      )}

      {isDrawing && (
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 text-center">
          <p className="text-sm text-primary font-medium">
            Drawing mode active - click on the map to place boundary points. Click the first point to complete the polygon.
          </p>
        </div>
      )}
    </div>
  );
}
