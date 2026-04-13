// __tests__/generar-reporte2c.test.ts
import { generarReporte2C } from "../lib/generar-reporte2c";

const saveMock = jest.fn();
const textMock = jest.fn();
const setFontSizeMock = jest.fn();

// ✅ Mock de jsPDF
jest.mock("jspdf", () => {
  return jest.fn().mockImplementation(() => {
    return {
      text: textMock,
      setFontSize: setFontSizeMock,
      save: saveMock,
      internal: {
        pageSize: {
          getWidth: () => 210,
          getHeight: () => 297,
        },
      },
    };
  });
});

// ✅ Mock de jspdf-autotable
const autoTableMock = jest.fn();
jest.mock("jspdf-autotable", () => {
  return jest.fn((doc, options) => {
    autoTableMock(doc, options);
    // simular que se guarda posición final de la tabla
    (doc as any).lastAutoTable = { finalY: (options.startY || 20) + 20 };
  });
});

describe("generarReporte2C", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("genera un PDF con datos básicos y resultados de 2 componentes", async () => {
    const mockRecord = {
      participantData: {
        first_name: "Ana",
        last_name: "Gómez",
        id_number: "999",
        calculated_age: 22,
        sex: "Femenino",
      },
      test_results: {
        dos_componentes: {
          metodo1: {
            calculated: {
              porcentaje: 25.6,
              masaKg: 18.4,
              formula: "Siri",
              referencia: "OMS",
            },
          },
        },
      },
    };

    await generarReporte2C(mockRecord);

    // ✅ Verificar que se llamó a text
    expect(textMock).toHaveBeenCalledWith(
      "REPORTE - 2 COMPONENTES",
      expect.any(Number),
      expect.any(Number),
      { align: "center" }
    );

    // ✅ Verificar que se llamó a autoTable al menos una vez
    expect(autoTableMock).toHaveBeenCalled();

    // ✅ Verificar que se guardó el PDF
    expect(saveMock).toHaveBeenCalledWith("Reporte2C_Gómez.pdf");
  });

  it("genera un PDF incluso si no hay resultados de 2 componentes", async () => {
    const mockRecord = {
      participantData: {
        first_name: "Carlos",
        last_name: "López",
        id_number: "123",
        calculated_age: 30,
        sex: "Masculino",
      },
      test_results: {
        dos_componentes: {},
      },
    };

    await generarReporte2C(mockRecord);

    // ✅ Asegurar que se intentó guardar
    expect(saveMock).toHaveBeenCalledWith("Reporte2C_López.pdf");

    // ✅ En este caso igual debería escribir un mensaje en el PDF
    expect(textMock).toHaveBeenCalledWith(
      "No se encontraron resultados calculados.",
      expect.any(Number),
      expect.any(Number)
    );
  });
});
