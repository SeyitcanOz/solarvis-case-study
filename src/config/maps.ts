export interface MapConfig {
  id: string;
  name: string;
  imageUrl: string;
  description?: string;
}

export const availableMaps: MapConfig[] = [
  {
    id: 'isci-bloklari',
    name: 'İşçi Blokları',
    imageUrl: '/map-images/isci_bloklari.jpg',
    description: 'İşçi Blokları bölgesi uydu görüntüsü',
  },
  {
    id: 'isci-bloklari_2',
    name: 'İşçi Blokları 2',
    imageUrl: '/map-images/isci_bloklari_2.jpg',
    description: 'İşçi Blokları bölgesi uydu görüntüsü',
  },
  {
    id: 'bahcelievler',
    name: 'Bahçelievler',
    imageUrl: '/map-images/bahcelievler.jpg',
    description: 'Bahçelievler bölgesi uydu görüntüsü',
  },
];

export const getDefaultMap = (): MapConfig => {
  return availableMaps[0];
};

export const getMapById = (id: string): MapConfig | undefined => {
  return availableMaps.find((map) => map.id === id);
};


