import React from 'react';

const TestComponent: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-blue-600 mb-4">
          🚀 CogniBot Enterprise
        </h1>
        <p className="text-xl text-gray-700 mb-8">
          Sistema funcionando correctamente
        </p>
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-md">
          <h2 className="text-lg font-semibold mb-4">✅ Estado del Sistema</h2>
          <div className="space-y-2 text-left">
            <div className="flex justify-between">
              <span>React:</span>
              <span className="text-green-600 font-medium">✅ Funcionando</span>
            </div>
            <div className="flex justify-between">
              <span>TypeScript:</span>
              <span className="text-green-600 font-medium">✅ Funcionando</span>
            </div>
            <div className="flex justify-between">
              <span>Tailwind CSS:</span>
              <span className="text-green-600 font-medium">✅ Funcionando</span>
            </div>
            <div className="flex justify-between">
              <span>Vite:</span>
              <span className="text-green-600 font-medium">✅ Funcionando</span>
            </div>
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-4">
          Constructor único por usuario implementado
        </p>
      </div>
    </div>
  );
};

export default TestComponent;
