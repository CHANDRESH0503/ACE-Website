"use client";
import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/context/AuthContext";

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  message?: string;
}

export const ContactSection = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");

  const validateForm = () => {
    const newErrors: FormErrors = {};
    if (!firstName.trim()) newErrors.firstName = "First name is required";
    else if (firstName.length > 255) newErrors.firstName = "First name is too long";
    if (!lastName.trim()) newErrors.lastName = "Last name is required";
    else if (lastName.length > 255) newErrors.lastName = "Last name is too long";
    if (!email.trim()) newErrors.email = "Email is required";
    else if (email.length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = "Invalid email address";
    if (!message.trim()) newErrors.message = "Message is required";
    else if (message.length > 5000) newErrors.message = "Message is too long (max 5000 characters)";
    if (`${firstName.trim()} ${lastName.trim()}`.length > 200) newErrors.lastName = "Name is too long";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Please correct the errors in the form.");
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus("idle");

    const supabase = createClient();

    try {
      const { error } = await supabase
        .from('ContactMessage')
        .insert([
          {
            name: `${firstName.trim()} ${lastName.trim()}`,
            email: email.trim(),
            message: message.trim(),
          },
        ]);

      if (error) {
        console.error("Supabase submission failed:", error);
        toast.error("Submission failed. Please try again.");
        setSubmitStatus("error");
      } else {
        toast.success("Message sent successfully!");
        setSubmitStatus("success");
        setFirstName("");
        setLastName("");
        setEmail("");
        setMessage("");
        setErrors({});
      }
    } catch (error: any) {
      console.error("Error submitting form:", error);
      toast.error("An error occurred while sending the message.");
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  }
  return (
    <section id="contact" aria-labelledby="contact-title" className="relative overflow-hidden bg-foreground py-24 text-background sm:py-36">
      <div className="mx-auto max-w-[1600px] px-5 sm:px-8">
        <h2 id="contact-title" data-reveal className="font-display text-[clamp(3rem,10vw,9.5rem)]">
          <span className="reveal-line">
            <span>Build with</span>
          </span>
          <span className="reveal-line">
            <span>
              us<span className="text-primary">.</span>
            </span>
          </span>
        </h2>

        <div className="mt-16 grid gap-16 lg:mt-24 lg:grid-cols-12 lg:gap-8">
          <div className="flex flex-col gap-12 lg:col-span-5">
            <JoinBlock />

            <dl className="grid gap-8 border-t border-background/20 pt-8 sm:grid-cols-2 lg:grid-cols-1">
              <div>
                <dt className="label text-background/60">Find us</dt>
                <dd className="mt-2 text-lg leading-snug">
                  SASTRA Deemed University
                  <br />
                  Thirumalaisamudram, Thanjavur
                  <br />
                  Tamil Nadu 613401
                </dd>
              </div>
              <div>
                <dt className="label text-background/60">Write to us</dt>
                <dd className="mt-2 text-lg">
                  <a
                    href="mailto:ace.soc.sastra@gmail.com"
                    className="underline decoration-background/30 underline-offset-4 transition-colors hover:decoration-primary"
                  >
                    ace.soc.sastra@gmail.com
                  </a>
                </dd>
              </div>
            </dl>
          </div>

          <form onSubmit={handleSubmit} noValidate className="grid gap-8 lg:col-span-6 lg:col-start-7" aria-describedby="contact-help">
            <p id="contact-help" className="text-lg leading-snug text-background/80">
              Questions about the club, an idea for an event, or something you want to build? Send it
              over and we&apos;ll get back to you.
            </p>
            <div className="grid gap-8 sm:grid-cols-2">
              <Field id="firstName" label="First name" value={firstName} onChange={setFirstName} error={errors.firstName} autoComplete="given-name" />
              <Field id="lastName" label="Last name" value={lastName} onChange={setLastName} error={errors.lastName} autoComplete="family-name" />
            </div>
            <Field id="email" label="Email" type="email" value={email} onChange={setEmail} error={errors.email} autoComplete="email" />
            <Field id="message" label="Message" value={message} onChange={setMessage} error={errors.message} multiline />

            <div className="flex flex-wrap items-center gap-6">
              <button
                type="submit"
                disabled={isSubmitting}
                className="group inline-flex h-14 items-center justify-between gap-8 bg-primary px-6 text-base font-semibold text-primary-foreground transition-colors duration-300 hover:bg-background hover:text-foreground disabled:cursor-wait disabled:opacity-70"
              >
                {isSubmitting ? "Sending…" : "Send message"}
                <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
              </button>
              {submitStatus === "success" && (
                <p role="status" className="inline-flex items-center gap-2 text-background/80">
                  <Check className="size-4 text-primary" /> Message sent. We&apos;ll reply by email.
                </p>
              )}
              {submitStatus === "error" && (
                <p role="alert" className="text-[hsl(var(--destructive-inverse))]">
                  That didn&apos;t send. Check your connection and try again, or email us directly.
                </p>
              )}
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};

function JoinBlock() {
  const { user, login, loading } = useAuth();
  return (
    <div>
      <p className="max-w-md text-lg leading-snug text-background/80">
        {user
          ? "You're signed in. Register for events and collect badges from your profile."
          : "Sign in with your SASTRA Google account to register for events and start collecting badges."}
      </p>
      {user ? (
        <a
          href={`/user/${user.id}`}
          className="group mt-6 inline-flex h-14 items-center gap-8 border border-background/30 px-6 font-semibold transition-colors hover:border-background hover:bg-background hover:text-foreground"
        >
          Open your profile
          <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
        </a>
      ) : (
        <button
          type="button"
          onClick={() => login()}
          disabled={loading}
          className="group mt-6 inline-flex h-14 items-center gap-8 border border-background/30 px-6 font-semibold transition-colors hover:border-background hover:bg-background hover:text-foreground disabled:opacity-60"
        >
          Sign in with SASTRA
          <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
        </button>
      )}
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  error,
  type = "text",
  multiline,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  type?: string;
  multiline?: boolean;
  autoComplete?: string;
}) {
  const base =
    "peer w-full border-0 border-b bg-transparent px-0 pb-3 pt-2 text-lg text-background outline-none transition-colors placeholder:text-background/40 focus:border-primary focus-visible:outline-none " +
    (error ? "border-[hsl(var(--destructive-inverse))]" : "border-background/30");
  return (
    <div>
      <label htmlFor={id} className="label text-background/60">
        {label}
      </label>
      {multiline ? (
        <textarea
          id={id}
          rows={4}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className={base + " resize-none"}
        />
      ) : (
        <input
          id={id}
          type={type}
          value={value}
          autoComplete={autoComplete}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className={base}
        />
      )}
      {error && (
        <p id={`${id}-error`} className="mt-2 text-sm text-[hsl(var(--destructive-inverse))]">
          {error}
        </p>
      )}
    </div>
  );
}
