// AcousticPurification Flow
'use server';
/**
 * @fileOverview This file defines a Genkit flow for acoustic purification of audio files.
 *
 * - acousticPurification - A function that accepts an audio file and reduces sound artifacts.
 * - AcousticPurificationInput - The input type for the acousticPurification function.
 * - AcousticPurificationOutput - The return type for the acousticPurification function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AcousticPurificationInputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      "An audio file, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type AcousticPurificationInput = z.infer<typeof AcousticPurificationInputSchema>;

const AcousticPurificationOutputSchema = z.object({
  purifiedAudioDataUri: z
    .string()
    .describe(
      'The purified audio file, as a data URI with MIME type and Base64 encoding.'
    ),
  processingDetails: z.string().describe('Details about the acoustic purification process.'),
});
export type AcousticPurificationOutput = z.infer<typeof AcousticPurificationOutputSchema>;

export async function acousticPurification(input: AcousticPurificationInput): Promise<AcousticPurificationOutput> {
  return acousticPurificationFlow(input);
}

const acousticPurificationPrompt = ai.definePrompt({
  name: 'acousticPurificationPrompt',
  input: {schema: AcousticPurificationInputSchema},
  output: {schema: AcousticPurificationOutputSchema},
  prompt: `You are an audio engineer specializing in removing unwanted sound artifacts from audio recordings.

You will receive an audio file and must return a new audio file with reduced sound artifacts.

Specifically, you should automatically adjust parameters to diminish sound artifacts in recordings, based on your expert knowledge of digital signal processing and pre-trained models.

Consider common audio artifacts like clipping, distortion, background noise, and pops/clicks.

Output the processed audio file as a data URI.

Audio: {{media url=audioDataUri}}

Include details about the processing performed.`,
});

const acousticPurificationFlow = ai.defineFlow(
  {
    name: 'acousticPurificationFlow',
    inputSchema: AcousticPurificationInputSchema,
    outputSchema: AcousticPurificationOutputSchema,
  },
  async input => {
    const {output} = await acousticPurificationPrompt(input);
    return output!;
  }
);
