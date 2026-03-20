import { useState, useEffect } from 'react';
import { MapContainer } from '@/components/map/MapContainer';
import { SearchPanel } from '@/components/map/SearchPanel';
import { ParkingCard } from '@/components/map/ParkingCard';
import { BookingForm } from '@/components/booking/BookingForm';
import { Modal } from '@/components/common/Modal';
import { getNearbyParking } from '@/api/parking';
import { toast } from 'sonner';

export default function ParkingMap() {
  const [userLocation, setUserLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState([19.0760, 72.8777]); // Default Mumbai
  const [parkingSpaces, setParkingSpaces] = useState([]);
  const [selectedSpace, setSelectedSpace] = useState(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = [position.coords.latitude, position.coords.longitude];
          setUserLocation(loc);
          setMapCenter(loc);
          fetchParking({ lat: loc[0], lng: loc[1], radius: 5000 });
        },
        () => {
          toast.error('Could not get your location. Using default.');
          fetchParking({ lat: mapCenter[0], lng: mapCenter[1], radius: 5000 });
        }
      );
    } else {
      fetchParking({ lat: mapCenter[0], lng: mapCenter[1], radius: 5000 });
    }
  }, []);

  const fetchParking = async (params) => {
    setIsLoading(true);
    try {
      const res = await getNearbyParking(params);
      setParkingSpaces(res.data);
    } catch (error) {
      toast.error('Failed to fetch parking spaces');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (filters) => {
    const params = {
      lat: mapCenter[0],
      lng: mapCenter[1],
      ...filters,
    };
    fetchParking(params);
  };

  const handleMarkerClick = (space) => {
    setSelectedSpace(space);
    setMapCenter([space.public_latitude, space.public_longitude]);
  };

  const handleBookNow = (space) => {
    setSelectedSpace(space);
    setIsBookingModalOpen(true);
  };

  return (
    <div className="flex flex-col md:flex-row h-[calc(100svh-120px)] gap-4 relative">
      {/* Left Panel */}
      <div className="w-full md:w-80 flex flex-col h-[40vh] md:h-full shrink-0 z-10">
        <SearchPanel 
          onSearch={handleSearch} 
          results={parkingSpaces} 
          onResultClick={handleMarkerClick} 
        />
      </div>

      {/* Map Area */}
      <div className="flex-1 relative rounded-2xl overflow-hidden border border-white/10 shadow-card z-0">
        <MapContainer
          center={mapCenter}
          zoom={14}
          markers={parkingSpaces}
          userLocation={userLocation}
          onMarkerClick={handleMarkerClick}
        />
        
        {selectedSpace && !isBookingModalOpen && (
          <ParkingCard 
            space={selectedSpace} 
            onBook={handleBookNow} 
          />
        )}
      </div>

      <Modal
        open={isBookingModalOpen}
        onOpenChange={setIsBookingModalOpen}
        title="Book Parking Space"
      >
        <BookingForm 
          space={selectedSpace} 
          onClose={() => setIsBookingModalOpen(false)} 
        />
      </Modal>
    </div>
  );
}
