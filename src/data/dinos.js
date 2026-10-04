import dinoPurpleLongneck from '../assets/dinos/dino-purple-longneck.png';
import dinoOrangeRoar from '../assets/dinos/dino-orange-roar.png';
import dinoGreenEgg from '../assets/dinos/dino-green-egg.png';
import dinoTealTrike from '../assets/dinos/dino-teal-trike.png';
import dinoOrangeBabyTrike from '../assets/dinos/dino-orange-baby-trike.png';
import dinoGreenRex from '../assets/dinos/dino-green-rex.png';
import dinoPinkSpiky from '../assets/dinos/dino-pink-spiky.png';
import dinoGreenStego from '../assets/dinos/dino-green-stego.png';

export const DINO_AVATARS = [
  {
    id: 'dino-1',
    key: 'dino-purple-longneck',
    name: 'Brachio',
    species: 'Brachiosaurus',
    tagline: 'Gentle & Wise',
    description: 'Calm thinker who keeps everyone’s budget balanced and peaceful.',
    badge: 'Gentle Dino',
    image: dinoPurpleLongneck,
    bg: '#F3E8FF',
    cardBg: '#FAF5FF',
    border: '#D8B4FE',
    accent: '#7C3AED',
    textDark: '#4A148C',
    aliases: ['dino-1', 'dino-purple-longneck', 'dino-brachio', 'brachio', '🦕'],
  },
  {
    id: 'dino-2',
    key: 'dino-orange-roar',
    name: 'Rexy',
    species: 'Carnotaurus',
    tagline: 'Bold & Spunky',
    description: 'Brings fiery energy, loves treats, and leads every group outing.',
    badge: 'Spicy Dino',
    image: dinoOrangeRoar,
    bg: '#FFEAD5',
    cardBg: '#FFF7ED',
    border: '#FED7AA',
    accent: '#EA580C',
    textDark: '#9A3412',
    aliases: ['dino-2', 'dino-orange-roar', 'dino-rexy', 'rexy', '🦖'],
  },
  {
    id: 'dino-3',
    key: 'dino-green-egg',
    name: 'Hatchy',
    species: 'Baby Dino',
    tagline: 'Curious & Sweet',
    description: 'Fresh out of the shell and always eager to hatch new savings.',
    badge: 'Baby Dino',
    image: dinoGreenEgg,
    bg: '#DCFCE7',
    cardBg: '#F0FDF4',
    border: '#BBF7D0',
    accent: '#16A34A',
    textDark: '#166534',
    aliases: ['dino-3', 'dino-green-egg', 'dino-hatchy', 'hatchy', '🐣'],
  },
  {
    id: 'dino-4',
    key: 'dino-teal-trike',
    name: 'Trike',
    species: 'Triceratops',
    tagline: 'Sturdy & Loyal',
    description: 'Rock-solid reliability — always settles expenses right on time.',
    badge: 'Trusty Dino',
    image: dinoTealTrike,
    bg: '#CCFBF1',
    cardBg: '#F0FDFA',
    border: '#99F6E4',
    accent: '#0D9488',
    textDark: '#115E59',
    aliases: ['dino-4', 'dino-teal-trike', 'dino-trike', 'trike', '🦏'],
  },
  {
    id: 'dino-5',
    key: 'dino-orange-baby-trike',
    name: 'Topsy',
    species: 'Baby Horn',
    tagline: 'Playful & Cute',
    description: 'Spreads smiles, snacks, and extra love during barkada food trips.',
    badge: 'Cute Dino',
    image: dinoOrangeBabyTrike,
    bg: '#FFE4E6',
    cardBg: '#FFF1F2',
    border: '#FECDD3',
    accent: '#E11D48',
    textDark: '#9F1239',
    aliases: ['dino-5', 'dino-orange-baby-trike', 'dino-topsy', 'topsy'],
  },
  {
    id: 'dino-6',
    key: 'dino-green-rex',
    name: 'Chomp',
    species: 'Green Rex',
    tagline: 'Foodie & Cheerful',
    description: 'First in line for milk tea runs and happy ambagan feasts.',
    badge: 'Foodie Dino',
    image: dinoGreenRex,
    bg: '#E0F2FE',
    cardBg: '#F0F9FF',
    border: '#BAE6FD',
    accent: '#0284C7',
    textDark: '#075985',
    aliases: ['dino-6', 'dino-green-rex', 'dino-chomp', 'chomp', '🐊'],
  },
  {
    id: 'dino-7',
    key: 'dino-pink-spiky',
    name: 'Spike',
    species: 'Spinosaurus',
    tagline: 'Funky Rockstar',
    description: 'Vibrant, quirky, and turns every bill split into a party.',
    badge: 'Rockstar Dino',
    image: dinoPinkSpiky,
    bg: '#FCE7F3',
    cardBg: '#FDF2F8',
    border: '#FBCFE8',
    accent: '#DB2777',
    textDark: '#9D174D',
    aliases: ['dino-7', 'dino-pink-spiky', 'dino-spike', 'spike', '🦎'],
  },
  {
    id: 'dino-8',
    key: 'dino-green-stego',
    name: 'Steggy',
    species: 'Stegosaurus',
    tagline: 'Kind & Friendly',
    description: 'Gentle buddy with protective plates and a warm heart.',
    badge: 'Friendly Dino',
    image: dinoGreenStego,
    bg: '#ECFCCB',
    cardBg: '#F7FEE7',
    border: '#D9F99D',
    accent: '#65A30D',
    textDark: '#3F6212',
    aliases: ['dino-8', 'dino-green-stego', 'dino-steggy', 'steggy', '🦔'],
  },
];

/**
 * Resolves a Dino Avatar metadata object from an ID, key, alias, name, or emoji.
 * Returns null if not found.
 */
export function getDinoAvatar(idOrEmoji) {
  if (!idOrEmoji) return null;
  const str = String(idOrEmoji).trim();
  return (
    DINO_AVATARS.find(
      (d) =>
        d.id === str ||
        d.key === str ||
        d.aliases.includes(str) ||
        d.name.toLowerCase() === str.toLowerCase()
    ) || null
  );
}

/**
 * Returns a random dino avatar from the collection.
 */
export function getRandomDino(excludeId = null) {
  const pool = excludeId ? DINO_AVATARS.filter((d) => d.id !== excludeId) : DINO_AVATARS;
  return pool[Math.floor(Math.random() * pool.length)];
}

export default DINO_AVATARS;
