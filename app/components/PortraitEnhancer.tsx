"use client";

import { useEffect } from "react";
import {
  cardPortraitUrl,
  cardsByCharacter,
  characterName,
  characters,
} from "../lib/data";

const initialsFor = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

export default function PortraitEnhancer() {
  useEffect(() => {
    const byInitials = new Map<string, number[]>();
    for (const character of characters) {
      const initials = initialsFor(character.name);
      const current = byInitials.get(initials) ?? [];
      current.push(character.id);
      byInitials.set(initials, current);
    }

    const simplifyStaticCopy = () => {
      const replacements: Array<[string, string]> = [
        [".brand strong", "Uma Planner"],
        [".brand span", "Global"],
        [".header-title p", "Parent planner"],
        [".save-state", "Saved locally"],
        [".hero-copy h2", "Current farming overview"],
        [
          ".hero-copy > p",
          "Review your family, saved veterans, race coverage, and next recommended trainee.",
        ],
      ];

      for (const [selector, text] of replacements) {
        const element = document.querySelector<HTMLElement>(selector);
        if (element && element.textContent?.trim() !== text) {
          element.textContent = text;
        }
      }
    };

    const enhance = () => {
      simplifyStaticCopy();
      const marks = document.querySelectorAll<HTMLElement>(
        ".character-mark:not([data-portrait-state])",
      );

      for (const mark of marks) {
        const fallback = mark.textContent?.trim().toUpperCase() ?? "";
        const candidates = byInitials.get(fallback) ?? [];
        if (!candidates.length) {
          mark.dataset.portraitState = "unmatched";
          continue;
        }

        const scope =
          mark.closest(
            "article, tr, label, .target-summary, .lineage-select, .veteran-card, .roster-card, .suggestion-card, .family-node",
          ) ?? mark.parentElement;
        const context = scope?.textContent?.toLowerCase() ?? "";
        const charId =
          candidates.find((id) =>
            context.includes(characterName(id).toLowerCase()),
          ) ?? candidates[0];
        const card = cardsByCharacter.get(charId)?.[0];
        if (!card) {
          mark.dataset.portraitState = "missing-card";
          continue;
        }

        const image = document.createElement("img");
        image.src = cardPortraitUrl(card);
        image.alt = "";
        image.loading = "lazy";
        image.decoding = "async";
        image.referrerPolicy = "no-referrer";

        image.addEventListener(
          "load",
          () => {
            mark.classList.add("has-character-portrait");
          },
          { once: true },
        );
        image.addEventListener(
          "error",
          () => {
            image.remove();
            mark.textContent = fallback || "?";
            mark.dataset.portraitState = "failed";
          },
          { once: true },
        );

        mark.textContent = "";
        mark.title = characterName(charId);
        mark.append(image);
        mark.dataset.portraitState = "loading";
      }
    };

    enhance();
    const observer = new MutationObserver(enhance);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return null;
}
