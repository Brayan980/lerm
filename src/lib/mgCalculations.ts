

// ------------------
// Tipos de apoyo
// ------------------

import { MGResult } from "./types";


// ------------------
// Fórmulas por grupo
// ------------------

// Niños y adolecentes (Slaughter)

// --- Slaughter Niños, Niñas y Adolescentes ---
export function mgNiñosAdolecentesSlaughter(
  sexo: "Masculino" | "Femenino",
  triceps: number,
  piernaMedial: number,
  pesoKg?: number
): MGResult {
  if (sexo === "Masculino") {
    const porcentaje = 0.735 * (triceps + piernaMedial) + 1.0;
    return {
      porcentaje,
      masaKg: pesoKg ? (porcentaje / 100) * pesoKg : null,
      formula: "%MG = 0.735 * (Pl Tríceps + Pl Pierna M) + 1.0",
      referencia: "Slaughter - Niños",
    };
  } else {
    const porcentaje = 0.610 * (triceps + piernaMedial) + 5.1;
    return {
      porcentaje,
      masaKg: pesoKg ? (porcentaje / 100) * pesoKg : null,
      formula: "%MG = 0.610 * (Pl Tríceps + Pl Pierna M) + 5.1",
      referencia: "Slaughter - Niñas",
    };
  }
}

export function mgNiños(
  triceps: number,
  piernaMedial: number,
  pesoKg?: number
): MGResult {
  const porcentaje = 0.735 * (triceps + piernaMedial) + 1.0;
  return {
    porcentaje,
    masaKg: pesoKg ? (porcentaje / 100) * pesoKg : null,
    formula: "%MG = 0.735 * (Pl Tríceps + Pl Pierna M) + 1.0",
    referencia: "Slaughter - Niños",
  };
}

export function mgNiñas(
  triceps: number,
  piernaMedial: number,
  pesoKg?: number
): MGResult {
  const porcentaje = 0.610 * (triceps + piernaMedial) + 5.1;
  return {
    porcentaje,
    masaKg: pesoKg ? (porcentaje / 100) * pesoKg : null,
    formula: "%MG = 0.610 * (Pl Tríceps + Pl Pierna M) + 5.1",
    referencia: "Slaughter - Niñas",
  };
}

/**
 * Calcula Densidad Corporal (DC) según edad, sexo y suma de pliegues.
 * Usa fórmulas de Durnin–Womersley
 */
export function calcularDCAdultos(
  sexo: "Masculino" | "Femenino",
  edad: number,
  triceps: number,
  biceps: number,
  subescapular: number,
  crestaIliaca: number
): { dc: number; formula: string } {
  const sumaPliegues = triceps + biceps + subescapular + crestaIliaca;
  const logSum = Math.log10(sumaPliegues);

  let dc = 0;
  let formula = "";

  if (sexo === "Masculino") {
    if (edad >= 20 && edad <= 29) {
      dc = 1.1631 - 0.0632 * logSum;
      formula = "Hombres 20-29: 1.1631 - 0.0632*log10(Suma)";
    } else if (edad >= 30 && edad <= 39) {
      dc = 1.1422 - 0.0544 * logSum;
      formula = "Hombres 30-39: 1.1422 - 0.0544*log10(Suma)";
    } else if (edad >= 40 && edad <= 49) {
      dc = 1.1620 - 0.0700 * logSum;
      formula = "Hombres 40-49: 1.1620 - 0.0700*log10(Suma)";
    } else if (edad >= 50 && edad <= 72) {
      dc = 1.1715 - 0.0799 * logSum;
      formula = "Hombres 50-72: 1.1715 - 0.0799*log10(Suma)";
    }
  } else if (sexo === "Femenino") {
    if (edad >= 20 && edad <= 29) {
      dc = 1.1599 - 0.0717 * logSum;
      formula = "Mujeres 20-29: 1.1599 - 0.0717*log10(Suma)";
    } else if (edad >= 30 && edad <= 39) {
      dc = 1.1423 - 0.0632 * logSum;
      formula = "Mujeres 30-39: 1.1423 - 0.0632*log10(Suma)";
    } else if (edad >= 40 && edad <= 49) {
      dc = 1.1333 - 0.0612 * logSum;
      formula = "Mujeres 40-49: 1.1333 - 0.0612*log10(Suma)";
    } else if (edad >= 50 && edad <= 68) {
      dc = 1.1339 - 0.0645 * logSum;
      formula = "Mujeres 50-68: 1.1339 - 0.0645*log10(Suma)";
    }
  }

  return { dc, formula };
}

/**
 * Calcula % de Grasa Corporal usando Durnin–Womersley + Siri
 */
export function mgAdultosDurninWomersley(
  sexo: "Masculino" | "Femenino",
  edad: number,
  triceps: number,
  biceps: number,
  subescapular: number,
  crestaIliaca: number,
  pesoKg?: number
): MGResult {
  const { dc, formula } = calcularDCAdultos(
    sexo,
    edad,
    triceps,
    biceps,
    subescapular,
    crestaIliaca
  );

  if (!dc) {
    return {
      porcentaje: null,
      masaKg: null,
      formula,
      referencia: "Durnin-Womersley + Siri",
    };
  }

  const porcentaje = (495 / dc) - 450;
  return {
    porcentaje,
    masaKg: pesoKg ? (porcentaje / 100) * pesoKg : null,
    formula: `${formula} → %MG = (495 / DC) - 450`,
    referencia: "Durnin-Womersley + Siri",
  };
}


// Deportistas hombres (Faulkner)
export function mgDeportistasHombresFaulkner(
  triceps: number,
  subescapular: number,
  supraespinal: number,
  abdominal: number,
  pesoKg?: number
): MGResult {
  const porcentaje = 0.153 * (triceps + subescapular + supraespinal + abdominal) + 5.783;
  return {
    porcentaje,
    masaKg: pesoKg ? (porcentaje / 100) * pesoKg : undefined,
    formula: "%MG = 0.153 * (Tri + Sub + Sesp + Abd) + 5.783",
    referencia: "Faulkner - Hombres deportistas",
  };
}


export function mgDeportistasFaulkner(
  sexo: "Masculino" | "Femenino",
  triceps: number,
  subescapular: number,
  supraespinal: number,
  abdominal: number,
  pesoKg?: number,
){
  if (sexo === "Masculino") {
    return mgDeportistasHombresFaulkner(triceps, subescapular, supraespinal, abdominal, pesoKg);
  }else{
    return mgDeportistasMujeresFaulkner(triceps, subescapular, supraespinal, abdominal, pesoKg);
  }
}

// Deportistas mujeres (Faulkner)
export function mgDeportistasMujeresFaulkner(
  triceps: number,
  subescapular: number,
  supraespinal: number,
  abdominal: number,
  pesoKg?: number
): MGResult {
  const porcentaje = 0.213 * (triceps + subescapular + supraespinal + abdominal) + 7.9;
  return {
    porcentaje,
    masaKg: pesoKg ? (porcentaje / 100) * pesoKg : null,
    formula: "%MG = 0.213 * (Tri + Sub + Sesp + Abd) + 7.9",
    referencia: "Faulkner - Mujeres deportistas",
  };
}


export function mgDeportistasCarter(
  sexo: "Masculino" | "Femenino",
  triceps: number,
  subescapular: number,
  supraespinal: number,
  abdominal: number,
  musloAnterior: number,
  piernaMedial: number,
  pesoKg?: number,
){
  if (sexo === "Masculino") {
    return mgDeportistasHombresCarter(triceps, subescapular, supraespinal, abdominal, musloAnterior, piernaMedial, pesoKg);
  }else{
    return mgDeportistasMujeresCarter(triceps, subescapular, supraespinal, abdominal, musloAnterior, piernaMedial, pesoKg);
  }
}

// Deportistas hombres (Carter)
export function mgDeportistasHombresCarter(
  triceps: number,
  subescapular: number,
  supraespinal: number,
  abdominal: number,
  musloAnterior: number,
  piernaMedial: number,
  pesoKg?: number
): MGResult {
  const porcentaje = 0.1051 * (triceps + subescapular + supraespinal + abdominal + musloAnterior + piernaMedial) + 2.58;
  return {
    porcentaje,
    masaKg: pesoKg ? (porcentaje / 100) * pesoKg : null,
    formula: "%MG = 0.1051 * (Tri + Sub + Sesp + Abd + MA + PM) + 2.58",
    referencia: "Carter - Hombres deportistas",
  };
}

// Deportistas mujeres (Carter)
export function mgDeportistasMujeresCarter(
  triceps: number,
  subescapular: number,
  supraespinal: number,
  abdominal: number,
  musloAnterior: number,
  piernaMedial: number,
  pesoKg?: number
): MGResult {
  const porcentaje = 0.1548 * (triceps + subescapular + supraespinal + abdominal + musloAnterior + piernaMedial) + 3.58;
  return {
    porcentaje,
    masaKg: pesoKg ? (porcentaje / 100) * pesoKg : null,
    formula: "%MG = 0.1548 * (Tri + Sub + Sesp + Abd + MA + PM) + 3.58",
    referencia: "Carter - Mujeres deportistas",
  };
}

export function mgObsesos(
  sexo: "Masculino" | "Femenino",
  perimetroAbd: number,
  pesoKg: number,
  tallaCm?: number  //solo es obligatorio en mujeres
): MGResult {

  if (sexo === "Masculino") {
    const porcentaje = 0.31457 * perimetroAbd - 0.10969 * pesoKg + 10.8336;
    return {
      porcentaje,
      masaKg: (porcentaje / 100) * pesoKg,
      formula: "%GC = 0.31457*PAbd - 0.10969*Peso + 10.8336",
      referencia: "Weltman - Obesos Hombres",
    };
  }else{
  
    const porcentaje = 0.11077 * perimetroAbd - 0.17666 * tallaCm! + 0.14354 * pesoKg + 51.03301;
    return {
      porcentaje,
      masaKg: (porcentaje / 100) * pesoKg,
      formula: "%GC = 0.11077*PAbd - 0.17666*Talla + 0.14354*Peso + 51.03301",
      referencia: "Weltman - Obesos Mujeres",
    };
  }

}

// // Obesos (Weltman)
// export function mgObesosHombres(
//   perimetroAbd: number,
//   pesoKg: number
// ): MGResult {
//   const porcentaje = 0.31457 * perimetroAbd - 0.10969 * pesoKg + 10.8336;
//   return {
//     porcentaje,
//     masaKg: (porcentaje / 100) * pesoKg,
//     formula: "%GC = 0.31457*PAbd - 0.10969*Peso + 10.8336",
//     referencia: "Weltman - Obesos Hombres",
//   };
// }

// // Obesos (Weltman)
// export function mgObesosMujeres(
//   perimetroAbd: number,
//   tallaCm: number,
//   pesoKg: number
// ): MGResult {
//   const porcentaje = 0.11077 * perimetroAbd - 0.17666 * tallaCm + 0.14354 * pesoKg + 51.03301;
//   return {
//     porcentaje,
//     masaKg: (porcentaje / 100) * pesoKg,
//     formula: "%GC = 0.11077*PAbd - 0.17666*Talla + 0.14354*Peso + 51.03301",
//     referencia: "Weltman - Obesos Mujeres",
//   };
// }
