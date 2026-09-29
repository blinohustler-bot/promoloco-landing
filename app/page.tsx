import Logo from '@/components/Logo';
import PartnerForm from '@/components/PartnerForm';
import { Aside } from '@/components/Pitch';
import Backdrop from '@/components/Backdrop';

export default function Home() {
  return (
    <div className="page">
      <Backdrop />
      <header className="topbar">
        <Logo />
        <span className="topbar-tag">Programme partenaire</span>
      </header>
      <main className="layout">
        <Aside />
        <PartnerForm />
      </main>
      <footer className="foot">© {new Date().getFullYear()} PromoLoco</footer>
    </div>
  );
}
