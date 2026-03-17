import { Node, Edge } from '@xyflow/react';

export interface ChatbotTemplate {
  id: string;
  name: string;
  description: string;
  category: 'customer-service' | 'sales' | 'support' | 'survey' | 'booking';
  icon: string;
  nodes: Node[];
  edges: Edge[];
}

export const chatbotTemplates: ChatbotTemplate[] = [
  {
    id: 'customer-service',
    name: 'Atención al Cliente',
    description: 'Flujo básico para atención al cliente con opciones comunes',
    category: 'customer-service',
    icon: '👥',
    nodes: [
      {
        id: 'start-initial',
        type: 'start',
        position: { x: 400, y: 50 },
        data: { label: 'Inicio', text: '¡Hola! Bienvenido a nuestro servicio de atención al cliente. ¿En qué puedo ayudarte?' },
        draggable: false,
      },
      {
        id: 'options-1',
        type: 'option',
        position: { x: 400, y: 250 },
        data: {
          label: 'Opciones principales',
          text: 'Selecciona una opción:',
          subtype: 'list',
          options: [
            { label: 'Información de productos', value: 'info' },
            { label: 'Estado de pedido', value: 'order' },
            { label: 'Soporte técnico', value: 'support' },
            { label: 'Hablar con un agente', value: 'agent' },
          ],
        },
        draggable: false,
      },
      {
        id: 'message-info',
        type: 'message',
        position: { x: 200, y: 450 },
        data: { label: 'Info productos', text: 'Puedes ver todos nuestros productos en www.ejemplo.com/productos', subtype: 'text' },
        draggable: false,
      },
      {
        id: 'message-order',
        type: 'message',
        position: { x: 400, y: 450 },
        data: { label: 'Estado pedido', text: 'Para consultar tu pedido, necesito tu número de orden.', subtype: 'text' },
        draggable: false,
      },
      {
        id: 'message-support',
        type: 'message',
        position: { x: 600, y: 450 },
        data: { label: 'Soporte', text: 'Nuestro equipo de soporte está disponible 24/7. ¿Cuál es tu problema?', subtype: 'text' },
        draggable: false,
      },
    ],
    edges: [
      { id: 'e1', source: 'start-initial', target: 'options-1', type: 'smoothstep', animated: true },
      { id: 'e2', source: 'options-1', target: 'message-info', type: 'smoothstep' },
      { id: 'e3', source: 'options-1', target: 'message-order', type: 'smoothstep' },
      { id: 'e4', source: 'options-1', target: 'message-support', type: 'smoothstep' },
    ],
  },
  {
    id: 'sales',
    name: 'Ventas',
    description: 'Flujo para capturar leads y cerrar ventas',
    category: 'sales',
    icon: '💰',
    nodes: [
      {
        id: 'start-initial',
        type: 'start',
        position: { x: 400, y: 50 },
        data: { label: 'Inicio', text: '¡Hola! 👋 Gracias por tu interés en nuestros productos.' },
        draggable: false,
      },
      {
        id: 'input-name',
        type: 'input',
        position: { x: 400, y: 250 },
        data: { label: 'Capturar nombre', text: '¿Cuál es tu nombre?', subtype: 'text', saveToVariable: 'nombre' },
        draggable: false,
      },
      {
        id: 'input-email',
        type: 'input',
        position: { x: 400, y: 450 },
        data: { label: 'Capturar email', text: '¿Cuál es tu email?', subtype: 'text', saveToVariable: 'email', validation: 'email' },
        draggable: false,
      },
      {
        id: 'message-thanks',
        type: 'message',
        position: { x: 400, y: 650 },
        data: { label: 'Agradecimiento', text: 'Gracias {{nombre}}! Un asesor se contactará contigo pronto a {{email}}', subtype: 'text' },
        draggable: false,
      },
    ],
    edges: [
      { id: 'e1', source: 'start-initial', target: 'input-name', type: 'smoothstep', animated: true },
      { id: 'e2', source: 'input-name', target: 'input-email', type: 'smoothstep', animated: true },
      { id: 'e3', source: 'input-email', target: 'message-thanks', type: 'smoothstep', animated: true },
    ],
  },
  {
    id: 'survey',
    name: 'Encuesta de Satisfacción',
    description: 'Recopila feedback de tus clientes',
    category: 'survey',
    icon: '📊',
    nodes: [
      {
        id: 'start-initial',
        type: 'start',
        position: { x: 400, y: 50 },
        data: { label: 'Inicio', text: 'Nos gustaría conocer tu opinión sobre nuestro servicio.' },
        draggable: false,
      },
      {
        id: 'option-rating',
        type: 'option',
        position: { x: 400, y: 250 },
        data: {
          label: 'Calificación',
          text: '¿Cómo calificarías nuestro servicio?',
          subtype: 'buttons',
          options: [
            { label: '⭐ Excelente', value: '5' },
            { label: '👍 Bueno', value: '4' },
            { label: '😐 Regular', value: '3' },
          ],
        },
        draggable: false,
      },
      {
        id: 'input-feedback',
        type: 'input',
        position: { x: 400, y: 450 },
        data: { label: 'Comentarios', text: '¿Tienes algún comentario adicional?', subtype: 'text', saveToVariable: 'comentarios' },
        draggable: false,
      },
      {
        id: 'message-thanks',
        type: 'message',
        position: { x: 400, y: 650 },
        data: { label: 'Gracias', text: '¡Gracias por tu feedback! Nos ayuda a mejorar.', subtype: 'text' },
        draggable: false,
      },
    ],
    edges: [
      { id: 'e1', source: 'start-initial', target: 'option-rating', type: 'smoothstep', animated: true },
      { id: 'e2', source: 'option-rating', target: 'input-feedback', type: 'smoothstep', animated: true },
      { id: 'e3', source: 'input-feedback', target: 'message-thanks', type: 'smoothstep', animated: true },
    ],
  },
  {
    id: 'booking',
    name: 'Sistema de Reservas',
    description: 'Permite a los usuarios hacer reservas fácilmente',
    category: 'booking',
    icon: '📅',
    nodes: [
      {
        id: 'start-initial',
        type: 'start',
        position: { x: 400, y: 50 },
        data: { label: 'Inicio', text: '¡Hola! Bienvenido a nuestro sistema de reservas.' },
        draggable: false,
      },
      {
        id: 'input-name',
        type: 'input',
        position: { x: 400, y: 250 },
        data: { label: 'Nombre', text: '¿Cuál es tu nombre completo?', subtype: 'text', saveToVariable: 'nombre' },
        draggable: false,
      },
      {
        id: 'input-date',
        type: 'input',
        position: { x: 400, y: 450 },
        data: { label: 'Fecha', text: '¿Para qué fecha deseas reservar? (DD/MM/AAAA)', subtype: 'text', saveToVariable: 'fecha' },
        draggable: false,
      },
      {
        id: 'option-time',
        type: 'option',
        position: { x: 400, y: 650 },
        data: {
          label: 'Horario',
          text: 'Selecciona un horario:',
          subtype: 'list',
          options: [
            { label: '9:00 AM', value: '09:00' },
            { label: '12:00 PM', value: '12:00' },
            { label: '3:00 PM', value: '15:00' },
            { label: '6:00 PM', value: '18:00' },
          ],
        },
        draggable: false,
      },
      {
        id: 'message-confirm',
        type: 'message',
        position: { x: 400, y: 850 },
        data: { label: 'Confirmación', text: 'Perfecto {{nombre}}! Tu reserva para el {{fecha}} ha sido confirmada. Te esperamos!', subtype: 'text' },
        draggable: false,
      },
    ],
    edges: [
      { id: 'e1', source: 'start-initial', target: 'input-name', type: 'smoothstep', animated: true },
      { id: 'e2', source: 'input-name', target: 'input-date', type: 'smoothstep', animated: true },
      { id: 'e3', source: 'input-date', target: 'option-time', type: 'smoothstep', animated: true },
      { id: 'e4', source: 'option-time', target: 'message-confirm', type: 'smoothstep', animated: true },
    ],
  },
];
