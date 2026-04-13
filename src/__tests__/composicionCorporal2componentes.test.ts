import { Modelo2Componentes, Medidas2Componentes } from '../lib/composicionCorporal2Componentes';

describe('Modelo2Componentes', () => {
  let medidasBase: Medidas2Componentes;

  beforeEach(() => {
    medidasBase = {
      altura: 175,
      sexo: 'Masculino',
      edad: 25,
      etnia: 'caucasico_hispano',
      pliegueTriceps: 10,
      pliegueSubescapular: 12,
      pliegueSupraespinal: 8,
      pliegueAbdominal: 15,
      pliegueMusloFrontal: 14,
      plieguePantorrilla: 10,
      perimetroBrazoRelajado: 30,
      perimetroMusloMedio: 55,
      perimetroPierna: 36,
    };
  });

  // ---------------------------------------------------------------------------
  // PRUEBAS: Masa Muscular (Lee)
  // ---------------------------------------------------------------------------

  it('calcula correctamente la masa muscular (Lee et al, 2000)', () => {
    const modelo = new Modelo2Componentes(medidasBase);
    const masa = modelo.calcularMasaMuscularLee();
    expect(masa).not.toBeNull();
  });

  it('considera el efecto de sexo en la masa muscular', () => {
    const modeloHombre = new Modelo2Componentes(medidasBase);
    const modeloMujer = new Modelo2Componentes({
      ...medidasBase,
      sexo: 'Femenino',
    });
    const masaH = modeloHombre.calcularMasaMuscularLee()!;
    const masaM = modeloMujer.calcularMasaMuscularLee()!;
    expect(masaH).toBeGreaterThan(masaM);
  });

  it('considera la etnia afroamericana con mayor masa muscular', () => {
    const base = medidasBase;
    const modeloBase = new Modelo2Componentes({ ...base, etnia: 'caucasico_hispano' });
    const modeloAfro = new Modelo2Componentes({ ...base, etnia: 'afroamericano' });
    const modeloAsiatico = new Modelo2Componentes({ ...base, etnia: 'asiatico' });

    const masaBase = modeloBase.calcularMasaMuscularLee()!;
    const masaAfro = modeloAfro.calcularMasaMuscularLee()!;
    const masaAsia = modeloAsiatico.calcularMasaMuscularLee()!;

    expect(masaAfro).toBeGreaterThan(masaBase);
    expect(masaAsia).toBeLessThan(masaBase);
  });

  it('disminuye la masa muscular con la edad', () => {
    const joven = new Modelo2Componentes({ ...medidasBase, edad: 20 });
    const mayor = new Modelo2Componentes({ ...medidasBase, edad: 60 });
    expect(joven.calcularMasaMuscularLee()!).toBeGreaterThan(mayor.calcularMasaMuscularLee()!);
  });

  // ---------------------------------------------------------------------------
  // PRUEBAS: Masa Adiposa (Kerr)
  // ---------------------------------------------------------------------------

  it('calcula correctamente la masa adiposa (Kerr ISAK)', () => {
    const modelo = new Modelo2Componentes(medidasBase);
    const [masaAdiposa, z] = modelo.calcularMasaAdiposaKerr();
    expect(masaAdiposa).not.toBeNull();
    expect(z).not.toBeNull();
    expect(typeof masaAdiposa).toBe('number');
    expect(typeof z).toBe('number');
  });

  it('aumenta la masa adiposa al aumentar los pliegues', () => {
    const base = new Modelo2Componentes(medidasBase);
    const altoGrasa = new Modelo2Componentes({
      ...medidasBase,
      pliegueTriceps: 25,
      pliegueSubescapular: 25,
      pliegueSupraespinal: 20,
      pliegueAbdominal: 30,
      pliegueMusloFrontal: 25,
      plieguePantorrilla: 20,
    });

    const [masaBase] = base.calcularMasaAdiposaKerr();
    const [masaAlta] = altoGrasa.calcularMasaAdiposaKerr();
    expect(masaAlta!).toBeGreaterThan(masaBase!);
  });

  it('z-score adiposo refleja desviación estándar correctamente', () => {
    const modelo = new Modelo2Componentes(medidasBase);
    const [, z] = modelo.calcularMasaAdiposaKerr();
    expect(z).toBeGreaterThan(-2);
    expect(z).toBeLessThan(2);
  });

  // ---------------------------------------------------------------------------
  // PRUEBAS: Composición total (Lee + Kerr)
  // ---------------------------------------------------------------------------

  it('combina correctamente masa muscular y adiposa', () => {
    const modelo = new Modelo2Componentes(medidasBase);
    const resultado = modelo.calcularComposicionMuscularAdiposa();

    expect(resultado.masaMuscular).not.toBeNull();
    expect(resultado.masaAdiposa).not.toBeNull();
    expect(resultado.zAdiposa).not.toBeNull();

    expect(typeof resultado.masaMuscular).toBe('number');
    expect(typeof resultado.masaAdiposa).toBe('number');
  });

  it('produce resultados consistentes (masa muscular mayor que adiposa)', () => {
    const modelo = new Modelo2Componentes(medidasBase);
    const { masaMuscular, masaAdiposa } = modelo.calcularComposicionMuscularAdiposa();
    expect(masaMuscular!).toBeGreaterThan(masaAdiposa!);
  });

  it('maneja valores extremos de altura correctamente', () => {
    const modeloBajo = new Modelo2Componentes({ ...medidasBase, altura: 150 });
    const modeloAlto = new Modelo2Componentes({ ...medidasBase, altura: 200 });
    const [masaBaja] = modeloBajo.calcularMasaAdiposaKerr();
    const [masaAlta] = modeloAlto.calcularMasaAdiposaKerr();
    expect(masaAlta).not.toBeNaN();
    expect(masaBaja).not.toBeNaN();
  });
});
