"use client";

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/components/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Loader } from '@/components/ui/loader';
import type { Tables, TablesInsert } from '@/lib/supabase/database.types';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';

export type ParticipantWithPoints = Tables<'PublicUserProfile'> & {
  points: number | null;
};

interface EventDetailClientProps {
  initialEvent: Tables<'Event'> | null;
  initialParticipants: ParticipantWithPoints[];
  eventId: string;
}

const isValidContactNumber = (number: string): boolean => /^\d{10}$/.test(number);

const formatDate = (dateString?: string | null) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata',
  }) + ' IST';
};

export default function EventDetailClient({ initialEvent, initialParticipants, eventId }: EventDetailClientProps) {
  const supabaseClient = createClient();
  const { user: authUser, supabase, loading: authLoading, login } = useAuth();

  const [event] = useState<Tables<'Event'> | null>(initialEvent);
  const [participants, setParticipants] = useState<ParticipantWithPoints[]>(initialParticipants);
  const [userProfile, setUserProfile] = useState<Tables<'UserProfile'> | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contactModal, setContactModal] = useState({ isOpen: false, contactNumber: '' });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const isEventCompleted = event?.status === 'DONE';
  const canRegister = event?.status === 'OPEN';
  const leaderboardData = isEventCompleted ? participants : [];

  // Fetch user profile and check registration status
  useEffect(() => {
    if (!authUser || !supabase || authLoading) return;

    const fetchUserData = async () => {
      const [profileResponse, registrationResponse] = await Promise.all([
        supabase.from('UserProfile').select('*').eq('id', authUser.id).single(),
        supabase.from('Registration').select('id').eq('userId', authUser.id).eq('eventId', eventId).maybeSingle()
      ]);

      if (!profileResponse.error) {
        setUserProfile(profileResponse.data);
        setContactModal(prev => ({ ...prev, contactNumber: profileResponse.data?.contactNumber || '' }));
      }

      if (!registrationResponse.error) {
        setIsRegistered(!!registrationResponse.data);
      }
    };

    fetchUserData();
  }, [authUser, supabase, authLoading, eventId]);

  const handleRegister = async () => {
    if (!authUser || !userProfile || !event || !supabase) {
      toast.error("Please log in to register.");
      return;
    }

    // Check if contact number is needed
    if (!userProfile.contactNumber && !contactModal.contactNumber.trim()) {
      setContactModal({ ...contactModal, isOpen: true });
      return;
    }

    setShowConfirmDialog(true);
  };

  const executeRegister = async () => {
    if (!authUser || !event || !supabase) return;

    setIsSubmitting(true);
    setShowConfirmDialog(false);

    try {      // Update contact number if needed
      let updatedContactNumber = userProfile?.contactNumber;
      if (contactModal.contactNumber.trim() && contactModal.contactNumber.trim() !== userProfile?.contactNumber) {
        const { error: updateError } = await supabase
          .from('UserProfile')
          .update({ contactNumber: contactModal.contactNumber.trim() })
          .eq('id', authUser.id);

        if (updateError) throw new Error("Failed to update contact number");
        
        updatedContactNumber = contactModal.contactNumber.trim();
        setUserProfile(prev => prev ? { ...prev, contactNumber: updatedContactNumber! } : null);
      }

      // Register for event
      const registrationPayload: TablesInsert<'Registration'> = {
        eventId: event.id,
        userId: authUser.id,
        points: null,
      };

      const { error: registrationError } = await supabase
        .from('Registration')
        .insert(registrationPayload);

      if (registrationError) throw new Error(registrationError.message);

      toast.success("Successfully registered for the event!");
      setIsRegistered(true);
      setContactModal({ ...contactModal, isOpen: false });        // Add to participants list
        if (userProfile) {
          const newParticipant: ParticipantWithPoints = {
            id: userProfile.id,
            name: userProfile.name,
            department: userProfile.department,
            year: userProfile.year,
            currentRating: userProfile.currentRating,
            points: null,
          };
          setParticipants(prev => [...prev, newParticipant]);
        }
    } catch (error: any) {
      toast.error(error.message || "Registration failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContactSubmit = async () => {
    const trimmedContactNumber = contactModal.contactNumber.trim();

    if (!trimmedContactNumber) {
      toast.error("Contact number cannot be empty.");
      return;
    }

    if (!isValidContactNumber(trimmedContactNumber)) {
      toast.error("Please enter a valid 10-digit contact number.");
      return;
    }

    if (!authUser || !supabase) {
      toast.error("User not authenticated.");
      return;
    }

    setIsSubmitting(true);
    const { error } = await supabase
      .from('UserProfile')
      .update({ contactNumber: trimmedContactNumber })
      .eq('id', authUser.id);

    setIsSubmitting(false);

    if (error) {
      toast.error("Failed to update contact number.");
    } else {
      toast.success("Contact number updated. Please register again.");
      setUserProfile(prev => prev ? { ...prev, contactNumber: trimmedContactNumber } : null);
      setContactModal({ contactNumber: trimmedContactNumber, isOpen: false });
    }
  };

  const imageContainerClass = isEventCompleted ? "aspect-video" : "aspect-4/5";

  const renderActionButton = () => {
    const base = "inline-flex h-14 w-full items-center justify-between gap-8 px-6 font-semibold sm:w-auto sm:min-w-64";
    if (isEventCompleted) {
      return <span className={`${base} border border-border text-muted-foreground`}>This event has wrapped up</span>;
    }
    if (!canRegister) {
      return <span className={`${base} border border-border text-muted-foreground`}>Registration closed</span>;
    }
    return (
      <Link
        href="https://docs.google.com/forms/d/e/1FAIpQLSfdMp0IbymLZdIOaTZ4a5aWaJsDS6iPi6okXhuajl9tz4QZ6g/viewform?usp=send_form"
        target="_blank"
        rel="noopener noreferrer"
        className={`group ${base} bg-primary text-primary-foreground transition-colors hover:bg-foreground hover:text-background`}
      >
        Register for this event
        <ArrowUpRight className="size-5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
      </Link>
    );
  };

  const renderParticipantsList = () => {
    const dataToShow = isEventCompleted ? leaderboardData : participants;
    const title = isEventCompleted ? "Leaderboard" : "Participants";

    return (
      <div className="p-6 md:p-8">
        <h2 className="text-2xl font-semibold mb-4 text-primary">{title}</h2>
        {dataToShow.length > 0 ? (
          <ul className="space-y-3">
            {dataToShow.map((participant, index) => (
              <li key={participant.id || index} className="bg-muted p-4 rounded-lg shadow-sm flex justify-between items-center">
                <Link
                  href={`/user/${participant.id}`}
                  className="font-semibold text-card-foreground hover:underline">
                  {participant.name || 'Anonymous User'}
                </Link>
                {isEventCompleted && (
                  <span className="font-bold text-lg text-primary">
                    {typeof participant.points === 'number' ? `${participant.points} pts` : '-'}
                  </span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground">
            {isEventCompleted ? "No participants data available." : "No participants yet. Be the first to register!"}
          </p>
        )}
      </div>
    );
  };

  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-xl text-muted-foreground">Event not found.</p>
      </div>
    );
  }

  const poster = event.imgUrl
    ? /^https?:\/\//.test(event.imgUrl)
      ? event.imgUrl
      : supabaseClient.storage.from('event-images').getPublicUrl(event.imgUrl).data.publicUrl
    : null;
  const typeName = ({ CONTEST: "Contest", WORKSHOP: "Workshop", TALK: "Talk" } as Record<string, string>)[event.type] ?? event.type;
  const statusName = ({ OPEN: "Open for registration", CLOSED: "Registration closed", DONE: "Completed", CANCELLED: "Cancelled" } as Record<string, string>)[event.status] ?? event.status;

  return (
    <div className="mx-auto min-h-screen max-w-[1600px] px-5 pb-24 pt-10 sm:px-8 sm:pb-36 sm:pt-16">
      <Link href="/events" className="group inline-flex items-center gap-2 label text-muted-foreground transition-colors hover:text-foreground">
        <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" /> All events
      </Link>

      <header className="mt-10 border-b border-border pb-10">
        <h1 data-reveal className="max-w-[18ch] text-[clamp(2.75rem,7vw,7rem)] font-extrabold leading-[0.9] tracking-[-0.045em] [font-stretch:112%]">
          <span className="reveal-line">
            <span>{event.name.trim()}</span>
          </span>
        </h1>
      </header>

      <div className="mt-12 grid gap-12 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-28">
            {poster ? (
              <div data-clip className="relative overflow-hidden bg-muted">
                <Image
                  src={poster}
                  alt={`${event.name.trim()} poster`}
                  width={900}
                  height={1125}
                  sizes="(min-width: 1024px) 40vw, 100vw"
                  priority
                  className="h-auto w-full"
                />
              </div>
            ) : (
              <div className="grid aspect-[4/5] place-items-center bg-muted p-10 text-center font-display text-5xl">{event.name.trim()}</div>
            )}
          </div>
        </div>

        <div className="lg:col-span-6 lg:col-start-7">
          <dl className="grid border-t border-border sm:grid-cols-2">
            {[
              ["Date & time", formatDate(event.startTime)],
              ["Venue", event.location],
              ["Format", typeName],
              ["Status", statusName],
            ].map(([k, v]) => (
              <div key={k} className="border-b border-border py-5 sm:odd:pr-6">
                <dt className="label text-muted-foreground">{k}</dt>
                <dd className="mt-2 text-lg font-semibold">{v}</dd>
              </div>
            ))}
          </dl>

          <div data-fade className="mt-10 max-w-[65ch] whitespace-pre-line text-lg leading-relaxed text-foreground/85">
            {event.description || 'No description available yet.'}
          </div>

          {event.organizer_info && (
            <div className="mt-10 border-t border-border pt-6">
              <p className="label text-muted-foreground">Organised by</p>
              <p className="mt-3 whitespace-pre-line text-base leading-relaxed">{event.organizer_info}</p>
            </div>
          )}

          <div className="mt-12">{renderActionButton()}</div>
        </div>
      </div>

      {/* Contact Modal */}
      <Dialog open={contactModal.isOpen} onOpenChange={(open) => setContactModal({ ...contactModal, isOpen: open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Contact Number</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="mb-4 text-sm text-muted-foreground">
              To register for this event, please provide your contact number.
            </p>
            <Label htmlFor="contact-input">Contact Number</Label>
            <Input
              id="contact-input"
              type="tel"
              value={contactModal.contactNumber}
              onChange={(e) => setContactModal({ ...contactModal, contactNumber: e.target.value })}
              placeholder="Enter your contact number"
              className="mt-1"
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" onClick={() => setContactModal({ ...contactModal, isOpen: false })}>Cancel</Button>
            </DialogClose>
            <Button onClick={handleContactSubmit} disabled={isSubmitting}>
              {isSubmitting ? <Loader /> : 'Save and Continue'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Registration Confirmation Modal */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Registration</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to register for {event?.name}?
            </p>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" onClick={() => setShowConfirmDialog(false)} disabled={isSubmitting}>Cancel</Button>
            </DialogClose>
            <Button onClick={executeRegister} disabled={isSubmitting}>
              {isSubmitting ? <Loader /> : 'Confirm Registration'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
