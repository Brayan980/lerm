import { Modelo4Componentes, Medidas4Componentes, Resultados4Componentes } from '../lib/medidas4Componentes';
describe('Modelo4Componentes', () => {
  let medidasBase: Medidas4Componentes;

  beforeEach(() => {
    medidasBase = {
      peso: 70,
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
      diametroFemur: 9,
      diametroMuñeca: 6,
      diametroHumero: 7
    };
  });

  it('devuelve null si faltan datos para masa muscular', () => {
    const modelo = new Modelo4Componentes({ ...medidasBase, altura: null as any });
    expect(modelo.calcularMasaMuscularLee()).toBeNull();
  });

  it('calcula la masa ósea según Rocha (1975)', () => {
    const modelo = new Modelo4Componentes(medidasBase);
    const masaOsea = modelo.calcularMasaOseaRocha();
    expect(masaOsea).toBeGreaterThan(5);
    expect(masaOsea).toBeLessThan(15);
  });

  it('calcula la masa ósea según Martin (control alterno)', () => {
    const modelo = new Modelo4Componentes(medidasBase);
    const masaOseaMartin = modelo.calcularMasaOseaMartin();
    expect(masaOseaMartin).toBeGreaterThan(0);
  });

  it('calcula la masa adiposa según Kerr (ISAK)', () => {
    const modelo = new Modelo4Componentes(medidasBase);
    const [masaAdiposa, z] = modelo.calcularMasaAdiposaKerr();
    expect(masaAdiposa).not.toBeNull();
    expect(z).not.toBeNull();
    expect(typeof masaAdiposa).toBe('number');
    expect(typeof z).toBe('number');
  });

  it('devuelve null si faltan datos para masa adiposa', () => {
    const modelo = new Modelo4Componentes({ ...medidasBase, pliegueTriceps: null as any });
    const [masa, z] = modelo.calcularMasaAdiposaKerr();
    expect(masa).toBeNull();
    expect(z).toBeNull();
  });

  it('devuelve null si faltan datos para masa residual', () => {
    const modelo = new Modelo4Componentes({ ...medidasBase, peso: null as any });
    expect(modelo.calcularMasaResidualISAK()).toBeNull();
  });

  it('calcula el fraccionamiento completo correctamente', () => {
    const modelo = new Modelo4Componentes(medidasBase);
    const resultados = modelo.calcularFraccionamientoCompleto();

    expect(resultados.masaMuscular).not.toBeNull();
    expect(resultados.masaOsea).not.toBeNull();
    expect(resultados.masaAdiposa).not.toBeNull();
    expect(resultados.masaResidual).not.toBeNull();
    expect(resultados.masaTotal).not.toBeNull();

    // Porcentajes deben sumar aprox. 100
    const suma = [
      resultados.porcentajeMuscular!,
      resultados.porcentajeOsea!,
      resultados.porcentajeAdiposa!,
      resultados.porcentajeResidual!
    ].reduce((a, b) => a + b, 0);

    expect(suma).toBeGreaterThan(90);
    expect(suma).toBeLessThan(110);
  });

  it('usa peso como masa total si algún componente es null', () => {
    const modelo = new Modelo4Componentes({ ...medidasBase, altura: null as any });
    const resultados = modelo.calcularFraccionamientoCompleto();
    expect(resultados.masaTotal).toBe(medidasBase.peso);
  });
});