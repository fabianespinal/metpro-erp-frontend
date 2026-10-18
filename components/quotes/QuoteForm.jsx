import { es } from "@/lib/i18n/es";
import { useMemo } from 'react'
import SurchargeControls from './SurchargeControls'
import QuoteItemRow from './QuoteItemRow'
import QuoteTotalsDisplay from './QuoteTotalsDisplay'
import { calculateQuoteTotals } from './quoteUtils'

export default function QuoteForm({ 
  clients,
  selectedClient,
  setSelectedClient,
  clientLocked = false,
  selectedContact,
  setSelectedContact,
  contacts,
  projectName,
  setProjectName,
  quoteItems,
  handleAddItem,
  handleRemoveItem,
  handleItemChange,
  charges,
  setCharges,
  notes,
  setNotes,
  paymentTerms,
  setPaymentTerms,
  validUntil,
  setValidUntil,
  onSubmit,
  loading,
  onOpenProductModal
}) {
  // Derived from items and charges, never stored separately.
  const calculatedTotals = useMemo(
    () => calculateQuoteTotals(quoteItems, charges, charges.dynamic_charges ?? []),
    [quoteItems, charges],
  )

  return (
    <div className='bg-surface rounded-lg shadow p-6 mb-8'>
      <h2 className='text-xl font-semibold mb-4'>{es.cot.crearNueva}</h2>
      
      {/* CLIENT. Locked (read-only) when Step 1 already chose it. */}
      <div className='mb-4'>
        <label className='block text-sm font-medium mb-2'>{es.cot.cliente}</label>
        {clientLocked ? (
          <div className='w-full border p-2 rounded bg-canvas text-sm'>
            {selectedClient ? selectedClient.company_name : es.cot.cargandoCliente}
          </div>
        ) : (
          <select
            value={selectedClient ? selectedClient.id : ''}
            onChange={(e) => setSelectedClient(clients.find(c => c.id == e.target.value) || null)}
            className='w-full border p-2 rounded'
            required
          >
            <option value=''>{es.cot.seleccionarCliente}</option>
            {clients.map(client => (
              <option key={client.id} value={client.id}>
                {client.company_name} - {client.contact_name || es.cot.sinContacto}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* CONTACT SELECT — only shows after company is picked */}
      {selectedClient && (
        <div className='mb-4'>
          <label className='block text-sm font-medium mb-2'>{es.cot.contactoOpcional}</label>
          {contacts.length === 0 ? (
            <p className='text-sm text-muted border p-2 rounded bg-canvas'>
              {es.cot.sinContactosEmpresa}{' '}
              <a href='/clients' className='text-accent underline'>
                {es.cot.paginaClientes}
              </a>
              .
            </p>
          ) : (
            <select
              value={selectedContact ? selectedContact.id : ''}
              onChange={(e) => setSelectedContact(contacts.find(c => c.id == e.target.value) || null)}
              className='w-full border p-2 rounded'
            >
              <option value=''>{es.cot.sinContactoEspecifico}</option>
              {contacts.map(contact => (
                <option key={contact.id} value={contact.id}>
                  {contact.name}{contact.email ? ` — ${contact.email}` : ''}{contact.phone ? ` — ${contact.phone}` : ''}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {/* PROJECT NAME */}
      <div className='mb-4'>
        <label className='block text-sm font-medium mb-2'>{es.cot.proyectoOpcional}</label>
        <input
          type='text'
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          className='w-full border p-2 rounded'
          placeholder={es.cot.ingreseProyecto}
        />
      </div>

      {/* PAYMENT TERMS */}
      <div className='mb-4'>
        <label className='block text-sm font-medium mb-2'>Términos de Pago</label>
        <textarea
          value={paymentTerms}
          onChange={(e) => setPaymentTerms(e.target.value)}
          className='w-full border p-2 rounded'
          rows='2'
          placeholder='Ej: 50% anticipo, 50% contra entrega'
        />
      </div>

      {/* VALID UNTIL */}
      <div className='mb-4'>
        <label className='block text-sm font-medium mb-2'>Válida Hasta</label>
        <input
          type='date'
          value={validUntil}
          onChange={(e) => setValidUntil(e.target.value)}
          className='w-full border p-2 rounded'
        />
      </div>

      {/* QUOTE ITEMS */}
      <div className='mb-4'>
        <label className='block text-sm font-medium mb-2'>{es.cot.articulosTitulo}</label>
        {quoteItems.map((item, index) => (
          <QuoteItemRow
            key={index}
            item={item}
            index={index}
            onRemove={handleRemoveItem}
            onChange={handleItemChange}
            onOpenProductModal={onOpenProductModal}
            showRemove={quoteItems.length > 1}
          />
        ))}
        
        <button
          type='button'
          onClick={handleAddItem}
          className='w-full bg-accent/10 text-accent-strong py-2 rounded hover:bg-accent/10'
        >
          {es.cot.agregarArticuloMas}
        </button>
      </div>

      {/* SURCHARGES */}
      <SurchargeControls charges={charges} setCharges={setCharges} />

      {/* TOTALS */}
      <QuoteTotalsDisplay totals={calculatedTotals} charges={charges} />

      {/* NOTES */}
      <div className='mb-4 mt-4'>
        <label className='block text-sm font-medium mb-2'>{es.cot.notasOpcional}</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className='w-full border p-2 rounded'
          rows='3'
          placeholder={es.cot.notasPlaceholder}
        />
      </div>

      {/* SUBMIT BUTTON */}
      <button
        onClick={onSubmit}
        disabled={loading}
        className='w-full bg-accent text-white py-3 rounded hover:bg-accent-strong disabled:opacity-50'
      >
        {loading ? es.comun.creando : es.cot.crearCotizacion}
      </button>
    </div>
  )
}