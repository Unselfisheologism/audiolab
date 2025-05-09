// The directive tells the Next.js runtime that this code should only be executed on the server.
'use server';

/**
 * @fileOverview An AI agent for reducing ambient sounds in an audio file.
 *
 * - soundScrubber - A function that handles the sound scrubbing process.
 * - SoundScrubberInput - The input type for the soundScrubber function.
 * - SoundScrubberOutput - The return type for the soundScrubber function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SoundScrubberInputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      "An audio file, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  description: z.string().describe('The description of the audio recording.'),
});
export type SoundScrubberInput = z.infer<typeof SoundScrubberInputSchema>;

const SoundScrubberOutputSchema = z.object({
  cleanedAudioDataUri: z
    .string()
    .describe(
      'The cleaned audio file with reduced ambient noise, as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.' 
    ),
  analysis: z.string().describe('Analysis of the ambient sounds reduced.'),
});
export type SoundScrubberOutput = z.infer<typeof SoundScrubberOutputSchema>;

export async function soundScrubber(input: SoundScrubberInput): Promise<SoundScrubberOutput> {
  return soundScrubberFlow(input);
}

const prompt = ai.definePrompt({
  name: 'soundScrubberPrompt',
  input: {schema: SoundScrubberInputSchema},
  output: {schema: SoundScrubberOutputSchema},
  prompt: `You are an audio engineer specializing in cleaning up audio recordings by reducing ambient noise.

You will use this information, along with the audio recording, to reduce ambient sounds and produce a cleaner recording. You will also provide a brief analysis of the types of ambient sounds that were reduced.

Description: {{{description}}}
Audio: {{media url=audioDataUri}}

Output the cleaned audio file as a data URI and the analysis of the reduced ambient sounds.
`,
});

const soundScrubberFlow = ai.defineFlow(
  {
    name: 'soundScrubberFlow',
    inputSchema: SoundScrubberInputSchema,
    outputSchema: SoundScrubberOutputSchema,
  },
  async input => {
    // Safety settings configuration to allow for potentially sensitive audio content.
    const safetySettings = [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_LOW_AND_ABOVE',
      },
    ];

    const {output} = await prompt({
      ...input,
      config: {safetySettings},
    });
    return output!;
  }
);
