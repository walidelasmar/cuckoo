'use client';

import * as React from 'react';
import Image from 'next/image';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray } from 'react-hook-form';
import * as z from 'zod';
import { useState, useRef, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ALLERGEN_ICONS, UNITS } from '@/lib/constants';
import type { RawMaterial, Recipe } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { calculateRecipeCost, cn } from '@/lib/utils';
import { CostBreakdownChart } from './cost-breakdown-chart';

const recipeFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  category: z.string().optional(),
  portions: z.coerce.number().min(1, 'Number of Servings must be at least 1'),
  pricePerServing: z.coerce.number().min(0, 'Price must be positive.').optional(),
  ingredients: z.array(z.object({
    id: z.string().optional(),
    rawMaterialId: z.string().min(1, 'Ingredient is required'),
    quantity: z.coerce.number().min(0.0001, 'Quantity must be positive'),
    unit: z.enum(['g', 'kg', 'oz', 'lb', 'ml', 'l', 'tsp', 'tbsp', 'cup', 'pc']),
  })).min(1, 'At least one ingredient is required.'),
});

export type RecipeFormValues = z.infer<typeof recipeFormSchema>;

interface RecipeFormProps {
    initialData?: Recipe;
    rawMaterials: RawMaterial[];
    existingCategories?: string[];
    onSave: (data: RecipeFormValues) => void;
    onCancel: () => void;
}

export function RecipeForm({ initialData, rawMaterials, existingCategories = [], onSave, onCancel }: RecipeFormProps) {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const titleRef = useRef<HTMLInputElement>(null);
    useEffect(() => {
        if (!initialData && titleRef.current) {
            titleRef.current.focus();
        }
    }, []);

    const form = useForm<RecipeFormValues>({
        resolver: zodResolver(recipeFormSchema),
        defaultValues: initialData ? {
            ...initialData,
            pricePerServing: initialData.pricePerServing,
            ingredients: initialData.ingredients.map(i => ({
                id: i.id,
                rawMaterialId: i.rawMaterial.id,
                quantity: i.quantity,
                unit: i.unit,
            }))
        } : {
            name: '',
            category: '',
            description: '',
            portions: 1,
            pricePerServing: 0.00,
            ingredients: []
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "ingredients"
    });

    const watchedIngredients = form.watch('ingredients');
    const watchedPortions = form.watch('portions');
    const watchedPricePerServing = form.watch('pricePerServing');

    const rawMaterialsById = React.useMemo(() => new Map(rawMaterials.map(m => [m.id, m])), [rawMaterials]);
    
    const { totalCost, costPerPortion, chartData } = React.useMemo(() => {
        const hydratedIngredients = watchedIngredients.map(ing => ({
            ...ing,
            id: ing.id || '',
            rawMaterial: rawMaterialsById.get(ing.rawMaterialId)!
        })).filter(i => i.rawMaterial);
    
        const recipeForCosting: Recipe = {
            id: initialData?.id || '',
            name: form.getValues('name'),
            category: form.getValues('category') || '',
            description: form.getValues('description') || '',
            portions: watchedPortions,
            ingredients: hydratedIngredients,
        };
        
        const { totalCost, costPerPortion } = calculateRecipeCost(recipeForCosting);
        
        const chartData = hydratedIngredients.map(ingredient => {
            const { totalCost: ingredientCost } = calculateRecipeCost({
                id: '',
                name: '',
                category: '',
                description: '',
                portions: 1,
                ingredients: [ingredient]
            });
            return { name: ingredient.rawMaterial.shortName, cost: ingredientCost };
        });
    
        return { totalCost, costPerPortion, chartData };
    }, [watchedIngredients, watchedPortions, rawMaterialsById, initialData?.id, form]);

    const profitMargin = (watchedPricePerServing && watchedPricePerServing > 0 && costPerPortion > 0)
        ? ((watchedPricePerServing - costPerPortion) / watchedPricePerServing) * 100
        : 0;

    const portionsForChart = watchedPortions > 0 ? watchedPortions : 1;
    const chartDataPerServing = chartData.map(d => ({ ...d, cost: d.cost / portionsForChart }));

    const detectedAllergens = React.useMemo(() => {
        const allergenSet = new Set<string>();
        watchedIngredients.forEach(ing => {
            const material = rawMaterialsById.get(ing.rawMaterialId);
            if (material && material.allergens) {
                material.allergens.forEach(allergen => {
                    allergenSet.add(allergen);
                });
            }
        });
        return Array.from(allergenSet).sort();
    }, [watchedIngredients, rawMaterialsById]);

    const onSubmit = async (data: RecipeFormValues) => {
        setIsSubmitting(true);
        try {
            onSave(data);
            toast({
                title: initialData ? "Recipe Updated" : "Recipe Created",
                description: `The recipe "${data.name}" has been saved.`,
            });
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Uh oh! Something went wrong.',
                description: 'There was a problem with your request.',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 pt-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <input
                  {...field}
                  ref={titleRef}
                  placeholder="Untitled Recipe"
                  className="w-full bg-transparent border-0 border-b-2 border-transparent hover:border-gray-200 focus:border-gray-400 focus:outline-none text-3xl font-semibold text-[#1e3a5f] placeholder:text-gray-300 transition-colors duration-150 pb-1 px-1"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <ScrollArea className="h-[calc(100vh-16rem)]">
            <div className="space-y-6 p-1 pr-6">
                <div className="space-y-4">
                         <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl>
                                    <Textarea placeholder="A short description of the recipe..." {...field} value={field.value ?? ''}/>
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="category"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Category</FormLabel>
                                <FormControl>
                                    <>
                                        <Input
                                            placeholder="e.g. Breakfast"
                                            list="category-options"
                                            {...field}
                                            value={field.value ?? ''}
                                        />
                                        <datalist id="category-options">
                                            {existingCategories.map((cat) => (
                                                <option key={cat} value={cat} />
                                            ))}
                                        </datalist>
                                    </>
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="portions"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Number of Servings</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="4" min="1" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="pricePerServing"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Price per Serving</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                                <span className="text-muted-foreground sm:text-sm">$</span>
                                            </div>
                                            <Input
                                                type="number"
                                                placeholder="0.00"
                                                step="0.01"
                                                {...field}
                                                onChange={event => field.onChange(event.target.value === '' ? undefined : +event.target.value)}
                                                className="pl-7"
                                            />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                </div>
                 <Card>
                    <CardHeader>
                        <CardTitle>Ingredients</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         {fields.map((field, index) => (
                            <div key={field.id} className="grid grid-cols-12 gap-x-4 gap-y-2 items-start p-3 border rounded-lg relative">
                                <div className="col-span-12 md:col-span-5">
                                    <FormField
                                        control={form.control}
                                        name={`ingredients.${index}.rawMaterialId`}
                                        render={({ field }) => (
                                            <FormItem>
                                            <FormLabel className="sr-only">Ingredient</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select an ingredient" />
                                                </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {rawMaterials.map(material => (
                                                        <SelectItem key={material.id} value={material.id}>{material.shortName} ({material.name})</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                 <div className="col-span-6 md:col-span-3">
                                    <FormField
                                        control={form.control}
                                        name={`ingredients.${index}.quantity`}
                                        render={({ field }) => (
                                            <FormItem>
                                            <FormLabel className="sr-only">Quantity</FormLabel>
                                            <FormControl>
                                                <Input type="number" placeholder="Qty" min="0" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                 <div className="col-span-6 md:col-span-3">
                                    <FormField
                                        control={form.control}
                                        name={`ingredients.${index}.unit`}
                                        render={({ field }) => (
                                            <FormItem>
                                            <FormLabel className="sr-only">Unit</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Unit" />
                                                    </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {UNITS.map(unit => (
                                                            <SelectItem key={unit.value} value={unit.value}>{unit.label}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="col-span-12 md:col-span-1 flex items-center justify-end">
                                     <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="text-destructive hover:text-destructive"
                                        onClick={() => remove(index)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="gap-1"
                            onClick={() => append({ rawMaterialId: '', quantity: 0, unit: 'g' })}
                        >
                            <PlusCircle className="h-4 w-4" />
                            Add Ingredient
                        </Button>
                        <FormMessage>{form.formState.errors.ingredients?.message}</FormMessage>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Allergens</CardTitle>
                        <CardDescription>
                            Allergens present in this recipe based on its ingredients.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {detectedAllergens.length > 0 ? (
                            <div className="flex flex-wrap gap-3">
                                {detectedAllergens.map((allergen) => {
                                    const iconName = ALLERGEN_ICONS[allergen] || allergen.toLowerCase();
                                    return (
                                        <div
                                            key={allergen}
                                            className="flex flex-col items-center gap-1"
                                        >
                                            <Image
                                                src={`/allergens/${iconName}.png`}
                                                alt={allergen}
                                                width={48}
                                                height={48}
                                                className="rounded-full"
                                            />
                                            <span className="text-xs text-center text-gray-500 w-14 leading-tight">{allergen}</span>
                                        </div>
                                    )
                                })}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                No allergens detected from the current ingredients.
                            </p>
                        )}
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Economics</CardTitle>
                        <CardDescription>Analyze the cost and profitability of your recipe.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <FormItem>
                            <FormLabel>Total Cost</FormLabel>
                            <FormControl>
                                <Input
                                    type="text"
                                    value={new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalCost)}
                                    disabled
                                    className="disabled:opacity-100 disabled:cursor-default"
                                />
                            </FormControl>
                        </FormItem>
                        <FormItem>
                            <FormLabel>Cost per Serving</FormLabel>
                            <FormControl>
                                <Input
                                    type="text"
                                    value={new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(costPerPortion)}
                                    disabled
                                    className="disabled:opacity-100 disabled:cursor-default"
                                />
                            </FormControl>
                        </FormItem>
                        <FormItem>
                            <FormLabel>Profit Margin</FormLabel>
                            <FormControl>
                                <Input
                                    type="text"
                                    value={`${profitMargin.toFixed(2)}%`}
                                    disabled
                                    className="disabled:opacity-100 disabled:cursor-default"
                                />
                            </FormControl>
                        </FormItem>
                        <div className="pt-4">
                            <FormLabel>Cost Breakdown</FormLabel>
                            <CostBreakdownChart data={chartDataPerServing} />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </ScrollArea>
        <div className="flex justify-end gap-2 pr-4">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Recipe'}
            </Button>
        </div>
      </form>
    </Form>
  );
}
