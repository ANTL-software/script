import './prospectInfoHeader.scss';
import { useProspect } from '../../../hooks/useProspect';
import TypeFicheBadge from '../typeFicheBadge/TypeFicheBadge';

export default function ProspectInfoHeader() {
  const { currentProspect, fullName, typeFiche } = useProspect();

  if (!currentProspect) {
    return null;
  }

  return (
    <div className="prospect-info-header">
      <div className="prospect-info-header__title">
        <h1>{fullName}</h1>
        <TypeFicheBadge typeFiche={typeFiche} />
      </div>

      <table className="prospect-info-table">
        <tbody>
          <tr>
            <td className="label">Nom</td>
            <td className="value">{currentProspect.nom}</td>
            <td className="label">Prenom</td>
            <td className="value">{currentProspect.prenom || '-'}</td>
          </tr>
          <tr>
            <td className="label">Telephone</td>
            <td className="value">{currentProspect.telephone}</td>
            <td className="label">Email</td>
            <td className="value">{currentProspect.email || '-'}</td>
          </tr>
          <tr>
            <td className="label">Ville</td>
            <td className="value">{currentProspect.ville || '-'}</td>
            <td className="label">Type</td>
            <td className="value">{currentProspect.type_prospect}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
