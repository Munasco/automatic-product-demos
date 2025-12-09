import { atom } from "jotai";

// create a list of possible models to select only gpt-5.1 variants
export const MODELS_AVAILABLE = [
    "gpt-5.1",
    "gpt-5.1-thinking",
    "gpt-5.1-mini",
    "gpt-5.1-thinking-mini"
] as const;

export type ModelType = typeof MODELS_AVAILABLE[number];

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
        id: "gpt-5.1-mini",
        name: "GPT-5.1 mini",
        description: "Faster, lighter tasks",
        icon: "cpu",
    },
    {
        id: "gpt-5.1-thinking",
        name: "GPT-5.1 Thinking",
        description: "Uses advanced reasoning",
        icon: "brain",
    },
    {
        id: "gpt-5.1-thinking-mini",
        name: "GPT-5.1 Thinking mini",
        description: "Faster reasoning",
        icon: "brain",
    },
];

export const selectedModelAtom = atom<ModelType>("gpt-5.1");