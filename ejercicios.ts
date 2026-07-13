// ejercicios.ts

// 1. TUS CATEGORÍAS ESTILO HEVY
export const GRUPOS_MUSCULARES = [
  "Todos Músculos",
  "Abdominales",
  "Abductores",
  "Adductores",
  "Antebrazos",
  "Bíceps",
  "Cardio",
  "Cuádriceps",
  "Cuello",
  "Cuerpo Entero",
  "Dorsales",
  "Espalda Baja",
  "Espalda Superior",
  "Gemelos",
  "Glúteos",
  "Hombros",
  "Isquiotibiales",
  "Pecho",
  "Trapecio",
  "Tríceps",
  "Otro",
];

export const EQUIPAMIENTO = [
  "Todo Equipamiento",
  "Ninguno",
  "Banda de Resistencia",
  "Banda de Suspensión",
  "Barra",
  "Mancuerna",
  "Máquina",
  "Pesa Rusa",
  "Placa de Peso",
  "Otro",
];

export const MUSCULOS_CREACION = GRUPOS_MUSCULARES.filter(
  (m) => m !== "Todos Músculos",
);

// 2. LA SÚPER BASE DE DATOS EN ESPAÑOL DE GIMNASIO (Curada)
export const EJERCICIOS_DB = [
  // ================= PECHO =================
  {
    id: "p1",
    nombre: "Press de Banca (Barra)",
    musculo: "Pecho",
    equipamiento: "Barra",
    imagenUrl: "",
    gifUrl:
      "https://fitnessprogramer.com/wp-content/uploads/2021/02/Barbell-Bench-Press.gif",
    descripcion:
      "Acuéstate en el banco, baja la barra hasta tocar el pecho y empuja de manera explosiva.",
    musculosTrabajados: ["Pecho", "Tríceps", "Hombros"],
  },
  {
    id: "p2",
    nombre: "Press Inclinado (Mancuernas)",
    musculo: "Pecho",
    equipamiento: "Mancuerna",
    imagenUrl: "",
    gifUrl: "",
    descripcion:
      "Ideal para el haz clavicular (pecho superior). Mantén los codos a 45 grados.",
    musculosTrabajados: ["Pecho", "Hombros", "Tríceps"],
  },
  {
    id: "p3",
    nombre: "Press Inclinado (Barra)",
    musculo: "Pecho",
    equipamiento: "Barra",
    imagenUrl: "",
    gifUrl:
      "https://fitnessprogramer.com/wp-content/uploads/2021/02/Incline-Barbell-Bench-Press.gif",
    descripcion: "Press con barra en banco a 30-45 grados.",
    musculosTrabajados: ["Pecho", "Hombros", "Tríceps"],
  },
  {
    id: "p4",
    nombre: "Aperturas con Mancuernas (Flys)",
    musculo: "Pecho",
    equipamiento: "Mancuerna",
    imagenUrl: "",
    gifUrl:
      "https://fitnessprogramer.com/wp-content/uploads/2021/02/Dumbbell-Flys.gif",
    descripcion:
      "Siente el estiramiento en el pectoral al bajar. No flexiones demasiado los codos.",
    musculosTrabajados: ["Pecho"],
  },
  {
    id: "p5",
    nombre: "Cruces en Polea Alta",
    musculo: "Pecho",
    equipamiento: "Máquina",
    imagenUrl: "",
    gifUrl: "",
    descripcion:
      "Cruce de poleas de arriba hacia abajo, enfocando la parte inferior del pecho.",
    musculosTrabajados: ["Pecho"],
  },
  {
    id: "p6",
    nombre: "Pec Deck (Máquina de Aperturas)",
    musculo: "Pecho",
    equipamiento: "Máquina",
    imagenUrl: "",
    gifUrl:
      "https://fitnessprogramer.com/wp-content/uploads/2021/02/Pec-Deck-Fly.gif",
    descripcion: "Aísla el pectoral. Aprieta un segundo al juntar las manos.",
    musculosTrabajados: ["Pecho"],
  },
  {
    id: "p7",
    nombre: "Flexiones de Brazos (Push-ups)",
    musculo: "Pecho",
    equipamiento: "Ninguno",
    imagenUrl: "",
    gifUrl:
      "https://fitnessprogramer.com/wp-content/uploads/2021/02/Push-Up.gif",
    descripcion: "El ejercicio clásico de peso corporal para el pecho.",
    musculosTrabajados: ["Pecho", "Tríceps", "Hombros", "Abdominales"],
  },

  // ================= ESPALDA =================
  {
    id: "e1",
    nombre: "Dominadas (Pull-ups)",
    musculo: "Dorsales",
    equipamiento: "Ninguno",
    imagenUrl: "",
    gifUrl:
      "https://fitnessprogramer.com/wp-content/uploads/2021/02/Pull-up.gif",
    descripcion:
      "Agarre prono, más ancho que los hombros. Lleva el pecho a la barra.",
    musculosTrabajados: ["Dorsales", "Bíceps", "Espalda Superior"],
  },
  {
    id: "e2",
    nombre: "Dominadas Asistidas",
    musculo: "Dorsales",
    equipamiento: "Máquina",
    imagenUrl: "",
    gifUrl:
      "https://fitnessprogramer.com/wp-content/uploads/2021/04/Assisted-Pull-up.gif",
    descripcion: "Dominadas utilizando la máquina de ayuda por contrapeso.",
    musculosTrabajados: ["Dorsales", "Bíceps"],
  },
  {
    id: "e3",
    nombre: "Jalón al Pecho (Polea)",
    musculo: "Dorsales",
    equipamiento: "Máquina",
    imagenUrl: "",
    gifUrl:
      "https://fitnessprogramer.com/wp-content/uploads/2021/02/Lat-Pulldown.gif",
    descripcion: "Tira de la barra hacia la clavícula sacando pecho.",
    musculosTrabajados: ["Dorsales", "Bíceps", "Espalda Superior"],
  },
  {
    id: "e4",
    nombre: "Remo con Barra",
    musculo: "Espalda Superior",
    equipamiento: "Barra",
    imagenUrl: "",
    gifUrl:
      "https://fitnessprogramer.com/wp-content/uploads/2021/02/Bent-Over-Barbell-Row.gif",
    descripcion: "Torso inclinado a 45°. Tira de la barra hacia el ombligo.",
    musculosTrabajados: [
      "Espalda Superior",
      "Dorsales",
      "Espalda Baja",
      "Bíceps",
    ],
  },
  {
    id: "e5",
    nombre: "Remo con Mancuerna a 1 Mano",
    musculo: "Dorsales",
    equipamiento: "Mancuerna",
    imagenUrl: "",
    gifUrl:
      "https://fitnessprogramer.com/wp-content/uploads/2021/02/Dumbbell-Row.gif",
    descripcion:
      "Apoya rodilla y mano en un banco. Lleva la mancuerna hacia la cadera.",
    musculosTrabajados: ["Dorsales", "Espalda Superior", "Bíceps"],
  },
  {
    id: "e6",
    nombre: "Remo en T (Barra)",
    musculo: "Espalda Superior",
    equipamiento: "Barra",
    imagenUrl: "",
    gifUrl:
      "https://fitnessprogramer.com/wp-content/uploads/2021/02/Barbell-Bent-Over-Row.gif",
    descripcion:
      "Remo usando el accesorio en V o un extremo de la barra anclado.",
    musculosTrabajados: ["Espalda Superior", "Dorsales", "Trapecio"],
  },
  {
    id: "e7",
    nombre: "Remo Gironda (Polea Baja)",
    musculo: "Espalda Superior",
    equipamiento: "Máquina",
    imagenUrl: "",
    gifUrl:
      "https://fitnessprogramer.com/wp-content/uploads/2021/06/close-grip-cable-row.gif",
    descripcion: "Remo sentado en polea, manteniendo la espalda recta.",
    musculosTrabajados: ["Espalda Superior", "Dorsales", "Bíceps"],
  },
  {
    id: "e8",
    nombre: "Pulldown con Brazos Rectos",
    musculo: "Dorsales",
    equipamiento: "Máquina",
    imagenUrl: "",
    gifUrl:
      "https://fitnessprogramer.com/wp-content/uploads/2021/05/Cable-Straight-Arm-Pulldown.gif",
    descripcion:
      "Excelente aislamiento para los dorsales usando polea alta con soga o barra recta.",
    musculosTrabajados: ["Dorsales"],
  },

  // ================= PIERNAS (CUÁDRICEPS Y GEMELOS) =================
  {
    id: "c1",
    nombre: "Sentadilla Libre (Barra)",
    musculo: "Cuádriceps",
    equipamiento: "Barra",
    imagenUrl: "",
    gifUrl:
      "https://fitnessprogramer.com/wp-content/uploads/2021/02/BARBELL-SQUAT.gif",
    descripcion:
      "El rey de los ejercicios. Rompe el paralelo bajando con control.",
    musculosTrabajados: [
      "Cuádriceps",
      "Glúteos",
      "Isquiotibiales",
      "Espalda Baja",
    ],
  },
  {
    id: "c2",
    nombre: "Prensa de Piernas (Leg Press)",
    musculo: "Cuádriceps",
    equipamiento: "Máquina",
    imagenUrl: "",
    gifUrl:
      "https://fitnessprogramer.com/wp-content/uploads/2021/02/Leg-Press.gif",
    descripcion:
      "Pies abajo para enfocar cuádriceps, pies arriba para glúteos.",
    musculosTrabajados: ["Cuádriceps", "Glúteos"],
  },
  {
    id: "c3",
    nombre: "Sentadilla Hack",
    musculo: "Cuádriceps",
    equipamiento: "Máquina",
    imagenUrl: "",
    gifUrl:
      "https://fitnessprogramer.com/wp-content/uploads/2021/02/Sled-Hack-Squat.gif",
    descripcion:
      "Sentadilla guiada en máquina que destruye los cuádriceps de forma segura.",
    musculosTrabajados: ["Cuádriceps", "Glúteos"],
  },
  {
    id: "c4",
    nombre: "Sentadilla Búlgara",
    musculo: "Cuádriceps",
    equipamiento: "Mancuerna",
    imagenUrl: "",
    gifUrl:
      "https://fitnessprogramer.com/wp-content/uploads/2021/05/Dumbbell-Bulgarian-Split-Squat.gif",
    descripcion:
      "Apoya el pie trasero en un banco. Bajar derecho enfoca cuádriceps, inclinarse enfoca glúteos.",
    musculosTrabajados: ["Cuádriceps", "Glúteos"],
  },
  {
    id: "c5",
    nombre: "Sillón de Cuádriceps (Extensiones)",
    musculo: "Cuádriceps",
    equipamiento: "Máquina",
    imagenUrl: "",
    gifUrl:
      "https://fitnessprogramer.com/wp-content/uploads/2021/02/Leg-Extension.gif",
    descripcion:
      "Aislamiento puro. Pausa un segundo arriba apretando el músculo.",
    musculosTrabajados: ["Cuádriceps"],
  },
  {
    id: "g1",
    nombre: "Elevación de Gemelos de Pie",
    musculo: "Gemelos",
    equipamiento: "Máquina",
    imagenUrl: "",
    gifUrl:
      "https://fitnessprogramer.com/wp-content/uploads/2021/09/Bench-Press-Machine-Standing-Calf-Raise.gif",
    descripcion:
      "Movimiento completo: estira bien abajo y contrae fuerte arriba.",
    musculosTrabajados: ["Gemelos"],
  },
  {
    id: "g2",
    nombre: "Elevación de Gemelos Sentado",
    musculo: "Gemelos",
    equipamiento: "Máquina",
    imagenUrl: "",
    gifUrl:
      "https://fitnessprogramer.com/wp-content/uploads/2021/06/Lever-Seated-Calf-Raise.gif",
    descripcion: "Enfocado en el músculo sóleo del gemelo.",
    musculosTrabajados: ["Gemelos"],
  },

  // ================= PIERNAS (ISQUIOS Y GLÚTEOS) =================
  {
    id: "i1",
    nombre: "Peso Muerto Rumano (Barra)",
    musculo: "Isquiotibiales",
    equipamiento: "Barra",
    imagenUrl: "",
    gifUrl:
      "https://fitnessprogramer.com/wp-content/uploads/2021/02/Romanian-Deadlift.gif",
    descripcion: "Rodillas semi-flexionadas. Lleva la cadera bien hacia atrás.",
    musculosTrabajados: ["Isquiotibiales", "Glúteos", "Espalda Baja"],
  },
  {
    id: "i2",
    nombre: "Peso Muerto Rumano (Mancuernas)",
    musculo: "Isquiotibiales",
    equipamiento: "Mancuerna",
    imagenUrl: "",
    gifUrl:
      "https://fitnessprogramer.com/wp-content/uploads/2021/02/Dumbbell-Romanian-Deadlift.gif",
    descripcion: "Versión con mancuernas para mayor rango de movimiento.",
    musculosTrabajados: ["Isquiotibiales", "Glúteos"],
  },
  {
    id: "i3",
    nombre: "Curl de Isquiotibiales Acostado",
    musculo: "Isquiotibiales",
    equipamiento: "Máquina",
    imagenUrl: "",
    gifUrl:
      "https://fitnessprogramer.com/wp-content/uploads/2021/02/Leg-Curl.gif",
    descripcion: "Mantén la cadera pegada a la máquina mientras flexionas.",
    musculosTrabajados: ["Isquiotibiales", "Gemelos"],
  },
  {
    id: "i4",
    nombre: "Curl de Isquiotibiales Sentado",
    musculo: "Isquiotibiales",
    equipamiento: "Máquina",
    imagenUrl: "",
    gifUrl:
      "https://fitnessprogramer.com/wp-content/uploads/2021/02/Seated-Leg-Curl.gif",
    descripcion: "Aislamiento súper efectivo para isquios.",
    musculosTrabajados: ["Isquiotibiales"],
  },
  {
    id: "gl1",
    nombre: "Hip Thrust (Barra)",
    musculo: "Glúteos",
    equipamiento: "Barra",
    imagenUrl: "",
    gifUrl:
      "https://fitnessprogramer.com/wp-content/uploads/2021/02/Barbell-Hip-Thrust.gif",
    descripcion:
      "Espalda alta en el banco, empuje de cadera apretando glúteos arriba.",
    musculosTrabajados: ["Glúteos", "Isquiotibiales"],
  },
  {
    id: "gl2",
    nombre: "Patada de Glúteo (Polea)",
    musculo: "Glúteos",
    equipamiento: "Máquina",
    imagenUrl: "",
    gifUrl:
      "https://fitnessprogramer.com/wp-content/uploads/2021/05/Cable-Donkey-Kickback.gif",
    descripcion:
      "Engancha el tobillo a la polea baja y da la patada hacia atrás apretando arriba.",
    musculosTrabajados: ["Glúteos"],
  },

  // ================= HOMBROS Y TRAPECIO =================
  {
    id: "h1",
    nombre: "Press Militar (Barra)",
    musculo: "Hombros",
    equipamiento: "Barra",
    imagenUrl: "",
    gifUrl:
      "https://fitnessprogramer.com/wp-content/uploads/2021/02/Barbell-Shoulder-Press.gif",
    descripcion:
      "Press vertical de pie. Aprieta abdominales y glúteos para estabilidad.",
    musculosTrabajados: ["Hombros", "Tríceps", "Abdominales"],
  },
  {
    id: "h2",
    nombre: "Press de Hombros (Mancuernas)",
    musculo: "Hombros",
    equipamiento: "Mancuerna",
    imagenUrl: "",
    gifUrl:
      "https://fitnessprogramer.com/wp-content/uploads/2021/02/Dumbbell-Shoulder-Press.gif",
    descripcion:
      "Sentado en banco a 90 grados. No bajes los codos más allá de las orejas.",
    musculosTrabajados: ["Hombros", "Tríceps"],
  },
  {
    id: "h3",
    nombre: "Elevaciones Laterales (Mancuernas)",
    musculo: "Hombros",
    equipamiento: "Mancuerna",
    imagenUrl: "",
    gifUrl:
      "https://fitnessprogramer.com/wp-content/uploads/2021/02/Dumbbell-Lateral-Raise.gif",
    descripcion:
      "El mejor para ensanchar los hombros. Vuelca levemente las manos como si sirvieras agua.",
    musculosTrabajados: ["Hombros"],
  },
  {
    id: "h4",
    nombre: "Elevaciones Laterales (Polea)",
    musculo: "Hombros",
    equipamiento: "Máquina",
    imagenUrl: "",
    gifUrl:
      "https://fitnessprogramer.com/wp-content/uploads/2021/07/one-arm-Cable-Lateral-Raise.gif",
    descripcion: "Mantiene tensión constante durante todo el movimiento.",
    musculosTrabajados: ["Hombros"],
  },
  {
    id: "h5",
    nombre: "Vuelos Posteriores (Máquina Pec-Deck)",
    musculo: "Hombros",
    equipamiento: "Máquina",
    imagenUrl: "",
    gifUrl:
      "https://fitnessprogramer.com/wp-content/uploads/2021/02/Rear-Delt-Machine-Flys.gif",
    descripcion:
      "Siéntate al revés en la máquina de aperturas para trabajar el deltoides posterior.",
    musculosTrabajados: ["Hombros", "Espalda Superior"],
  },
  {
    id: "h6",
    nombre: "Face Pull (Polea)",
    musculo: "Hombros",
    equipamiento: "Máquina",
    imagenUrl: "",
    gifUrl:
      "https://fitnessprogramer.com/wp-content/uploads/2021/02/Face-Pull.gif",
    descripcion: "Lleva la soga hacia tus ojos separando las manos al final.",
    musculosTrabajados: ["Hombros", "Espalda Superior", "Trapecio"],
  },
  {
    id: "h7",
    nombre: "Encogimientos de Hombros (Trapecio)",
    musculo: "Trapecio",
    equipamiento: "Mancuerna",
    imagenUrl: "",
    gifUrl:
      "https://fitnessprogramer.com/wp-content/uploads/2021/04/Dumbbell-Shrug.gif",
    descripcion:
      "Intenta tocar tus orejas con tus hombros. Sostén un segundo arriba.",
    musculosTrabajados: ["Trapecio", "Cuello"],
  },

  // ================= BRAZOS (BÍCEPS) =================
  {
    id: "b1",
    nombre: "Curl de Bíceps (Barra recta o EZ)",
    musculo: "Bíceps",
    equipamiento: "Barra",
    imagenUrl: "",
    gifUrl:
      "https://fitnessprogramer.com/wp-content/uploads/2021/08/Reverse-Grip-EZ-Bar-Curl.gif",
    descripcion: "Mantén los codos pegados al cuerpo, no balancees la espalda.",
    musculosTrabajados: ["Bíceps", "Antebrazos"],
  },
  {
    id: "b2",
    nombre: "Curl de Bíceps Alterno (Mancuernas)",
    musculo: "Bíceps",
    equipamiento: "Mancuerna",
    imagenUrl: "",
    gifUrl:
      "https://fitnessprogramer.com/wp-content/uploads/2021/02/Dumbbell-Curl.gif",
    descripcion:
      "Rota la muñeca (supinación) al subir para máxima contracción.",
    musculosTrabajados: ["Bíceps"],
  },
  {
    id: "b3",
    nombre: "Curl Martillo",
    musculo: "Bíceps",
    equipamiento: "Mancuerna",
    imagenUrl: "",
    gifUrl:
      "https://fitnessprogramer.com/wp-content/uploads/2021/02/Hammer-Curl.gif",
    descripcion:
      "Agarre neutro (como si agarraras un martillo). Engrosa el brazo desde el frente.",
    musculosTrabajados: ["Bíceps", "Antebrazos"],
  },
  {
    id: "b4",
    nombre: "Curl Predicador (Banco Scott)",
    musculo: "Bíceps",
    equipamiento: "Barra",
    imagenUrl: "",
    gifUrl:
      "https://fitnessprogramer.com/wp-content/uploads/2021/02/Z-Bar-Preacher-Curl.gif",
    descripcion: "Apoya los tríceps en el banco para evitar hacer trampa.",
    musculosTrabajados: ["Bíceps"],
  },
  {
    id: "b5",
    nombre: "Curl en Polea Baja",
    musculo: "Bíceps",
    equipamiento: "Máquina",
    imagenUrl: "",
    gifUrl:
      "https://fitnessprogramer.com/wp-content/uploads/2021/02/cable-curl.gif",
    descripcion: "Tensión constante en el músculo garantizada.",
    musculosTrabajados: ["Bíceps"],
  },

  // ================= BRAZOS (TRÍCEPS) =================
  {
    id: "t1",
    nombre: "Extensión de Tríceps (Polea con Soga)",
    musculo: "Tríceps",
    equipamiento: "Máquina",
    imagenUrl: "",
    gifUrl:
      "https://fitnessprogramer.com/wp-content/uploads/2021/02/Pushdown.gif",
    descripcion: "Abre la soga al final del movimiento hacia afuera.",
    musculosTrabajados: ["Tríceps"],
  },
  {
    id: "t2",
    nombre: "Extensión de Tríceps (Polea con Barra recta)",
    musculo: "Tríceps",
    equipamiento: "Máquina",
    imagenUrl: "",
    gifUrl:
      "https://fitnessprogramer.com/wp-content/uploads/2021/02/Pushdown.gif",
    descripcion: "Permite cargar más peso que con la soga.",
    musculosTrabajados: ["Tríceps"],
  },
  {
    id: "t3",
    nombre: "Press Francés (Barra EZ)",
    musculo: "Tríceps",
    equipamiento: "Barra",
    imagenUrl: "",
    gifUrl:
      "https://fitnessprogramer.com/wp-content/uploads/2021/02/Barbell-Triceps-Extension.gif",
    descripcion:
      "Acostado, lleva la barra hacia la frente o detrás de la cabeza.",
    musculosTrabajados: ["Tríceps"],
  },
  {
    id: "t4",
    nombre: "Extensión Tras Nuca (Mancuerna o Polea)",
    musculo: "Tríceps",
    equipamiento: "Mancuerna",
    imagenUrl: "",
    gifUrl:
      "https://fitnessprogramer.com/wp-content/uploads/2021/04/Cable-Rope-Overhead-Triceps-Extension.gif",
    descripcion: "Excelente para trabajar la cabeza larga del tríceps.",
    musculosTrabajados: ["Tríceps"],
  },
  {
    id: "t5",
    nombre: "Fondos en Paralelas (Dips)",
    musculo: "Tríceps",
    equipamiento: "Ninguno",
    imagenUrl: "",
    gifUrl:
      "https://fitnessprogramer.com/wp-content/uploads/2021/02/Triceps-Dips.gif",
    descripcion:
      "Cuerpo recto enfoca tríceps, cuerpo inclinado hacia adelante enfoca pecho.",
    musculosTrabajados: ["Tríceps", "Pecho", "Hombros"],
  },

  // ================= ABDOMINALES =================
  {
    id: "a1",
    nombre: "Crunch Abdominal",
    musculo: "Abdominales",
    equipamiento: "Ninguno",
    imagenUrl: "",
    gifUrl:
      "https://fitnessprogramer.com/wp-content/uploads/2015/11/Crunch.gif",
    descripcion:
      "Enrolla el torso como si quisieras juntar el esternón con el ombligo.",
    musculosTrabajados: ["Abdominales"],
  },
  {
    id: "a2",
    nombre: "Elevación de Piernas Colgado",
    musculo: "Abdominales",
    equipamiento: "Ninguno",
    imagenUrl: "",
    gifUrl:
      "https://fitnessprogramer.com/wp-content/uploads/2021/05/Captains-Chair-Leg-Raise.gif",
    descripcion:
      "Colgado de la barra de dominadas, levanta las rodillas o piernas rectas al pecho.",
    musculosTrabajados: ["Abdominales", "Antebrazos"],
  },
  {
    id: "a3",
    nombre: "Rueda Abdominal (Ab Roller)",
    musculo: "Abdominales",
    equipamiento: "Otro",
    imagenUrl: "",
    gifUrl:
      "https://fitnessprogramer.com/wp-content/uploads/2021/06/Ab-Wheel-Rollout.gif",
    descripcion: "Aprieta fuerte el abdomen para no curvar la espalda baja.",
    musculosTrabajados: ["Abdominales", "Cuerpo Entero"],
  },
  {
    id: "a4",
    nombre: "Plancha (Plank)",
    musculo: "Abdominales",
    equipamiento: "Ninguno",
    imagenUrl: "",
    gifUrl:
      "https://fitnessprogramer.com/wp-content/uploads/2025/07/body-saw-plank.gif",
    descripcion: "Mantén el cuerpo como una tabla recta. Isométrico puro.",
    musculosTrabajados: ["Abdominales", "Hombros"],
  },
];
