import { generarReporteExcel } from "../lib/generate-reporte-excel";

// Mock de objetos globales
beforeAll(() => {
  // Mock document.createElement
  (global as any).document = {
    createElement: jest.fn(() => ({
      click: jest.fn(),
      set href(val: string) {},
      set download(val: string) {},
    })),
  };

  // Mock URL
  (global as any).URL = {
    createObjectURL: jest.fn(() => "blob:mock"),
    revokeObjectURL: jest.fn(),
  };

  // Mock Blob
  (global as any).Blob = class {
    constructor(_: any) {}
  };
});


describe("generarReporteExcel", () => {
  it("genera un Excel y dispara la descarga", async () => {
    const mockRecord = {
      participantData: {
        first_name: "Steven",
        last_name: "Gómez",
        calculated_age: 25,
        sex: "M",
        id_number: "123",
      },
      paq_score: 100,
      paq_classification: "Activo",
      ipaq_met_minutes: 200,
      ipaq_classification: "Moderado",
      test_results: {
        calculatedIndices: {
          imc: { value: 22.5, classification: "Normal" },
          icc: 0.9,
        },
        calculatedComposicion: {
          masaGrasaKg: 15.2,
          masaOseaKg: 10.3,
          masaMuscularEsqueleticaKg: 28.5,
        },
        calculatedSomatotype: {
          endomorfia: 3.1,
          mesomorfia: 4.2,
          ectomorfia: 2.5,
        },
      },
    };

    await generarReporteExcel(mockRecord, {
      perfilZRef: null,
      somatochartRef: null,
      kerrChartRef: null,
    });

    expect(document.createElement).toHaveBeenCalledWith("a");
    expect(URL.createObjectURL).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalled();
  });
});
