import { jest } from '@jest/globals';

process.env.GROQ_API_KEY = 'test-groq-key';

const originalFetch = global.fetch;
const mockFetch = jest.fn();

beforeAll(() => {
  global.fetch = mockFetch;
});

afterAll(() => {
  global.fetch = originalFetch;
});

const { screenResume } = await import('../services/aiService.js');

const job = {
  title: 'Frontend Developer',
  requiredSkills: ['React', 'JavaScript'],
  preferredSkills: ['TypeScript'],
  education: "Bachelor's degree",
  experience: '2+ years',
  description: 'Build user interfaces.',
};

function groqResponse(toolArguments) {
  return {
    ok: true,
    json: async () => ({
      choices: [
        {
          message: {
            tool_calls: [
              {
                function: {
                  name: 'provide_resume_screening',
                  arguments: JSON.stringify(toolArguments),
                },
              },
            ],
          },
        },
      ],
    }),
  };
}

beforeEach(() => {
  mockFetch.mockReset();
});

describe('aiService.screenResume', () => {
  it('returns the structured result from the tool call', async () => {
    mockFetch.mockResolvedValue(
      groqResponse({
        matchScore: 82,
        matchedSkills: ['React', 'JavaScript'],
        missingSkills: ['TypeScript'],
        experienceMatch: 85,
        educationMatch: 80,
        summary: 'Strong overlap with required skills.',
      })
    );

    const result = await screenResume({ job, resumeText: 'Experienced React developer...' });

    expect(result.matchScore).toBe(82);
    expect(result.matchedSkills).toEqual(['React', 'JavaScript']);
    expect(result.model).toBe('openai/gpt-oss-120b');
    expect(mockFetch).toHaveBeenCalledTimes(1);

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe('https://api.groq.com/openai/v1/chat/completions');
    expect(options.headers.Authorization).toBe('Bearer test-groq-key');
    const body = JSON.parse(options.body);
    expect(body.tool_choice).toEqual({ type: 'function', function: { name: 'provide_resume_screening' } });
  });

  it('throws a 503 ApiError when the API call fails', async () => {
    mockFetch.mockRejectedValue(new Error('network error'));

    await expect(screenResume({ job, resumeText: 'resume text' })).rejects.toMatchObject({ statusCode: 503 });
  });

  it('throws a 503 ApiError when the response is not ok', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 401, text: async () => 'invalid api key' });

    await expect(screenResume({ job, resumeText: 'resume text' })).rejects.toMatchObject({ statusCode: 503 });
  });

  it('throws a 503 ApiError when no tool call is returned', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'I cannot help with that.' } }] }),
    });

    await expect(screenResume({ job, resumeText: 'resume text' })).rejects.toMatchObject({ statusCode: 503 });
  });

  it('throws a 503 ApiError when the tool call arguments are malformed JSON', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { tool_calls: [{ function: { name: 'provide_resume_screening', arguments: '{not json' } }] } }],
      }),
    });

    await expect(screenResume({ job, resumeText: 'resume text' })).rejects.toMatchObject({ statusCode: 503 });
  });

  it('truncates very long resume text before sending it', async () => {
    mockFetch.mockResolvedValue(
      groqResponse({
        matchScore: 50,
        matchedSkills: [],
        missingSkills: [],
        experienceMatch: 50,
        educationMatch: 50,
        summary: 'summary',
      })
    );

    const longResume = 'x'.repeat(20000);
    await screenResume({ job, resumeText: longResume });

    const [, options] = mockFetch.mock.calls[0];
    const body = JSON.parse(options.body);
    const userMessage = body.messages.find((m) => m.role === 'user').content;
    expect(userMessage.length).toBeLessThan(15000);
  });
});
