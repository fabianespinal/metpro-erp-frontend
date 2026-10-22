import { es } from "@/lib/i18n/es";
import { useMemo } from 'react'
import SurchargeControls from './SurchargeControls'
import QuoteItemRow from './QuoteItemRow'
import QuoteTotalsDisplay from './QuoteTotalsDisplay'
import { calculateQuoteTotals } from './quoteUtils'
import TaxTypeSelect from './TaxTypeSelect'

/** @type {Array<{code: string, label: string, rate: number, is_default: boolean}>} */
const NO_TAX_TYPES = []

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
  onOpenProductModal,
  taxTypes: taxTypesProp,
  taxTypeCode = '',
  setTaxTypeCode
}) {
  const taxTypes = taxTypesProp ?? NO_TAX_TYPES
  // The chosen type, or the default one. No types loaded: no rate passed, the backend decides on save.
  const taxType = taxTypes.find((t) => t.code === taxTypeCode) || taxTypes.find((t) => t.is_default) || null
  // Derived from items and charges, never stored separately.
  const calculatedTotals = useMemo(
    () => calculateQuoteTotals(quoteItems, charges, charges.dynamic_charges ?? [], taxType ? taxType.rate : undefined),
    [quoteItems, charges, taxType],
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
          <select aria-label={es.cot.cliente}
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
              aria-label={es.cot.contacto ?? 'Contacto'}
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
        <input aria-label={es.cot.ingreseProyecto}
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
        <textarea aria-label='Términos de pago'
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
        <input aria-label="Válida Hasta"
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

      {/* TAX TYPE. Hidden unless more than one type is active. */}
      <TaxTypeSelect taxTypes={taxTypes} value={taxTypeCode} onChange={(c) => setTaxTypeCode && setTaxTypeCode(c)} />

      {/* TOTALS */}
      <QuoteTotalsDisplay totals={calculatedTotals} charges={charges} taxLabel={taxType ? taxType.label : undefined} />

      {/* NOTES */}
      <div className='mb-4 mt-4'>
        <label className='block text-sm font-medium mb-2'>{es.cot.notasOpcional}</label>
        <textarea aria-label="Notas"
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