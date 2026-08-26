'use client'

import { motion, AnimatePresence } from 'motion/react'
import { useFormStatus } from 'react-dom'

import { cn } from '@/lib/utils'

/* -------------------------------------------------------------------------- */

export function Field({
  label,
  name,
  error,
  hint,
  required,
  className,
  children,
}: {
  label: string
  name: string
  error?: string
  hint?: string
  required?: boolean
  className?: string
  children?: React.ReactNode
}) {
  return (
    <div className={className}>
      <label htmlFor={name} className="field-label">
        {label}
        {required && <span className="ml-0.5 text-coral">*</span>}
      </label>
      {children}
      {hint && !error && <p className="mt-1.5 text-xs leading-relaxed text-tide/70">{hint}</p>}
      <FieldError error={error} />
    </div>
  )
}

export function FieldError({ error }: { error?: string }) {
  return (
    <AnimatePresence>
      {error && (
        <motion.p
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-1.5 flex items-start gap-1 text-xs font-medium text-coral"
        >
          <span aria-hidden>⚠</span>
          {error}
        </motion.p>
      )}
    </AnimatePresence>
  )
}

export function TextField({
  label,
  name,
  error,
  hint,
  required,
  className,
  ...props
}: {
  label: string
  name: string
  error?: string
  hint?: string
  className?: string
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <Field label={label} name={name} error={error} hint={hint} required={required} className={className}>
      <input
        id={name}
        name={name}
        required={required}
        aria-invalid={Boolean(error)}
        className={cn('field', error && 'field-error')}
        {...props}
      />
    </Field>
  )
}

export function TextArea({
  label,
  name,
  error,
  hint,
  required,
  className,
  ...props
}: {
  label: string
  name: string
  error?: string
  hint?: string
  className?: string
} & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <Field label={label} name={name} error={error} hint={hint} required={required} className={className}>
      <textarea
        id={name}
        name={name}
        required={required}
        aria-invalid={Boolean(error)}
        className={cn('field min-h-24 resize-y', error && 'field-error')}
        {...props}
      />
    </Field>
  )
}

export function SelectField({
  label,
  name,
  error,
  hint,
  required,
  className,
  options,
  placeholder = 'Choose one…',
  ...props
}: {
  label: string
  name: string
  error?: string
  hint?: string
  className?: string
  options: Array<{ value: string; label: string }>
  placeholder?: string
} & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <Field label={label} name={name} error={error} hint={hint} required={required} className={className}>
      <div className="relative">
        <select
          id={name}
          name={name}
          required={required}
          aria-invalid={Boolean(error)}
          className={cn('field appearance-none pr-10', error && 'field-error')}
          {...props}
        >
          <option value="">{placeholder}</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <svg
          aria-hidden
          className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-tide"
          width="12"
          height="8"
          viewBox="0 0 12 8"
          fill="none"
        >
          <path d="M1 1.5 6 6.5l5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </div>
    </Field>
  )
}

/** Big tappable radio cards — used for gender, participation choice, yes/no. */
export function RadioCards({
  label,
  name,
  options,
  error,
  hint,
  required,
  defaultValue,
  columns = 2,
}: {
  label: string
  name: string
  options: Array<{ value: string; label: string; emoji?: string }>
  error?: string
  hint?: string
  required?: boolean
  defaultValue?: string
  columns?: 2 | 3 | 4
}) {
  return (
    <fieldset>
      <legend className="field-label">
        {label}
        {required && <span className="ml-0.5 text-coral">*</span>}
      </legend>
      <div
        className={cn(
          'grid gap-2',
          columns === 2 && 'grid-cols-2',
          columns === 3 && 'grid-cols-2 sm:grid-cols-3',
          columns === 4 && 'grid-cols-2 sm:grid-cols-4',
        )}
      >
        {options.map((o) => (
          <label
            key={o.value}
            className="group relative flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border-[1.5px] border-foam bg-white px-3 py-2.5 text-center text-sm font-medium text-tide transition-all has-[:checked]:border-brand has-[:checked]:bg-mist has-[:checked]:text-brand-deeper has-[:checked]:shadow-[0_0_0_3px_rgba(0,107,212,0.12)] hover:border-brand/50"
          >
            <input
              type="radio"
              name={name}
              value={o.value}
              required={required}
              defaultChecked={defaultValue === o.value}
              className="sr-only"
            />
            {o.emoji && <span aria-hidden>{o.emoji}</span>}
            {o.label}
          </label>
        ))}
      </div>
      <FieldError error={error} />
    </fieldset>
  )
}

export function CheckboxField({
  name,
  label,
  description,
  error,
  defaultChecked,
  required,
}: {
  name: string
  label: string
  description?: string
  error?: string
  defaultChecked?: boolean
  required?: boolean
}) {
  return (
    <div>
      <label className="flex cursor-pointer items-start gap-3 rounded-xl border-[1.5px] border-foam bg-white p-3.5 transition-all has-[:checked]:border-brand/60 has-[:checked]:bg-mist/60 hover:border-brand/40">
        <input
          type="checkbox"
          id={name}
          name={name}
          defaultChecked={defaultChecked}
          required={required}
          className="peer sr-only"
        />
        <span
          aria-hidden
          className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border-[1.5px] border-tide/30 bg-white transition-all peer-checked:border-brand peer-checked:bg-brand"
        >
          <svg width="11" height="9" viewBox="0 0 11 9" fill="none" className="opacity-0 transition-opacity peer-checked:opacity-100">
            <path d="M1 4.5 4 7.5 10 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-deep">
            {label}
            {required && <span className="ml-0.5 text-coral">*</span>}
          </span>
          {description && (
            <span className="mt-1 block text-xs leading-relaxed text-tide/80">{description}</span>
          )}
        </span>
      </label>
      <FieldError error={error} />
    </div>
  )
}

/* -------------------------------------------------------------------------- */

export function SubmitButton({
  children,
  className,
  pendingLabel = 'Working…',
  ...props
}: {
  children: React.ReactNode
  className?: string
  pendingLabel?: string
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className={cn('btn btn-primary', className)}
      {...props}
    >
      {pending ? (
        <>
          <Spinner />
          {pendingLabel}
        </>
      ) : (
        children
      )}
    </button>
  )
}

export function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn('h-4 w-4 animate-spin', className)}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3.5" />
      <path
        d="M22 12a10 10 0 0 0-10-10"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function Alert({
  tone = 'error',
  children,
}: {
  tone?: 'error' | 'success' | 'info'
  children: React.ReactNode
}) {
  if (!children) return null

  const tones = {
    error: 'border-coral/30 bg-coral/8 text-coral',
    success: 'border-kelp/30 bg-kelp/8 text-kelp',
    info: 'border-brand/25 bg-mist text-brand-deeper',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('rounded-xl border px-4 py-3 text-sm font-medium', tones[tone])}
      role={tone === 'error' ? 'alert' : 'status'}
    >
      {children}
    </motion.div>
  )
}
