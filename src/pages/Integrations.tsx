import { useState } from 'react';
import { WhatsAppIntegration } from '@/components/WhatsAppIntegration';

const Integrations = () => {
  const [selectedChatbotId, setSelectedChatbotId] = useState<number | null>(null);
  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Integraciones</h1>
      {selectedChatbotId ? (
        <WhatsAppIntegration chatbotId={selectedChatbotId} chatbotName={`Chatbot ${selectedChatbotId}`} />
      ) : (
        <div className="text-sm text-muted-foreground">Selecciona un chatbot desde el constructor para configurar WhatsApp.</div>
      )}
    </div>
  );
};

export default Integrations;


