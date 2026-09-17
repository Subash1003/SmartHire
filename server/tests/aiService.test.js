import { jest } from '@jest/globals';

process.env.AI_API_KEY = 'test-ai-key';

const mockCreate = jest.fn();

class MockAnthropic {
  constructor() {
    this.messages = { create: mockCreate };
  }
}

jest.unstable_mockModule('@anthropic-ai/sdk', () => ({
  default: MockAnthropic,
}));

const { screenResume } = await import('../services/aiService.js');

const job = {
  title: 'Frontend Developer',
  requiredSkills: ['React', 'JavaScript'],
  preferredSkills: ['TypeScript'],
  education: "Bachelor's degree",
  experience: '2+ years',
  description: 'Build user interfaces.',
};

beforeEach(() => {
  mockCreate.mockReset();
});

describe('aiService.screenResume', () => {
  it('returns the structured result from the tool_use block', async () => {
    mockCreate.mockResolvedValue({
      content: [
        {
          type: 'tool_use',
          name: 'provide_resume_screening',
          input: {
            matchScore: 82,
            matchedSkills: ['React', 'JavaScript'],
            missingSkills: ['TypeScript'],
            experienceMatch: 85,
            educationMatch: 80,
            summary: 'Strong overlap with required skills.',
          },
        },
      ],
    });

    const result = await screenResume({ job, resumeText: 'Experienced React developer...' });

    expect(result.matchScore).toBe(82);
    expect(result.matchedSkills).toEqual(['React', 'JavaScript']);
    expect(result.model).toBe('claude-opus-5');
    expect(mockCreate).toHaveBeenCalledTimes(1);

    const callArgs = mockCreate.mock.calls[0][0];
    expect(callArgs.tool_choice).toEqual({ type: 'tool', name: 'provide_resume_screening' });
  });

  it('throws a 503 ApiError when the API call fails', async () => {
    mockCreate.mockRejectedValue(new Error('network error'));

    await expect(screenResume({ job, resumeText: 'resume text' })).rejects.toMatchObject({ statusCode: 503 });
  });

  it('throws a 503 ApiError when no tool_use block is returned', async () => {
    mockCreate.mockResolvedValue({ content: [{ type: 'text', text: 'I cannot help with that.' }] });

    await expect(screenResume({ job, resumeText: 'resume text' })).rejects.toMatchObject({ statusCode: 503 });
  });

  it('truncates very long resume text before sending it', async () => {
    mockCreate.mockResolvedValue({
      content: [
        {
          type: 'tool_use',
          name: 'provide_resume_screening',
          input: {
            matchScore: 50,
            matchedSkills: [],
            missingSkills: [],
            experienceMatch: 50,
            educationMatch: 50,
            summary: 'summary',
          },
        },
      ],
    });

    const longResume = 'x'.repeat(20000);
    await screenResume({ job, resumeText: longResume });

    const callArgs = mockCreate.mock.calls[0][0];
    const userMessage = callArgs.messages[0].content;
    expect(userMessage.length).toBeLessThan(15000);
  });
});
