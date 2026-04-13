// __tests__/generate-reporte.test.ts
import { generarReporte } from "../lib/generate-reporte";

const saveMock = jest.fn();

// ✅ Mock de jsPDF con todos los métodos que se usan en generate-reporte.ts
jest.mock("jspdf", () => {
  return jest.fn().mockImplementation(() => {
    return {
      text: jest.fn(),
      addImage: jest.fn(),
      save: saveMock,
      setFillColor: jest.fn(),
      rect: jest.fn(),
      line: jest.fn(),
      setFont: jest.fn(),
      setFontSize: jest.fn(),
      setTextColor: jest.fn(),
      setDrawColor: jest.fn(),
      setLineWidth: jest.fn(),
      addPage: jest.fn(),
      getImageProperties: jest.fn().mockReturnValue({
        width: 100,
        height: 100,
      }),
      internal: {
        pageSize: {
          getWidth: () => 210,  // tamaño A4
          getHeight: () => 297, // tamaño A4
        },
      },
    };
  });
});

// ✅ Mock de html2canvas para no intentar renderizar nada real
jest.mock("html2canvas", () => {
  return jest.fn().mockResolvedValue({
    toDataURL: () => "data:image/png;base64,mock",
    width: 100,
    height: 100,
    getContext: () => ({
      getImageData: jest.fn(() => ({ data: [] })),
      putImageData: jest.fn(),
    }),
  });
});

// ✅ Mock de jspdf-autotable (solo necesitamos que no explote)
jest.mock("jspdf-autotable", () => {
  return jest.fn();
});

describe("generarReporte", () => {
  it("genera un PDF con datos básicos del participante", async () => {
    const mockRecord = {
      participantData: {
        first_name: "Juan",
        last_name: "Pérez",
        calculated_age: 25,
        sex: "Masculino",
        id_number: "12345",
      },
      test_results: {},
    };

    const mockRefs = {
      perfilZRef: null as unknown as HTMLDivElement,
      somatochartRef: null as unknown as HTMLDivElement,
      kerrChartRef: null as unknown as HTMLDivElement,
    };

    await generarReporte(mockRecord, mockRefs);

    // ✅ Verificamos que se intente guardar el PDF
    expect(saveMock).toHaveBeenCalled();
  });
});
