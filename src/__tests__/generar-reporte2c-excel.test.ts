import { generarReporte2CExcel } from "../lib/generar-reporte2c-excel";

// ======================
//  Mock global APIs
// ======================
beforeAll(() => {
  (global as any).document = {
    createElement: jest.fn(() => ({
      click: jest.fn(),
      set href(val: string) {},
      set download(val: string) {},
    })),
  };

  (global as any).URL = {
    createObjectURL: jest.fn(() => "blob:mock"),
    revokeObjectURL: jest.fn(),
  };

  (global as any).Blob = class {
    constructor(_: any) {}
  };
});

describe("generarReporte2CExcel", () => {
  it("genera un Excel y dispara la descarga", async () => {
    const mockRecord = {
      participantData: {
        first_name: "Ana",
        last_name: "Pérez",
        calculated_age: 30,
        sex: "F",
        id_number: "456",
      },
      test_results: {
        dos_componentes: {
          faulkner: {
            calculated: {
              porcentaje: 22.5,
              masaKg: 14.7,
              formula: "Faulkner",
              referencia: "Referencia estándar",
            },
          },
        },
      },
    };

    await generarReporte2CExcel(mockRecord);

    // Verificamos las llamadas clave
    expect(document.createElement).toHaveBeenCalledWith("a");
    expect(URL.createObjectURL).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalled();
  });

  it("genera un Excel incluso si no hay resultados calculados", async () => {
    const mockRecord = {
      participantData: {
        first_name: "Carlos",
        last_name: "Ramírez",
        calculated_age: null,
        sex: "M",
        id_number: "789",
      },
      test_results: {
        dos_componentes: {}, // vacío
      },
    };

    await generarReporte2CExcel(mockRecord);

    expect(document.createElement).toHaveBeenCalledWith("a");
    expect(URL.createObjectURL).toHaveBeenCalled();
  });
});
