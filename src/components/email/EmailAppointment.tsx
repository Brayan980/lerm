import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// DEFINIR EL TIPO PRIMERO
export interface Participant {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  idNumber?: string;
}

// LUEGO USARLO EN Props
export interface Props {
  fecha: string;
  horario: string;
  ubicacion: string;
  notas: string;
  participantes: Participant[];
  total: number;
}

export default function EmailAppointment({
  fecha,
  horario,
  ubicacion,
  notas,
  participantes,
  total,
}: Props) {
  const fechaLarga = format(new Date(fecha), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es });

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: '0 auto', padding: '20px', backgroundColor: '#f9f9f9' }}>
      <div style={{ backgroundColor: '#ffffff', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <h1 style={{ color: '#1e40af', fontSize: '24px', marginBottom: '16px' }}>
          Cita Grupal Programada
        </h1>

        <p style={{ color: '#374151', fontSize: '16px', marginBottom: '24px' }}>
          ¡Hola a todos!
        </p>

        <p style={{ color: '#374151', fontSize: '16px', marginBottom: '24px' }}>
          Se ha programado una <strong>cita grupal</strong> con <strong>{total} participantes</strong>. Aquí están los detalles:
        </p>

        <div style={{ backgroundColor: '#eff6ff', padding: '16px', borderRadius: '8px', marginBottom: '24px', border: '1px solid #bfdbfe' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tr>
              <td style={{ padding: '6px 0', color: '#1e40af', fontWeight: 'bold' }}>Fecha:</td>
              <td style={{ padding: '6px 0', color: '#111827' }}>{fechaLarga}</td>
            </tr>
            <tr>
              <td style={{ padding: '6px 0', color: '#1e40af', fontWeight: 'bold' }}>Horario:</td>
              <td style={{ padding: '6px 0', color: '#111827' }}>{horario}</td>
            </tr>
            <tr>
              <td style={{ padding: '6px 0', color: '#1e40af', fontWeight: 'bold' }}>Ubicación:</td>
              <td style={{ padding: '6px 0', color: '#111827' }}>{ubicacion}</td>
            </tr>
          </table>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <p style={{ margin: '0 0 8px', color: '#374151', fontWeight: 'bold' }}>
            Participantes ({total}):
          </p>
          <ul style={{ margin: '0', paddingLeft: '20px', color: '#374151' }}>
            {participantes.map((p) => (
              <li key={p.id} style={{ marginBottom: '4px' }}>
                {p.firstName} {p.lastName}
                {p.email && <span style={{ color: '#6b7280', fontSize: '14px' }}> ({p.email})</span>}
              </li>
            ))}
          </ul>
        </div>

        {notas && (
          <div style={{ backgroundColor: '#f3f4f6', padding: '16px', borderRadius: '8px', marginBottom: '24px' }}>
            <p style={{ margin: '0', color: '#374151' }}>
              <strong>Notas:</strong> {notas}
            </p>
          </div>
        )}

        <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '20px', fontSize: '12px', color: '#9ca3af' }}>
          <p>Este es un mensaje automático. Responde a este email si necesitas más información.</p>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '12px', color: '#9ca3af' }}>
        © {new Date().getFullYear()} Tu Empresa. Todos los derechos reservados.
      </div>
    </div>
  );
}