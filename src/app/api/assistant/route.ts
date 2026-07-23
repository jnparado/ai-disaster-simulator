import { NextResponse } from "next/server";
import { answerQuestion } from "@/lib/assistant/engine";
import { askLLM } from "@/lib/assistant/llm";
import { assistantRequestSchema } from "@/lib/validation/simulation";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = assistantRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { question, params } = parsed.data;

    const llmAnswer = await askLLM(question, params);
    if (llmAnswer) {
      return NextResponse.json({ answer: llmAnswer, source: "llm" });
    }

    const response = answerQuestion(question, params);
    return NextResponse.json({ ...response, source: "rules" });
  } catch {
    return NextResponse.json({ error: "Failed to process question" }, { status: 500 });
  }
}
