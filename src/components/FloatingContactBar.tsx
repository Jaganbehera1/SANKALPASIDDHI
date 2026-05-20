import React, { useEffect, useState } from 'react';
import { Phone, Mail, ArrowUp } from 'lucide-react';

export default function FloatingContactBar() {
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 300);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div
      className="fixed inset-x-0 bottom-4 md:inset-auto md:right-4 md:top-1/2 md:-translate-y-1/2 z-50 flex items-center justify-center md:flex-col gap-3 p-3 md:p-0 pointer-events-none"
      aria-hidden={false}
    >
      {/* container becomes a full-width horizontal bar on mobile and a vertical stack on md+ */}
      <div className="w-full md:w-auto flex items-center justify-center md:flex-col gap-3 md:gap-3 bg-transparent md:bg-transparent pointer-events-auto">
        <a
          href="https://wa.me/917978966065"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="WhatsApp"
          className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 text-white shadow-lg hover:scale-105 transform transition"
        >
          {/* simple WhatsApp SVG */}
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden>
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.472-.148-.672.15-.198.297-.768.967-.942 1.165-.173.198-.347.223-.644.075-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.654-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.372-.025-.521-.075-.149-.672-1.611-.92-2.203-.242-.579-.487-.5-.672-.51l-.573-.01c-.198 0-.52.074-.792.372s-1.04 1.015-1.04 2.479 1.064 2.876 1.213 3.074c.149.198 2.095 3.2 5.077 4.487  .709.306 1.26.489 1.693.627.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.413-.074-.123-.272-.198-.57-.347z" />
            <path d="M12.004 2C6.477 2 2 6.477 2 12.004c0 2.115.63 4.067 1.718 5.73L2 22l4.412-1.152A9.95 9.95 0 0 0 12.004 22c5.527 0 10.004-4.477 10.004-9.996C22.008 6.477 17.531 2 12.004 2z" opacity=".2"/>
          </svg>
        </a>

        <a
          href="tel:+917978966065"
          aria-label="Call"
          className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 text-white shadow-lg hover:scale-105 transform transition pointer-events-auto"
        >
          <Phone className="w-5 h-5" />
        </a>

        <a
          href="mailto:your.jaganbehera63@gmail.com"
          aria-label="Email"
          className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-red-400 to-rose-600 text-white shadow-lg hover:scale-105 transform transition pointer-events-auto"
        >
          <Mail className="w-5 h-5" />
        </a>

        {showTop && (
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            aria-label="Scroll to top"
            className="flex items-center justify-center w-10 h-10 rounded-full bg-white/90 text-slate-900 shadow-lg hover:scale-105 transform transition pointer-events-auto"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
