import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from './Button';
import { LazyImage } from './LazyImage';
import { PrefetchLink } from './PrefetchLink';

/* =========================================================
   DONNÉES
========================================================= */

const BRANDS = [
  { name: 'Dell Technologies', logo: '/images/marques/Dell.avif' },
  { name: 'HP', logo: '/images/marques/HP.avif' },
  { name: 'Lenovo', logo: '/images/marques/Lenovo.avif' },
  { name: 'Microsoft', logo: '/images/marques/Microsoft.avif' },
  { name: 'Cisco', logo: '/images/marques/Cisco.avif' },
  { name: 'AData', logo: '/images/marques/AData.avif' },
  { name: 'Fortinet', logo: '/images/marques/Fortinet.avif' },
  { name: 'Apple', logo: '/images/marques/Apple.avif' },
  { name: 'Logitech', logo: '/images/marques/Logitech.avif' },
  { name: 'Samsung', logo: '/images/marques/Samsung.avif' },
  { name: 'Symantec', logo: '/images/marques/Symantec.avif' },
  { name: 'LaCie', logo: '/images/marques/LaCie.avif' },
  { name: 'Jabra', logo: '/images/marques/Jabra.avif' },
  { name: 'D-Link', logo: '/images/marques/DLink.avif' }
];

const CLIENTS = [
  { name: 'Arma', logo: '/images/clients/arma-env.jpg' },
  { name: 'TotalCall', logo: '/images/clients/TotalCall.avif' },
  { name: 'Econocom', logo: '/images/clients/Econocom.avif' },
  { name: 'Roche', logo: '/images/clients/Roche.avif' },
  { name: 'Innovista', logo: '/images/clients/Innovista.avif' },
  { name: 'ValuePass', logo: '/images/clients/ValuePass.avif' },
  { name: 'CIMR', logo: '/images/clients/CIMR.avif' },
  { name: 'ResolutionCall', logo: '/images/clients/ResolutionCall.avif' },
  { name: 'TNS', logo: '/images/clients/tns.svg' },
  { name: 'IPSOS', logo: '/images/clients/Ipsos.png' },
  { name: 'AHMITT', logo: '/images/clients/ahmitt.png' },
  { name: 'SNTL', logo: '/images/clients/SNTL.png' },
  { name: 'Samsung', logo: '/images/clients/Samsung.svg' },
  { name: 'Domaines Agricoles', logo: '/images/clients/Domaines_agricoles.gif' },
  { name: 'Monacotelecom', logo: '/images/clients/Monacotelecom.png' },
  { name: 'Copralim', logo: '/images/clients/Copralim.png' },
  { name: 'Villa Blanca', logo: '/images/clients/villablanca.jpg' },
  { name: 'Indra', logo: '/images/clients/Indra.png' },
  { name: 'Petromin', logo: '/images/clients/Petromin.png' },
  { name: 'Palmeraie', logo: '/images/clients/Palmeraie.jpg' },
  { name: 'Nielsen', logo: '/images/clients/Nielsen.png' },
  { name: 'Crouzet', logo: '/images/clients/Crouzet.jpg' },
  { name: 'SAP', logo: '/images/clients/SAP.png' },
  { name: 'OFPPT', logo: '/images/clients/OFPPT.png' },
  { name: 'XCeed', logo: '/images/clients/xceed.png' },
  { name: 'Derichebourg', logo: '/images/clients/Derichebourg.png' },
  { name: 'Saham', logo: '/images/clients/Saham.png' },
  { name: 'Lafarge', logo: '/images/clients/Lafarge.png' },
  { name: 'Novo', logo: '/images/clients/novo.avif' }
];

/* =========================================================
   STYLES AUTONOMES (INLINE)
========================================================= */

const InternalStyles = () => (
  <style>
    {`
      @keyframes marqueeScroll {
        0% { transform: translateX(0); }
        100% { transform: translateX(-50%); }
      }

      .marquee-track {
        display: flex;
        width: max-content;
        animation: marqueeScroll 45s linear infinite;
      }

      .marquee-track:hover {
        animation-play-state: paused;
      }
    `}
  </style>
);

/* =========================================================
   MARQUES — PREMIUM STATIQUE
========================================================= */

export const BrandsSection = () => (
  <>
    <InternalStyles />

    <section className="py-20 bg-white border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4">

        <div className="text-center mb-14">
          <span className="uppercase tracking-widest text-xs text-gray-400">
            Partenaires technologiques
          </span>
          <h2 className="mt-2 text-3xl font-bold text-corporate-blue font-heading">
            Nos Marques
          </h2>
          <p className="mt-4 text-gray-500 max-w-2xl mx-auto">
            Des alliances solides avec les leaders du marché pour garantir fiabilité et performance.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-10 items-center justify-items-center">
          {BRANDS.map((brand, idx) => (
            <div
              key={idx}
              title={brand.name}
              className="group flex items-center justify-center p-5 rounded-xl
                         transition-all duration-500
                         hover:bg-gray-50"
            >
              <LazyImage
                src={brand.logo}
                alt={brand.name}
                loading="lazy"
                width={240}
                height={80}
                className="h-9 md:h-11 lg:h-12 w-auto object-contain
                           grayscale opacity-60
                           group-hover:grayscale-0
                           group-hover:opacity-100
                           group-hover:scale-105
                           transition-all duration-500"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  </>
);

/* =========================================================
   CLIENTS — PREMIUM DYNAMIQUE
========================================================= */

export const ClientsSection = () => (
  <>
    <InternalStyles />

    <section className="py-24 bg-gradient-to-b from-gray-50 to-white overflow-hidden">

      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <span className="uppercase tracking-widest text-xs text-gray-400">
            Ils nous font confiance
          </span>
          <h2 className="mt-2 text-3xl font-bold text-corporate-blue font-heading">
            Nos Références Clients
          </h2>
          <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
            Entreprises et institutions qui nous confient leurs projets technologiques.
          </p>
        </div>
      </div>

      <div className="relative w-full overflow-hidden">
        <div className="marquee-track gap-12 px-6">
          {[...CLIENTS, ...CLIENTS].map((client, idx) => (
            <div
              key={idx}
              title={client.name}
              className="flex items-center justify-center min-w-[140px] p-4"
            >
              <LazyImage
                src={client.logo}
                alt={client.name}
                loading="lazy"
                width={240}
                height={80}
                className="h-10 md:h-12 w-auto object-contain
                           opacity-80 hover:opacity-100
                           transition duration-300"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-20 text-center">
        <p className="text-gray-600 mb-6 font-medium">
          Vous souhaitez rejoindre nos clients de référence ?
        </p>
        <PrefetchLink to="/contact" prefetch="both">
          <Button
            variant="outline"
            className="border-corporate-blue text-corporate-blue
                       hover:bg-corporate-blue hover:text-white px-10"
          >
            Discutons de votre projet
          </Button>
        </PrefetchLink>
      </div>
    </section>
  </>
);
