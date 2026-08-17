import zod from "zod";

export const jsonOption = zod.boolean().default(false).describe("Output as JSON for agents");
