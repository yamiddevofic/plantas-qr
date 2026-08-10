import TarjetaPlanta from './TarjetaPlanta';

export default function ListaPlantas({ plantas, qrs, onDeleted, onQRRegenerated, onEdit }) {
  return (
    <div className="planta-grid">
      {plantas.map((p) => (
        <TarjetaPlanta
          key={p._id}
          planta={p}
          qr={qrs[p._id]}
          onDeleted={onDeleted}
          onQRRegenerated={onQRRegenerated}
          onEdit={onEdit}
        />
      ))}
    </div>
  );
}