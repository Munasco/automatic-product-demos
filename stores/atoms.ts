import { atom } from "jotai";
import { atomWithStorage, createJSONStorage } from "jotai/utils";
import { nanoid } from "nanoid";

export const MODELS_AVAILABLE = [
    "gpt-5.1",
    "gpt-5.1-codex-mini",
    "gpt-5.2",
    "gemini-3-flash-preview"
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
    },
    {
        id: "gemini-3-flash-preview",
        name: "Gemini 3 Flash",
        description: "Fast Google model",
        icon: "zap",
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

export const googleApiKeyAtom = atomWithStorage<string>(
    "google-api-key",
    "",
    typeof window === "undefined"
        ? undefined
        : createJSONStorage(() => localStorage),
    { getOnInit: true }
);

export const selectedModelAtom = atom<ModelOption>(AVAILABLE_MODELS[0]);
export const reasoningEffortAtom = atom<ReasoningEffort>("auto");
export const webSearchAtom = atom<boolean>(false);

const shouldStreamBaseAtom = atomWithStorage<boolean>(
    "should-stream",
    false,

);

let shouldStreamSetCount = 0;

export const shouldStreamAtom = atom(
    (get) => get(shouldStreamBaseAtom),
    (get, set, update: boolean | ((prev: boolean) => boolean)) => {
        const prev = get(shouldStreamBaseAtom);
        const next = typeof update === "function" ? update(prev) : update;
        shouldStreamSetCount += 1;

        if (typeof window !== "undefined") {
            const stack = new Error().stack;
            console.log(
                `[shouldStreamAtom] set #${shouldStreamSetCount} prev=${prev} next=${next}`,
                { prev, next, stack }
            );
        }

        set(shouldStreamBaseAtom, next);
    }
);