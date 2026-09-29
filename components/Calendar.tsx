import Script from 'next/script';

/** Widget de réservation GHL. form_embed.js ajuste la hauteur de l'iframe à son contenu.
    La réservation déclenche Schedule côté serveur (workflow GHL « Appointment Booked »). */
export default function Calendar({ id, prefill }: { id: string; prefill: Record<string, string | undefined> }) {
  const q = new URLSearchParams(Object.entries(prefill).filter((e): e is [string, string] => !!e[1]));
  return (
    <div className="cal">
      <iframe
        id={`${id}_booking`}
        src={`https://api.leadconnectorhq.com/widget/booking/${id}?${q}`}
        title="Choisir un moment pour l'appel"
        scrolling="no"
      />
      <Script src="https://link.msgsndr.com/js/form_embed.js" strategy="afterInteractive" />
    </div>
  );
}
