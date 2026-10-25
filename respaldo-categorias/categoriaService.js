const STORAGE_KEY = 'ru_categorias_locales';

// Obtener categorías guardadas
export const obtenerCategorias = async () => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    const iniciales = [
      { id_categoria: 1, nombre: 'Ropa', estado: true },
      { id_categoria: 2, nombre: 'Calzado', estado: true }
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(iniciales));
    return iniciales;
  }
  return JSON.parse(data);
};

// Registrar nueva categoría con validación de duplicados (Cumple la Tarea 1)
export const registrarCategoriaApi = async (categoriaData) => {
  const data = localStorage.getItem(STORAGE_KEY);
  const categorias = data ? JSON.parse(data) : [];

  // Normalizamos el nombre ingresado (eliminamos espacios y pasamos a minúsculas)
  const nombreNuevo = categoriaData.nombre.trim().toLowerCase();

  // Verificamos si ya existe una categoría con ese mismo nombre
  const existe = categorias.some(c => c.nombre.trim().toLowerCase() === nombreNuevo);

  if (existe) {
    throw new Error('La categoría ya existe en el sistema.');
  }

  const nueva = {
    id_categoria: categorias.length > 0 ? Math.max(...categorias.map(c => c.id_categoria)) + 1 : 1,
    nombre: categoriaData.nombre.trim(),
    estado: categoriaData.estado ?? true
  };

  categorias.push(nueva);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(categorias));
  return nueva;
};

// Editar categoría con validación de duplicados
export const editarCategoriaApi = async (id, categoriaData) => {
  const data = localStorage.getItem(STORAGE_KEY);
  let categorias = data ? JSON.parse(data) : [];
  
  const nombreNuevo = categoriaData.nombre.trim().toLowerCase();

  // Validar que no exista otro registro con el mismo nombre excluyendo el actual
  const existe = categorias.some(c => c.id_categoria != id && c.nombre.trim().toLowerCase() === nombreNuevo);
  if (existe) {
    throw new Error('Ya existe otra categoría con ese nombre.');
  }

  categorias = categorias.map(c => c.id_categoria == id ? { ...c, ...categoriaData, nombre: categoriaData.nombre.trim() } : c);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(categorias));
  return { id_categoria: id, ...categoriaData };
};

// Cambiar estado de la categoría
export const cambiarEstadoApi = async (id, estado) => {
  const data = localStorage.getItem(STORAGE_KEY);
  let categorias = data ? JSON.parse(data) : [];
  
  categorias = categorias.map(c => c.id_categoria == id ? { ...c, estado } : c);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(categorias));
  return { success: true };
};

// Eliminar categoría
export const eliminarCategoriaApi = async (id) => {
  const data = localStorage.getItem(STORAGE_KEY);
  let categorias = data ? JSON.parse(data) : [];
  
  categorias = categorias.filter(c => c.id_categoria != id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(categorias));
  return { success: true };
};
// En tu función de registro o en el servicio de frontend
export const validarNombreCategoria = (nombre) => {
  const limpio = nombre.trim();
  
  if (!limpio) {
    throw new Error("El nombre de la categoría es obligatorio.");
  }
  
  // Validar si son solo números
  const soloNumeros = /^\d+$/.test(limpio);
  if (soloNumeros) {
    throw new Error("El nombre de la categoría no puede estar compuesto únicamente por números.");
  }

  if (limpio.length < 2) {
    throw new Error("El nombre debe tener al menos 2 caracteres.");
  }

  return limpio;
};