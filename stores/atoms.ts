import { atom } from "jotai";
import { atomWithStorage, createJSONStorage } from "jotai/utils";
import { nanoid } from "nanoid";

export const MODELS_AVAILABLE = [
    "gpt-5.1",
    "gpt-5.1-codex-mini",
    "gpt-5.2"
] as const;

export type ModelType = typeof MODELS_AVAILABLE[number];

export type ReasoningEffort = "auto" | "deepthink";

export interface ModelOption {
    id: ModelType;
    name: string;
    description: string;
    icon: "zap" | "brain" | "cpu";
}

export const AVAILABLE_MODELS: ModelOption[] = [
    {
        id: "gpt-5.1",
        name: "GPT-5.1",
        description: "Great for most tasks",
        icon: "zap",
    },
    {
        id: "gpt-5.1-codex-mini",
        name: "GPT-5.1 Codex mini",
        description: "Fast coding assistant",
        icon: "cpu",
    },
    {
        id: "gpt-5.2",
        name: "GPT-5.2",
        description: "Smartest Model",
        icon: "brain",
    }
] as const

export const sessionIdAtom = atomWithStorage<string>(
    "chat-session-id",
    nanoid(),
    typeof window === "undefined"
        ? undefined
        : createJSONStorage(() => sessionStorage),
    { getOnInit: true }
);

export const selectedModelAtom = atom<ModelOption>(AVAILABLE_MODELS[0]);
export const reasoningEffortAtom = atom<ReasoningEffort>("auto");
export const webSearchAtom = atom<boolean>(false);

// Streaming state - true when generating, set to false to cancel
export const shouldStreamAtom = atom<boolean>(false);