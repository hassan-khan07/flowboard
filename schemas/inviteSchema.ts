import * as z from "zod";

export const inviteSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  role: z.enum(["MEMBER", "ADMIN"], {
    message: "Please select a role",
  }),
});
