import { describe, expect, it } from "vitest";
import { redactSecrets } from "./safe-logger";

describe("safe logger", () => {
  it("redacts Hugging Face and bearer tokens from log text", () => {
    const message = redactSecrets(
      "restore failed for hf_secret_token_123456 with Authorization: Bearer jwt.header.signature",
    );

    expect(message).toContain("[REDACTED_HUGGING_FACE_TOKEN]");
    expect(message).toContain("Bearer [REDACTED_TOKEN]");
    expect(message).not.toContain("hf_secret_token_123456");
    expect(message).not.toContain("jwt.header.signature");
  });
});
