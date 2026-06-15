import { BadGatewayException, UnauthorizedException } from "@nestjs/common";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { OPERATION_TYPES, PROCESSING_MODES } from "../../contracts/lumina";
import { CodeFormerProvider } from "../../integrations/huggingface/codeformer.provider";
import { HuggingFaceTokenService } from "../../integrations/huggingface/hugging-face-token.service";
import { AccountRepository } from "../../persistence/repositories/account.repository";
import { HuggingFaceTokenEncryptionService } from "../account/account-token-encryption.service";
import { HistoryService } from "../history/history.service";
import { AiRestoreService } from "./ai-restore.service";

const transparentPng = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=";

describe("AiRestoreService", () => {
  let codeFormer: {
    restoreFace: ReturnType<typeof vi.fn>;
  };
  let history: {
    createHistory: ReturnType<typeof vi.fn>;
  };
  let accounts: {
    findById: ReturnType<typeof vi.fn>;
  };
  let tokenEncryption: {
    decrypt: ReturnType<typeof vi.fn>;
  };
  let service: AiRestoreService;

  beforeEach(() => {
    codeFormer = {
      restoreFace: vi.fn().mockResolvedValue({
        restoredImage: "cmVzdG9yZWQ=",
        settingsUsed: {
          model: "CodeFormer",
          fidelity: 0.7,
        },
        outputFormat: "jpeg",
      }),
    };
    history = {
      createHistory: vi.fn().mockResolvedValue({
        success: true,
        message: "History metadata saved",
        historyId: "history-1",
      }),
    };
    accounts = {
      findById: vi.fn(),
    };
    tokenEncryption = {
      decrypt: vi.fn(),
    };
    service = new AiRestoreService(
      codeFormer as unknown as CodeFormerProvider,
      new HuggingFaceTokenService(),
      history as unknown as HistoryService,
      accounts as unknown as AccountRepository,
      tokenEncryption as unknown as HuggingFaceTokenEncryptionService,
    );
  });

  it("restores a guest image with a request token and saves metadata only", async () => {
    await expect(
      service.restoreFace(
        {
          sessionId: "guest-session-1",
        },
        {
          image: `data:image/png;base64,${transparentPng}`,
          huggingFaceToken: "hf_guest_token_123456",
          settings: {
            fidelity: 0.7,
          },
          outputFormat: "jpeg",
        },
      ),
    ).resolves.toMatchObject({
      success: true,
      restoredImage: "cmVzdG9yZWQ=",
      historyId: "history-1",
      operationType: OPERATION_TYPES.restoreFace,
      processingMode: PROCESSING_MODES.cloudAi,
    });

    expect(codeFormer.restoreFace).toHaveBeenCalledWith({
      imageBase64: transparentPng,
      contentType: "image/png",
      huggingFaceToken: "hf_guest_token_123456",
      fidelity: 0.7,
      outputFormat: "jpeg",
    });
    expect(history.createHistory).toHaveBeenCalledWith(
      {
        sessionId: "guest-session-1",
      },
      expect.objectContaining({
        operationType: OPERATION_TYPES.restoreFace,
        processingMode: PROCESSING_MODES.cloudAi,
        status: "success",
      }),
    );
    expect(JSON.stringify(history.createHistory.mock.calls[0])).not.toContain("cmVzdG9yZWQ=");
    expect(accounts.findById).not.toHaveBeenCalled();
  });

  it("lets authenticated requests use a temporary request token", async () => {
    await service.restoreFace(
      {
        accountId: "account-1",
      },
      {
        image: transparentPng,
        huggingFaceToken: "hf_request_token_123456",
      },
    );

    expect(codeFormer.restoreFace).toHaveBeenCalledWith(
      expect.objectContaining({
        huggingFaceToken: "hf_request_token_123456",
      }),
    );
    expect(accounts.findById).not.toHaveBeenCalled();
    expect(history.createHistory).toHaveBeenCalledWith(
      {
        accountId: "account-1",
      },
      expect.any(Object),
    );
  });

  it("decrypts an authenticated user's saved token only for the active request", async () => {
    accounts.findById.mockResolvedValue({
      encryptedHuggingFaceToken: "encrypted-token",
    });
    tokenEncryption.decrypt.mockReturnValue("hf_saved_token_123456");

    await service.restoreFace(
      {
        accountId: "account-1",
      },
      {
        image: transparentPng,
        useSavedToken: true,
      },
    );

    expect(accounts.findById).toHaveBeenCalledWith("account-1", {
      includeEncryptedHuggingFaceToken: true,
    });
    expect(tokenEncryption.decrypt).toHaveBeenCalledWith("encrypted-token");
    expect(codeFormer.restoreFace).toHaveBeenCalledWith(
      expect.objectContaining({
        huggingFaceToken: "hf_saved_token_123456",
      }),
    );
  });

  it("fails clearly when no usable token is available", async () => {
    await expect(
      service.restoreFace(
        {
          sessionId: "guest-session-1",
        },
        {
          image: transparentPng,
        },
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    accounts.findById.mockResolvedValue(null);

    await expect(
      service.restoreFace(
        {
          accountId: "account-1",
        },
        {
          image: transparentPng,
          useSavedToken: true,
        },
      ),
    ).rejects.toMatchObject({
      message: "Saved Hugging Face token is not configured.",
    });
  });

  it("does not save success history when Hugging Face restore fails", async () => {
    codeFormer.restoreFace.mockRejectedValue(new BadGatewayException("AI restore failed while contacting Hugging Face."));

    await expect(
      service.restoreFace(
        {
          sessionId: "guest-session-1",
        },
        {
          image: transparentPng,
          huggingFaceToken: "hf_guest_token_123456",
        },
      ),
    ).rejects.toBeInstanceOf(BadGatewayException);

    expect(history.createHistory).not.toHaveBeenCalled();
  });
});
