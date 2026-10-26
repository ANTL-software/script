import { useScriptSupport } from '../../../hooks/index.ts';
import './quiSommesNous.scss';

export default function QuiSommesNous() {
  const support = useScriptSupport('qui-sommes-nous');
  if (support.isLoading) return <p>Chargement…</p>;
  if (support.error) return <p role="alert">{support.error}</p>;
  return <div className="qui-sommes-nous">
    <div className="qui-sommes-nous__header"><h2>Qui sommes-nous ?</h2><p>{support.data?.nom_campagne}</p></div>
    <div className="qui-sommes-nous__content">
      {support.data?.items.length === 0 && <p>Aucune présentation renseignée pour cette campagne.</p>}
      {support.data?.items.map((item, index) => <section className="qui-sommes-nous__section" key={index}>
        <h3>{item.titre}</h3><p className="qui-sommes-nous__custom-text">{item.contenu}</p>
      </section>)}
    </div>
  </div>;
}
