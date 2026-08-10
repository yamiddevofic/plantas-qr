function BrandMark() {
  return (
    <svg className="brand-mark" width="44" height="44" viewBox="0 0 48 48" fill="none" aria-hidden="true" focusable="false">
      <circle cx="24" cy="24" r="23" fill="#E7F2EA" />
      <circle cx="24" cy="24" r="23" stroke="#B7E4C7" strokeWidth="1.5" />
      <path
        d="M34 14C34 14 16 15.5 12.5 19C9 22.5 12 33 12 33S22.5 36 26 32.5s8-18.5 8-18.5z"
        fill="#2D6A4F"
      />
      <path d="M14 32S21 27 25 23" stroke="#B7E4C7" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export default function EncabezadoApp() {
  return (
    <header className="app-header">
      <div className="app-brand">
        <BrandMark />
        <div>
          <p className="app-eyebrow">Parque principal de Chitagá</p>
          <h1>PlantaQR</h1>
        </div>
      </div>
      <p className="app-subtitle">
        Identifica cada árbol del parque y conoce su historia:
        escanea su código QR o explora el catálogo de especies.
      </p>
    </header>
  );
}