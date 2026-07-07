"use client";

import type { MessageComponent } from "@/lib/chat/types";
import { ProjectCard } from "./ProjectCard";
import { RepoPreview } from "./RepoPreview";
import { ResumePreview } from "./ResumePreview";
import { Timeline } from "./Timeline";
import { LeadCaptureForm } from "./LeadCaptureForm";
import { BookingCard } from "./BookingCard";

/** Renders the rich tool-call payloads attached to an assistant answer. */
export function MessageComponents({
  components,
}: {
  components: MessageComponent[];
}) {
  if (!components.length) return null;

  return (
    <div className="mt-4 space-y-3">
      {components.map((c, i) => {
        switch (c.kind) {
          case "projects":
            return (
              <div key={i} className="grid gap-3 sm:grid-cols-2">
                {c.projects.map((p) => (
                  <ProjectCard key={p.slug} project={p} />
                ))}
              </div>
            );
          case "repos":
            return (
              <div key={i} className="grid gap-3 sm:grid-cols-2">
                {c.repos.map((r) => (
                  <RepoPreview key={r.name} repo={r} />
                ))}
              </div>
            );
          case "resume":
            return <ResumePreview key={i} resume={c.resume} />;
          case "timeline":
            return <Timeline key={i} items={c.items} />;
          case "lead_capture":
            return <LeadCaptureForm key={i} query={c.query} />;
          case "booking":
            return <BookingCard key={i} calLink={c.calLink} />;
          default:
            return null;
        }
      })}
    </div>
  );
}
