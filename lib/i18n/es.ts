/**
 * Spanish UI dictionary. Single source of truth for user-facing text.
 * Sections are added module by module (Phase 2). Components import from here
 * instead of hardcoding strings.
 */

export const es = {
  comun: {
    guardar: "Guardar",
    cancelar: "Cancelar",
    eliminar: "Eliminar",
    editar: "Editar",
    volver: "Volver",
    cargando: "Cargando…",
    guardando: "Guardando…",
    acciones: "Acciones",
    todos: "Todos",
    sinDatos: "—",
    cliente: "Cliente",
    estado: "Estado",
    notas: "Notas",
    descripcion: "Descripción",
    fechaInicio: "Fecha de inicio",
    fechaFin: "Fecha de fin",
  },
  proyectos: {
    titulo: "Proyectos",
    subtitulo: "Seguimiento de trabajos aprobados y su relación con cotizaciones y facturas.",
    nuevo: "Nuevo proyecto",
    numero: "Proyecto",
    nombre: "Nombre del proyecto",
    cotizacion: "Cotización",
    factura: "Factura",
    direccionObra: "Dirección de la obra",
    descripcionCorta: "Descripción corta del trabajo",
    presupuesto: "Presupuesto estimado",
    vacio: "Todavía no hay proyectos. Se crean automáticamente al aprobar una cotización.",
    sinFactura: "Aún sin factura",
    sinCotizacion: "Creado manualmente",
    confirmarEliminar: "¿Eliminar este proyecto? Esta acción no se puede deshacer.",
    errorCargar: "No se pudieron cargar los proyectos",
    errorGuardar: "No se pudo guardar el proyecto",
    errorEliminar: "No se pudo eliminar el proyecto",
    guardado: "Proyecto guardado",
    creado: "Proyecto creado",
    eliminado: "Proyecto eliminado",
    noEncontrado: "Proyecto no encontrado",
    vinculos: "Vínculos",
    faseTresTitulo: "Próximamente",
    faseTresTexto: "Órdenes de trabajo, materiales y tareas se agregarán en la siguiente fase.",
    fechaFinInvalida: "La fecha de fin debe ser posterior a la fecha de inicio",
    nombreRequerido: "El nombre es obligatorio",
    clienteRequerido: "Selecciona un cliente",
    inicioRequerido: "La fecha de inicio es obligatoria",
  },
  estadosProyecto: {
    pending: "Pendiente",
    planning: "Planificación",
    in_progress: "En progreso",
    completed: "Completado",
    on_hold: "En pausa",
    cancelled: "Cancelado",
  },
} as const;

export type EstadoProyecto = keyof typeof es.estadosProyecto;

export const ESTADOS_PROYECTO = Object.keys(es.estadosProyecto) as EstadoProyecto[];
