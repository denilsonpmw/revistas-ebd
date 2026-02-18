import React, { useState } from 'react';
import { FormModal } from './Modal';

const ReceiptIssuerModal = ({ isOpen, onClose, order, onEmit }) => {
  if (!isOpen || !order) return null;

  return (
    <FormModal isOpen={isOpen} onClose={onClose} title="Emitir Recibo">
      <p className="mb-2">Você está prestes a emitir o recibo para o pedido da congregação <b>{order.congregation?.name}</b>.</p>
      <p className="mb-2">O recibo será emitido em nome de:</p>
      <div className="mb-4 p-3 bg-slate-100 rounded text-slate-900">
        <div><b>Superintendência das Escolas Bíblicas - Campo Taquaralto</b></div>
        <div>Superintendente: Denilson Maciel</div>
      </div>
      <div className="flex gap-2 justify-end mt-4">
        <button
          className="bg-slate-400 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded"
          onClick={onClose}
        >
          Cancelar
        </button>
        <button
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded"
          onClick={() => onEmit(order)}
        >
          Confirmar
        </button>
      </div>
    </FormModal>
  );
};

export default ReceiptIssuerModal;
