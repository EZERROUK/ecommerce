export const SITE = {
  url: (import.meta as any)?.env?.VITE_SITE_URL?.toString?.() || 'https://x-zone.ma',
  name: 'X-Zone Technologie',
  locale: 'fr_MA',
};

export const COMPANY_INFO = {
  name: 'X-Zone Technologie',
  founded: 2001,
  location: 'Casablanca, Maroc',
  phone: '+212 5 22 52 32 32',
  email: 'contact@x-zone.ma',
  address: "Bd Taza (Aïn Chok), 11-13 rue 71 hay Mly Abdellah, Aïn Chok, Casablanca, Maroc",
  mapUrl:
    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d473.93358400664596!2d-7.595100493317822!3d33.543648613969715!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xda632be7d6d0e7d%3A0xd6b4b390dfc53a02!2sX-zone%20Technologie!5e1!3m2!1sfr!2sfr!4v1766144747829!5m2!1sfr!2sfr',
  social: {
    linkedin: 'https://www.linkedin.com/company/x-zone-technology/',
    facebook: '#',
    instagram: '#',
  },
};
