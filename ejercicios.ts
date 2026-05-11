// ejercicios.ts

export const GRUPOS_MUSCULARES = [
  "Todos",
  "Piernas",
  "Pecho",
  "Espalda",
  "Hombros",
  "Brazos",
];
export const MUSCULOS_CREACION = [
  "Pecho",
  "Espalda",
  "Hombros",
  "Bíceps",
  "Tríceps",
  "Cuádriceps",
  "Isquitibiales",
  "Glúteos",
  "Pantorrillas",
  "Abdomen",
  "Antebrazos",
];

export const EJERCICIOS_DB = [
  {
    id: "1",
    nombre: "Sentadilla Libre",
    musculo: "Piernas",
    imagenUrl:
      "https://my.lyfta.app/_next/image?url=https%3A%2F%2Fapilyfta.com%2Fstatic%2FGymvisualPNG%2F00431101-Barbell-Full-Squat_Thighs_small.png&w=640&q=75", // Ejemplo
    gifUrl:
      "https://fitcron.com/wp-content/uploads/2021/04/00631301-Barbell-Narrow-Stance-Squat_Thighs_720.gif", // Ejemplo
    descripcion:
      "Párate con los pies a la anchura de los hombros, baja las caderas manteniendo la espalda recta hasta que tus muslos estén paralelos al suelo y vuelve a subir.",
    musculosTrabajados: ["Cuádriceps", "Glúteos", "Isquiotibiales"],
  },
  {
    id: "2",
    nombre: "Prensa 45°",
    musculo: "Piernas",
    imagenUrl: "",
    gifUrl: "",
    descripcion:
      "Empuja la plataforma con las piernas hasta extenderlas casi por completo, luego baja controladamente.",
    musculosTrabajados: ["Cuádriceps", "Glúteos"],
  },
  {
    id: "3",
    nombre: "Sillón de Cuádriceps",
    musculo: "Piernas",
    imagenUrl: "",
    gifUrl: "",
    descripcion: "Extensión de rodillas en máquina.",
    musculosTrabajados: ["Cuádriceps"],
  },
  {
    id: "4",
    nombre: "Peso Muerto Rumano",
    musculo: "Piernas",
    imagenUrl: "",
    gifUrl: "",
    descripcion: "Flexión de cadera con piernas semi-rígidas.",
    musculosTrabajados: ["Isquiotibiales", "Glúteos", "Lumbares"],
  },
  {
    id: "5",
    nombre: "Press de Banca Plano",
    musculo: "Pecho",
    imagenUrl: "",
    gifUrl: "",
    descripcion:
      "Acuéstate en un banco plano, baja la barra hasta el pecho y empújala hacia arriba.",
    musculosTrabajados: ["Pectoral Mayor", "Tríceps", "Deltoides Anterior"],
  },
  {
    id: "6",
    nombre: "Cruce en Poleas",
    musculo: "Pecho",
    imagenUrl: "",
    gifUrl: "",
    descripcion: "Aducción de brazos en polea alta.",
    musculosTrabajados: ["Pectoral Mayor"],
  },
  {
    id: "7",
    nombre: "Dominadas",
    musculo: "Espalda",
    imagenUrl: "",
    gifUrl: "",
    descripcion: "Tracción vertical con peso corporal.",
    musculosTrabajados: ["Dorsal Ancho", "Bíceps"],
  },
  {
    id: "8",
    nombre: "Remo con Barra",
    musculo: "Espalda",
    imagenUrl: "",
    gifUrl: "",
    descripcion: "Tracción horizontal con barra.",
    musculosTrabajados: ["Dorsal Ancho", "Trapecios"],
  },
  {
    id: "9",
    nombre: "Press Militar",
    musculo: "Hombros",
    imagenUrl: "",
    gifUrl: "",
    descripcion: "Empuje vertical con barra o mancuernas.",
    musculosTrabajados: ["Deltoides Anterior", "Tríceps"],
  },
  {
    id: "10",
    nombre: "Elevaciones Laterales",
    musculo: "Hombros",
    imagenUrl: "",
    gifUrl: "",
    descripcion: "Abducción de hombros con mancuernas.",
    musculosTrabajados: ["Deltoides Medio"],
  },
  {
    id: "11",
    nombre: "Curl con Barra",
    musculo: "Brazos",
    imagenUrl: "",
    gifUrl: "",
    descripcion: "Flexión de codo con barra.",
    musculosTrabajados: ["Bíceps Braquial"],
  },
  {
    id: "12",
    nombre: "Extensiones de Tríceps",
    musculo: "Brazos",
    imagenUrl: "",
    gifUrl: "",
    descripcion: "Extensión de codo en polea.",
    musculosTrabajados: ["Tríceps Braquial"],
  },
];
