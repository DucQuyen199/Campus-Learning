const { contextBridge } = require('electron');

// Expone funciones seguras para la ventana principal
contextBridge.exposeInMainWorld('electronAPI', {
  // Agregue aquí cualquier API que necesite exponer a la aplicación web
  // Por ejemplo, para integración con características de escritorio específicas
});

// Ya no inyectamos la barra de título personalizada 