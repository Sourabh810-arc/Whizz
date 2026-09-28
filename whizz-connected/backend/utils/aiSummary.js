/**
 * Turns a meeting's captured transcript (+ chat/notes as backup context)
 * into { summary, minutes, actionItems }.
 *
 * If ANTHROPIC_API_KEY is set in the environment, this calls the real
 * Claude API for a genuinely-generated summary. If it's not set (or the
 * call fails for any reason — no network in this sandbox, bad key, etc.)
 * it falls back to a deterministic, dependency-free heuristic summarizer
 * so the feature still works out of the box with zero extra setup, same
 * as the rest of this project.
 */

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5';

function buildTranscriptText(meeting) {
  if (meeting.transcript?.length) {
    return meeting.transcript.map((t) => `${t.speaker || 'Speaker'}: ${t.text}`).join('\n');
  }
  // Fall back to chat log if live captions were never turned on.
  if (meeting.chatLog?.length) {
    return meeting.chatLog.map((c) => `${c.senderName || 'Someone'} (chat): ${c.message}`).join('\n');
  }
  return '';
}

async function callAnthropic(transcriptText, meeting) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const system = `You summarize video-call transcripts for a meetings app called Whizz.
Respond with ONLY raw JSON (no markdown fences, no commentary) matching exactly this shape:
{"summary": "2-4 sentence plain-language overview", "minutes": "formatted meeting minutes as plain text with line breaks", "actionItems": [{"text": "task description", "owner": "name or Unassigned"}]}`;

  const user = `Meeting title: ${meeting.title}
Participants: ${meeting.participants.map((p) => p.name).join(', ') || 'Unknown'}

Transcript:
${transcriptText || '(no live-caption transcript was captured for this call)'}`;

  try {
    const res = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 1024,
        system,
        messages: [{ role: 'user', content: user }],
      }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    const textBlock = data.content?.find((b) => b.type === 'text');
    if (!textBlock) return null;

    const cleaned = textBlock.text.replace(/^```json\s*|```$/g, '').trim();
    const parsed = JSON.parse(cleaned);
    if (!parsed.summary) return null;

    return {
      summary: parsed.summary,
      minutes: parsed.minutes || '',
      actionItems: Array.isArray(parsed.actionItems) ? parsed.actionItems : [],
    };
  } catch (err) {
    return null; // fall through to the heuristic summarizer below
  }
}

// ---------- Offline fallback (no API key needed) ----------
const ACTION_PATTERNS = [
  /\b([A-Z][a-z]+) will ([^.?!]+)/g,
  /\b([A-Z][a-z]+) (?:needs to|has to|should) ([^.?!]+)/g,
  /\baction item:?\s*([^.?!]+)/gi,
  /\btodo:?\s*([^.?!]+)/gi,
];

function heuristicSummary(transcriptText, meeting) {
  const lines = transcriptText
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return {
      summary: `"${meeting.title}" had no captured transcript (live captions weren't enabled), so no content-based summary could be generated. ${meeting.participants.length} participant(s) attended.`,
      minutes: `Meeting: ${meeting.title}\nParticipants: ${meeting.participants.map((p) => p.name).join(', ') || 'N/A'}\nNo transcript was captured during this call.`,
      actionItems: [],
    };
  }

  // Extractive "summary": first line, a middle line, and the last line
  // (a simple, dependency-free stand-in for real summarization).
  const pick = [lines[0], lines[Math.floor(lines.length / 2)], lines[lines.length - 1]];
  const uniquePick = [...new Set(pick)];
  const summary = `This meeting covered ${lines.length} recorded remarks from ${meeting.participants.length} participant(s). Highlights: ${uniquePick
    .map((l) => l.replace(/^[^:]+:\s*/, ''))
    .join(' … ')}`;

  const minutes = [
    `Meeting: ${meeting.title}`,
    `Date: ${new Date(meeting.startedAt || meeting.createdAt).toLocaleString()}`,
    `Participants: ${meeting.participants.map((p) => p.name).join(', ') || 'N/A'}`,
    '',
    'Discussion log:',
    ...lines.map((l) => `- ${l}`),
  ].join('\n');

  const actionItems = [];
  for (const pattern of ACTION_PATTERNS) {
    let match;
    while ((match = pattern.exec(transcriptText)) !== null) {
      if (match.length === 3) {
        actionItems.push({ text: match[2].trim(), owner: match[1].trim() });
      } else {
        actionItems.push({ text: match[1].trim(), owner: 'Unassigned' });
      }
      if (actionItems.length >= 10) break;
    }
  }

  return { summary, minutes, actionItems };
}

async function generateMeetingIntelligence(meeting) {
  const transcriptText = buildTranscriptText(meeting);

  const fromAI = await callAnthropic(transcriptText, meeting);
  if (fromAI) return fromAI;

  return heuristicSummary(transcriptText, meeting);
}

module.exports = { generateMeetingIntelligence };
