'use server';
/**
 * @fileOverview This file defines a Genkit flow for an AI unit conversion assistant.
 *
 * - aiUnitConversionAssistant - A function that suggests compatible measurement units and relevant culinary conversions for recipe ingredients.
 * - AIUnitConversionAssistantInput - The input type for the aiUnitConversionAssistant function.
 * - AIUnitConversionAssistantOutput - The return type for the aiUnitConversionAssistant function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AIUnitConversionAssistantInputSchema = z.object({
  rawMaterialUnit: z
    .string()
    .describe('The base unit of the raw material (e.g., "grams", "liters").'),
  currentIngredientUnit: z
    .string()
    .describe(
      'The unit currently selected or entered by the user for the ingredient (e.g., "cups", "ml").'
    ),
  ingredientName: z
    .string()
    .describe('The name of the ingredient (e.g., "flour", "water").'),
});
export type AIUnitConversionAssistantInput = z.infer<
  typeof AIUnitConversionAssistantInputSchema
>;

const AIUnitConversionAssistantOutputSchema = z.object({
  compatible: z
    .boolean()
    .describe(
      'True if the currentIngredientUnit is compatible with the rawMaterialUnit (e.g., both are volumetric or both are weight based).'
    ),
  compatibilityMessage: z
    .string()
    .describe(
      'A message explaining the compatibility or incompatibility between the units.'
    ),
  suggestedUnits: z
    .array(z.string())
    .describe(
      'A list of 5-10 common and compatible culinary units for the given raw material and ingredient.'
    ),
  culinaryConversionTips: z
    .string()
    .describe(
      'Relevant culinary conversion tips and common equivalencies, especially for the raw material unit and ingredient name.'
    ),
});
export type AIUnitConversionAssistantOutput = z.infer<
  typeof AIUnitConversionAssistantOutputSchema
>;

export async function aiUnitConversionAssistant(
  input: AIUnitConversionAssistantInput
): Promise<AIUnitConversionAssistantOutput> {
  return aiUnitConversionAssistantFlow(input);
}

const aiUnitConversionAssistantPrompt = ai.definePrompt({
  name: 'aiUnitConversionAssistantPrompt',
  input: {schema: AIUnitConversionAssistantInputSchema},
  output: {schema: AIUnitConversionAssistantOutputSchema},
  prompt: `You are an intelligent culinary unit conversion assistant for recipe creators.
Your task is to help users select appropriate and compatible units for recipe ingredients based on the raw material's base unit, and provide useful conversion tips.

Raw Material Base Unit: {{{rawMaterialUnit}}}
Current Ingredient Unit: {{{currentIngredientUnit}}}
Ingredient Name: {{{ingredientName}}}

Based on the above information, please provide:
1. Whether the 'Current Ingredient Unit' is compatible with the 'Raw Material Base Unit' (e.g., both are weight, both are volume, or one is count and the other is not applicable).
2. A clear message explaining this compatibility or incompatibility.
3. A list of 5-10 common and widely accepted culinary units that are compatible with the 'Raw Material Base Unit' for the specific 'Ingredient Name'. If the ingredient is typically measured by count, suggest count units.
4. Practical culinary conversion tips and common equivalencies related to the 'Raw Material Base Unit' and 'Ingredient Name'. Be concise but informative.

Make sure your output strictly adheres to the JSON schema provided.`,
});

const aiUnitConversionAssistantFlow = ai.defineFlow(
  {
    name: 'aiUnitConversionAssistantFlow',
    inputSchema: AIUnitConversionAssistantInputSchema,
    outputSchema: AIUnitConversionAssistantOutputSchema,
  },
  async input => {
    const {output} = await aiUnitConversionAssistantPrompt(input);
    if (!output) {
      throw new Error('Failed to get output from AI unit conversion assistant.');
    }
    return output;
  }
);
