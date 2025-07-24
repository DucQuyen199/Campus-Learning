/*-----------------------------------------------------------------
* File: preload.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
const { contextBridge } = require('electron');

// Expone funciones seguras para la ventana principal
contextBridge.exposeInMainWorld('electronAPI', {
  // Agregue aquí cualquier API que necesite exponer a la aplicación web
  // Por ejemplo, para integración con características de escritorio específicas
});

// Ya no inyectamos la barra de título personalizada 
