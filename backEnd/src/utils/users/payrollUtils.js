// Descuentos de ley sobre planilla en El Salvador. El admin ya no los escribe
// a mano al invitar a un empleado (antes pedía "AFP %" y "Renta %" como
// campos libres, lo cual no tiene sentido: son porcentajes fijos que define
// el Ministerio de Hacienda / las AFP, no algo que el negocio decida). Este
// archivo es la única fuente de verdad para calcularlos a partir del salario
// base, para que el admin vea directo el salario neto.
//
// Tasas vigentes (2026), consultadas en fuentes públicas sobre descuentos de
// ley en El Salvador (AFP 7.25%, ISSS 3% con techo de $1,000, ISR según la
// tabla de retención mensual del Ministerio de Hacienda vigente desde la
// reforma de abril 2025 al Art. 37 de la Ley de ISR):
const AFP_RATE = 0.0725;
const ISSS_RATE = 0.03;
const ISSS_MAX_BASE = 1000; // tope de renta imponible para ISSS: máximo $30 de descuento

// Tabla de retención de ISR mensual (tramos sobre la base gravada = salario
// - AFP - ISSS). Cada tramo aplica su porcentaje solo sobre el excedente del
// límite inferior, más una cuota fija.
const ISR_BRACKETS = [
  { upTo: 550, rate: 0, base: 0, over: 0 },
  { upTo: 895.24, rate: 0.10, base: 17.67, over: 550 },
  { upTo: 2038.10, rate: 0.20, base: 60.0, over: 895.24 },
  { upTo: Infinity, rate: 0.30, base: 288.57, over: 2038.10 },
];

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

// Calcula AFP, ISSS, ISR (renta) y el salario neto a partir del salario base
// bruto. Nunca lanza: con un salario inválido, simplemente devuelve todo en 0.
export const calculatePayrollDeductions = (grossSalary) => {
  const salary = Number(grossSalary);
  if (!salary || salary <= 0 || Number.isNaN(salary)) {
    return { grossSalary: 0, afp: 0, isss: 0, isr: 0, netSalary: 0 };
  }

  const afp = round2(salary * AFP_RATE);
  const isss = round2(Math.min(salary, ISSS_MAX_BASE) * ISSS_RATE);
  const taxableBase = salary - afp - isss;

  const bracket = ISR_BRACKETS.find((b) => taxableBase <= b.upTo);
  const isr = round2(bracket.rate === 0 ? 0 : (taxableBase - bracket.over) * bracket.rate + bracket.base);

  const netSalary = round2(salary - afp - isss - isr);

  return { grossSalary: round2(salary), afp, isss, isr, netSalary };
};

export default { calculatePayrollDeductions };
