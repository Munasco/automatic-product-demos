import { atom } from "jotai";
import type { Id } from "../convex/_generated/dataModel";

export const currentChatIdAtom = atom<Id<"chats"> | null>(null);
