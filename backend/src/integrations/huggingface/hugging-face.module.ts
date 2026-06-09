import { Module } from "@nestjs/common";
import { CodeFormerProvider } from "./codeformer.provider";
import { HuggingFaceClient } from "./hugging-face.client";
import { HuggingFaceTokenService } from "./hugging-face-token.service";

@Module({
  providers: [CodeFormerProvider, HuggingFaceClient, HuggingFaceTokenService],
  exports: [CodeFormerProvider, HuggingFaceClient, HuggingFaceTokenService],
})
export class HuggingFaceModule {}
