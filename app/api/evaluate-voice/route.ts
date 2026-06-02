import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { audioBase64, mimeType, questionText } = await req.json();

    if (!audioBase64 || !questionText) {
      return NextResponse.json({ error: 'Missing audioBase64 or questionText' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API;
    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
    }

    const prompt = `You are a warm and honest English language teacher giving feedback to a student.

The student was given this speaking prompt:
"${questionText}"

Listen carefully to their recorded answer. Then provide:

TRANSCRIPT: Write exactly what the student said (verbatim transcription).

FEEDBACK: Give honest, encouraging feedback in natural everyday spoken English (not textbook English). Your feedback must:
- Be truthful — never praise what wasn't good or skip real mistakes
- Lead with what was genuinely good or natural
- Point out any mistakes clearly but kindly (grammar, vocabulary, unnatural phrasing)
- Show how a native speaker would naturally say the same thing when relevant
- Be motivating

CRITICAL — match feedback length to answer length:
- If the answer is very short (a name, one word, or one short sentence), give 1–2 short sentences of feedback. A two-word answer does NOT deserve a paragraph.
- If the answer is a few sentences, give 2–3 sentences of feedback.
- If the answer is a detailed story or long response, a fuller paragraph is fine.
- Never pad with empty encouragement to reach a word count. Say what needs to be said and stop.

Format your response EXACTLY like this (use these exact labels):
TRANSCRIPT: [verbatim transcription]
FEEDBACK: [your feedback]`;

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                inline_data: {
                  mime_type: mimeType || 'audio/webm',
                  data: audioBase64,
                }
              },
              { text: prompt }
            ]
          }],
          generationConfig: {
            temperature: 0.65,
            maxOutputTokens: 800,
          }
        })
      }
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error('Gemini API error:', errText);
      return NextResponse.json({ error: 'Gemini evaluation failed' }, { status: 502 });
    }

    const data = await geminiRes.json();
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    const transcriptMatch = raw.match(/TRANSCRIPT:\s*([\s\S]*?)(?=\nFEEDBACK:|$)/i);
    const feedbackMatch = raw.match(/FEEDBACK:\s*([\s\S]*)$/i);

    const transcript = transcriptMatch?.[1]?.trim() ?? '';
    const feedback = feedbackMatch?.[1]?.trim() ?? raw.trim();

    return NextResponse.json({ transcript, feedback });
  } catch (err) {
    console.error('evaluate-voice error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
