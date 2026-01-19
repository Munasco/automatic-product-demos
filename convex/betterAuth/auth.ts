import { createAuth } from "../auth";
import type { GenericCtx } from "@convex-dev/better-auth";
import { DataModel } from "../_generated/dataModel";

export const auth = createAuth({} as GenericCtx<DataModel>, { optionsOnly: true });
