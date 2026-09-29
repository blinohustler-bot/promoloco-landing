import Image from 'next/image';

/** Vrai logo PromoLoco, lettres repassées en blanc pour le fond sombre.
    La version d'origine (lettres noires) est dans public/logo-fond-clair.png. */
export default function Logo() {
  return (
    <Image className="logo" src="/logo.png" alt="PromoLoco" width={460} height={180} priority />
  );
}
