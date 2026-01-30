
import React from 'react';
import { Clock, Users, Server, Shield, Settings, LucideIcon } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const icons: { [key: string]: LucideIcon } = {
  Clock, Users, Server, Shield, Settings
};

export const TrustBadges: React.FC = () => {
  const { t } = useLanguage();

  const badges = [
    { icon: "Clock", label: t('trust.exp'), desc: t('trust.expDesc') },
    { icon: "Users", label: t('trust.clients'), desc: t('trust.clientsDesc') },
    { icon: "Server", label: t('trust.expert'), desc: t('trust.expertDesc') },
    { icon: "Shield", label: t('trust.support'), desc: t('trust.supportDesc') },
    { icon: "Settings", label: t('trust.custom'), desc: t('trust.customDesc') },
  ];

  return (
    <div className="bg-corporate-blue py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {badges.map((badge, idx) => {
            const Icon = icons[badge.icon] || Shield;
            return (
              <div key={idx} className="flex flex-col items-center text-center group p-4 rounded-lg hover:bg-white/5 transition-colors">
                <div className="mb-3 p-3 bg-white/10 rounded-full text-corporate-red group-hover:bg-corporate-red group-hover:text-white transition-all duration-300">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-white font-bold text-sm mb-1 font-heading">{badge.label}</h3>
                <p className="text-gray-400 text-xs">{badge.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
