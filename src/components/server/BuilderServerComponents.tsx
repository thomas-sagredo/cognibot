// React Server Components para el constructor de chatbots
// Nota: Requiere Next.js 13+ con app directory o framework compatible

import { Suspense } from 'react';
import { BuilderMetadata } from './BuilderMetadata';
import { BuilderInitialData } from './BuilderInitialData';
import { BuilderSkeleton } from '../ui/loading-states';

// Server Component para cargar datos iniciales del builder
export async function BuilderDataLoader({ 
  userId, 
  chatbotId 
}: { 
  userId: string; 
  chatbotId?: string; 
}) {
  // Fetch data on the server - no client-side loading
  const [userConfig, chatbotData, templates] = await Promise.all([
    fetchUserConfig(userId),
    chatbotId ? fetchChatbotData(chatbotId) : null,
    fetchBuilderTemplates(),
  ]);

  return (
    <BuilderInitialData 
      userConfig={userConfig}
      chatbotData={chatbotData}
      templates={templates}
    />
  );
}

// Server Component para metadatos del builder
export async function BuilderMetadataLoader({ 
  chatbotId 
}: { 
  chatbotId?: string; 
}) {
  const metadata = chatbotId 
    ? await fetchChatbotMetadata(chatbotId)
    : getDefaultMetadata();

  return <BuilderMetadata metadata={metadata} />;
}

// Server Component para configuración de nodos
export async function NodeConfigLoader({ 
  userId 
}: { 
  userId: string; 
}) {
  const [nodeTypes, userPermissions] = await Promise.all([
    fetchAvailableNodeTypes(),
    fetchUserPermissions(userId),
  ]);

  // Filter node types based on user permissions
  const allowedNodeTypes = nodeTypes.filter(nodeType => 
    userPermissions.includes(nodeType.permission)
  );

  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          window.__BUILDER_CONFIG__ = {
            nodeTypes: ${JSON.stringify(allowedNodeTypes)},
            permissions: ${JSON.stringify(userPermissions)},
          };
        `,
      }}
    />
  );
}

// Server Component principal del builder
export async function ServerBuilderLayout({
  userId,
  chatbotId,
  children,
}: {
  userId: string;
  chatbotId?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="builder-server-layout">
      {/* Metadatos cargados en el servidor */}
      <Suspense fallback={<div>Loading metadata...</div>}>
        <BuilderMetadataLoader chatbotId={chatbotId} />
      </Suspense>

      {/* Configuración de nodos */}
      <Suspense fallback={null}>
        <NodeConfigLoader userId={userId} />
      </Suspense>

      {/* Datos iniciales del builder */}
      <Suspense fallback={<BuilderSkeleton />}>
        <BuilderDataLoader userId={userId} chatbotId={chatbotId} />
      </Suspense>

      {/* Componentes cliente */}
      {children}
    </div>
  );
}

// Funciones de fetch del servidor (simuladas)
async function fetchUserConfig(userId: string) {
  // En un caso real, esto haría fetch a tu API/DB
  return {
    theme: 'light',
    autoSave: true,
    gridSnap: true,
    maxNodes: 100,
  };
}

async function fetchChatbotData(chatbotId: string) {
  // Fetch chatbot data from database
  return {
    id: chatbotId,
    name: 'My Chatbot',
    nodes: [],
    edges: [],
    variables: [],
  };
}

async function fetchBuilderTemplates() {
  // Fetch available templates
  return [
    {
      id: 'customer-support',
      name: 'Customer Support',
      description: 'Template for customer support chatbot',
      nodes: [/* template nodes */],
    },
    {
      id: 'lead-generation',
      name: 'Lead Generation',
      description: 'Template for lead generation chatbot',
      nodes: [/* template nodes */],
    },
  ];
}

async function fetchChatbotMetadata(chatbotId: string) {
  return {
    title: 'Chatbot Builder',
    description: 'Build and customize your chatbot',
    lastModified: new Date().toISOString(),
  };
}

function getDefaultMetadata() {
  return {
    title: 'New Chatbot Builder',
    description: 'Create a new chatbot from scratch',
    lastModified: new Date().toISOString(),
  };
}

async function fetchAvailableNodeTypes() {
  return [
    { type: 'message', permission: 'basic' },
    { type: 'input', permission: 'basic' },
    { type: 'option', permission: 'basic' },
    { type: 'action', permission: 'premium' },
    { type: 'condition', permission: 'premium' },
    { type: 'api_call', permission: 'enterprise' },
  ];
}

async function fetchUserPermissions(userId: string) {
  // Fetch user's plan and permissions
  return ['basic', 'premium']; // Example permissions
}
