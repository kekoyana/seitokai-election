/**
 * English catchphrase translations (personality x attribute).
 */

export const EN_CATCHPHRASE_MAP: Record<string, Record<string, string>> = {
  passionate: {
    sporty: 'Let\'s do this!',
    energetic: 'I\'m fired up!',
    energetic_social: 'Let\'s get everyone pumped!',
    serious: 'I\'m going all out!',
    _default: 'I won\'t lose!',
  },
  cautious: {
    cool: '...Let\'s assess the situation first.',
    introverted: 'Let me think about this a bit more...',
    serious: 'According to the data...',
    fashionable: 'I\'d rather play it safe.',
    _default: 'Let\'s calm down for a moment.',
  },
  stubborn: {
    serious: 'Rules are rules.',
    cool: '...I won\'t budge.',
    introverted: 'I disagree.',
    sporty: 'I\'m not backing down.',
    _default: 'My mind is made up.',
  },
  flexible: {
    airhead: 'Ooh, that sounds awesome!',
    energetic_social: 'Nice, that works too!',
    energetic: 'Both sound fun!',
    fashionable: 'Yeah yeah, I kinda get it~',
    _default: 'Eh, it\'ll work out.',
  },
  cunning: {
    airhead: 'Hehe, is that so?',
    fashionable: 'Oh my, how interesting.',
    cool: '...Are you serious about that?',
    introverted: 'Hm... that\'s one way to see it.',
    _default: 'I see...',
  },
};
