'use client';

import { useId, useState } from 'react';
import { ArrowRight, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

interface UpdateContactFormProps {
  userId: string;
  initialContactNumber: string | null;
}

// Same rule as the event registration form.
const MOBILE_RE = /^[6-9]\d{9}$/;

export default function UpdateContactForm({ userId, initialContactNumber }: UpdateContactFormProps) {
  const fieldId = useId();
  const [saved, setSaved] = useState<string>(initialContactNumber ?? '');
  const [contactNumber, setContactNumber] = useState<string>(initialContactNumber ?? '');
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const dirty = contactNumber !== saved;
  const valid = contactNumber === '' || MOBILE_RE.test(contactNumber);
  const fieldError =
    serverError ??
    (touched && !valid ? 'Enter a 10-digit Indian mobile number, without +91 or spaces.' : null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    setServerError(null);
    if (!userId || !dirty || !valid || saving) return;

    setSaving(true);
    const supabase = createClient();
    const { data: updatedRows, error: updateError } = await supabase
      .from('UserProfile')
      .update({ contactNumber: contactNumber || null })
      .eq('id', userId)
      .select('id');
    setSaving(false);

    if (updateError || !updatedRows?.length) {
      console.error('Error updating contact number:', updateError);
      setServerError('We couldn’t save your number. Check your connection and try again.');
      return;
    }
    setSaved(contactNumber);
    setTouched(false);
    setJustSaved(true);
    toast.success(contactNumber ? 'Mobile number saved.' : 'Mobile number removed.');
  };

  return (
    <form onSubmit={handleSave} noValidate className="mt-8">
      <label htmlFor={fieldId} className="label text-muted-foreground">
        Mobile number
      </label>
      <div
        className={cn(
          'mt-1 flex items-baseline gap-3 border-b transition-colors focus-within:border-primary',
          fieldError ? 'border-destructive' : 'border-foreground/30'
        )}
      >
        <span aria-hidden="true" className="font-mono text-lg tabular text-muted-foreground">
          +91
        </span>
        <input
          id={fieldId}
          name="mobile"
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          maxLength={10}
          placeholder="10-digit number"
          value={contactNumber}
          onChange={(e) => {
            setContactNumber(e.target.value.replace(/\D/g, '').slice(0, 10));
            setServerError(null);
            setJustSaved(false);
          }}
          onBlur={() => setTouched(true)}
          aria-invalid={!!fieldError}
          aria-describedby={`${fieldId}-msg`}
          className="w-full bg-transparent pb-3 pt-2 font-mono text-lg tabular outline-none placeholder:font-sans placeholder:text-muted-foreground/70 focus-visible:outline-none"
        />
      </div>
      <p
        id={`${fieldId}-msg`}
        aria-live="polite"
        className={cn('mt-2 min-h-5 text-sm', fieldError ? 'text-destructive' : 'text-muted-foreground')}
      >
        {fieldError ??
          (justSaved
            ? 'Saved. Registration forms will use this number.'
            : dirty
              ? 'Unsaved change.'
              : saved
                ? 'Registration forms fill this in for you.'
                : 'Add it once and every registration form fills it in.')}
      </p>

      <button
        type="submit"
        disabled={!dirty || saving}
        className={cn(
          'group mt-8 inline-flex h-12 w-full items-center justify-between gap-6 px-5 font-semibold transition-[background-color,color,transform] duration-300 active:scale-[0.98] sm:w-auto sm:min-w-56',
          'focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-ring',
          dirty
            ? 'bg-primary text-primary-foreground hover:bg-foreground hover:text-background'
            : 'cursor-not-allowed border border-border text-muted-foreground'
        )}
      >
        {saving ? 'Saving' : justSaved && !dirty ? 'Saved' : 'Save number'}
        {saving ? (
          <Loader2 className="size-5 animate-spin" />
        ) : justSaved && !dirty ? (
          <Check className="size-5" />
        ) : (
          <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
        )}
      </button>
    </form>
  );
}
