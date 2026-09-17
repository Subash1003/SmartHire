import Anthropic from '@anthropic-ai/sdk';
import { isAiConfigured, aiApiKey, AI_MODEL } from '../config/ai.js';
import { ApiError } from '../utils/ApiError.js';

const MAX_RESUME_CHARS = 6000;

const SCREENING_TOOL = {
  name: 'provide_resume_screening',
  description: 'Report a structured, assistive analysis of how well a resume matches a job posting.',
  input_schema: {
    type: 'object',
    properties: {
      matchScore: { type: 'integer', minimum: 0, maximum: 100, description: 'Overall match score 0-100' },
      matchedSkills: { type: 'array', items: { type: 'string' }, description: 'Required/preferred skills found in the resume' },
      missingSkills: { type: 'array', items: { type: 'string' }, description: 'Required/preferred skills not found in the resume' },
      experienceMatch: { type: 'integer', minimum: 0, maximum: 100, description: 'How well experience matches the role, 0-100' },
      educationMatch: { type: 'integer', minimum: 0, maximum: 100, description: 'How well education matches the role, 0-100' },
      summary: { type: 'string', description: 'Two to four sentence neutral summary of the fit, for a recruiter to read' },
    },
    required: ['matchScore', 'matchedSkills', 'missingSkills', 'experienceMatch', 'educationMatch', 'summary'],
    additionalProperties: false,
  },
  strict: true,
};

const SYSTEM_PROMPT = `You are an assistive resume-screening tool inside a recruitment platform. Your analysis helps a human recruiter; you never make or imply a hiring decision.

Rules you must follow:
- Base your analysis only on skills, experience, and education evidence in the resume text and how it relates to the job's stated requirements.
- Never infer or mention gender, religion, race, ethnicity, age, disability, health conditions, or any other protected characteristic, even if the resume text contains cues about them. Do not let such cues affect matchScore, experienceMatch, or educationMatch.
- Do not recommend "reject", "select", "hire", or "do not hire". Describe fit only in terms of skills/experience/education overlap.
- Call the provide_resume_screening tool exactly once with your analysis. Do not respond with plain text.`;

function buildUserPrompt({ job, resumeText }) {
  return `## Job posting
Title: ${job.title}
Required skills: ${(job.requiredSkills || []).join(', ') || 'none listed'}
Preferred skills: ${(job.preferredSkills || []).join(', ') || 'none listed'}
Education requirement: ${job.education || 'not specified'}
Experience requirement: ${job.experience || 'not specified'}
Description: ${job.description}

## Candidate resume text
${resumeText.slice(0, MAX_RESUME_CHARS)}`;
}

export async function screenResume({ job, resumeText }) {
  if (!isAiConfigured) {
    throw new ApiError(503, 'AI screening is not configured yet. Please try again later.');
  }

  const client = new Anthropic({ apiKey: aiApiKey, timeout: 20_000 });

  let response;
  try {
    response = await client.messages.create({
      model: AI_MODEL,
      max_tokens: 2048,
      output_config: { effort: 'low' },
      system: SYSTEM_PROMPT,
      tools: [SCREENING_TOOL],
      tool_choice: { type: 'tool', name: 'provide_resume_screening' },
      messages: [{ role: 'user', content: buildUserPrompt({ job, resumeText }) }],
    });
  } catch {
    throw new ApiError(503, 'AI screening is temporarily unavailable. Please try again later.');
  }

  const toolUse = response.content.find((block) => block.type === 'tool_use');
  if (!toolUse) {
    throw new ApiError(503, 'AI screening did not return a valid result. Please try again.');
  }

  const result = toolUse.input;

  return {
    matchScore: result.matchScore,
    matchedSkills: result.matchedSkills,
    missingSkills: result.missingSkills,
    experienceMatch: result.experienceMatch,
    educationMatch: result.educationMatch,
    summary: result.summary,
    model: AI_MODEL,
  };
}
