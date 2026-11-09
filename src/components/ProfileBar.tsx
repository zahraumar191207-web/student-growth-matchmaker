import { GraduationCap, MapPin, Sparkles, Timer, UserRound } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { StudentProfile } from "@/lib/matching";
import {
  AVAILABILITY,
  FIELDS,
  INTERESTS,
  PROFILE_LOCATIONS,
  type AvailabilityId,
  type Field,
  type Interest,
  type ProfileLocation,
} from "@/lib/opportunities";

const MAX_INTERESTS = 5;

export function ProfileBar({
  profile,
  busy,
  onSubmit,
}: {
  profile: StudentProfile;
  busy: boolean;
  onSubmit: (p: StudentProfile) => void;
}) {
  const [draft, setDraft] = useState<StudentProfile>(profile);
  useEffect(() => setDraft(profile), [profile]);

  const toggleInterest = (i: Interest) =>
    setDraft((d) =>
      d.interests.includes(i)
        ? { ...d, interests: d.interests.filter((x) => x !== i) }
        : d.interests.length >= MAX_INTERESTS
          ? d
          : { ...d, interests: [...d.interests, i] },
    );

  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit(draft);
  };

  return (
    <form
      onSubmit={submit}
      className="rounded-3xl border bg-card/95 p-5 shadow-lift backdrop-blur sm:p-7"
      aria-label="Your student profile"
    >
      <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold sm:text-2xl">Tell us about you</h2>
          <p className="text-sm text-muted-foreground">
            Takes 20 seconds. Your profile stays on this device.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1.5">
          <Label htmlFor="name" className="flex items-center gap-1.5">
            <UserRound className="size-3.5 text-muted-foreground" aria-hidden /> First name
            <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>
          <Input
            id="name"
            value={draft.name}
            maxLength={60}
            placeholder="e.g. Mariam"
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="field" className="flex items-center gap-1.5">
            <GraduationCap className="size-3.5 text-muted-foreground" aria-hidden /> Major / field
          </Label>
          <Select
            value={draft.field}
            onValueChange={(v) => setDraft({ ...draft, field: v as Field })}
          >
            <SelectTrigger id="field" className="w-full">
              <SelectValue placeholder="Choose your major" />
            </SelectTrigger>
            <SelectContent>
              {FIELDS.map((f) => (
                <SelectItem key={f} value={f}>
                  {f}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="location" className="flex items-center gap-1.5">
            <MapPin className="size-3.5 text-muted-foreground" aria-hidden /> Location
          </Label>
          <Select
            value={draft.location}
            onValueChange={(v) => setDraft({ ...draft, location: v as ProfileLocation })}
          >
            <SelectTrigger id="location" className="w-full">
              <SelectValue>{draft.location}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {PROFILE_LOCATIONS.map((l) => (
                <SelectItem key={l} value={l}>
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="availability" className="flex items-center gap-1.5">
            <Timer className="size-3.5 text-muted-foreground" aria-hidden /> Availability
          </Label>
          <Select
            value={draft.availability}
            onValueChange={(v) => setDraft({ ...draft, availability: v as AvailabilityId })}
          >
            <SelectTrigger id="availability" className="w-full">
              <SelectValue>
                {AVAILABILITY.find((a) => a.id === draft.availability)?.label}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {AVAILABILITY.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <fieldset className="mt-5">
        <legend className="mb-2 text-sm font-medium">
          Interests{" "}
          <span className="font-normal text-muted-foreground">
            · pick up to {MAX_INTERESTS} ({draft.interests.length}/{MAX_INTERESTS})
          </span>
        </legend>
        <div className="flex flex-wrap gap-2">
          {INTERESTS.map((i) => {
            const active = draft.interests.includes(i);
            return (
              <Button
                key={i}
                type="button"
                variant="chip"
                size="sm"
                data-active={active}
                aria-pressed={active}
                disabled={!active && draft.interests.length >= MAX_INTERESTS}
                onClick={() => toggleInterest(i)}
              >
                {i}
              </Button>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-6 flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          Matches are scored on your major, interests, location and weekly hours.
        </p>
        <Button type="submit" variant="hero" size="lg" disabled={busy} className="rounded-full">
          <Sparkles />
          {busy ? "Matching…" : "Find my matches"}
        </Button>
      </div>
    </form>
  );
}
