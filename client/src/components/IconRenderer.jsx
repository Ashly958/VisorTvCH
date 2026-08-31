import React from 'react';
import {
  Building2,
  Compass,
  Landmark,
  Store,
  Radio,
  Crown,
  Tv,
  Monitor,
  Video,
  Image,
  MapPin,
  Sparkles,
  Layers,
  Hospital,
  ShoppingBag,
  School,
  Coffee,
  Globe,
  Film
} from 'lucide-react';

export const iconMap = {
  Building2,
  Compass,
  Landmark,
  Store,
  Radio,
  Crown,
  Tv,
  Monitor,
  Video,
  Image,
  MapPin,
  Sparkles,
  Layers,
  Hospital,
  ShoppingBag,
  School,
  Coffee,
  Globe,
  Film
};

export const AVAILABLE_ICONS = [
  'Building2',
  'Compass',
  'Landmark',
  'Store',
  'Radio',
  'Crown',
  'Tv',
  'Monitor',
  'Video',
  'Image',
  'MapPin',
  'Sparkles',
  'Layers',
  'Hospital',
  'ShoppingBag',
  'School',
  'Coffee',
  'Globe',
  'Film'
];

export const IconRenderer = ({ name, className = "w-5 h-5", ...props }) => {
  const IconComponent = iconMap[name] || Building2;
  return <IconComponent className={className} {...props} />;
};

export default IconRenderer;
