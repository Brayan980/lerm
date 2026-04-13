export function calcularIMC(peso: number, altura: number): number {
	if (altura === 0) return NaN;
	return peso / (altura * altura);
}
