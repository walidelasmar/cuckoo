'use client';

import * as React from 'react';
import Image from 'next/image';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import * as z from 'zod';
import { useState, useRef, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ALLERGEN_ICONS, UNITS, UNIT_CATEGORIES } from '@/lib/constants';
import type { RawMaterial, Recipe } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn, calculateRecipeCost } from '@/lib/utils';
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
    unit: z.enum(['g', 'kg', 'oz', 'lb', 'ml', 'l', 'tsp', 'tbsp', 'cup', 'pc', 'portion']),
  })).min(1, 'At least one ingredient is required.'),
});

export type RecipeFormValues = z.infer<typeof recipeFormSchema>;

interface RecipeFormProps {
    initialData?: Recipe;
    rawMaterials: RawMaterial[];
  existingRecipes?: Recipe[];
    existingCategories?: string[];
    onSave: (data: RecipeFormValues) => void;
    onCancel: () => void;
}

export function RecipeForm({ initialData, rawMaterials, existingRecipes = [], existingCategories = [], onSave, onCancel }: RecipeFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const titleRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();
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

    const watchedIngredients = useWatch({ control: form.control, name: "ingredients" }) ?? [];
    const watchedPortions = useWatch({ control: form.control, name: "portions" });
    const watchedPricePerServing = useWatch({ control: form.control, name: "pricePerServing" });
    
    const rawMaterialsById = React.useMemo(() => {
        const map = new Map<string, RawMaterial>();
        rawMaterials.forEach(m => map.set(m.id, m));
        return map;
    }, [rawMaterials]);

    // Ingredient combobox state
    const [ingOpenArr, setIngOpenArr] = React.useState<boolean[]>([]);
    const [ingInputArr, setIngInputArr] = React.useState<string[]>([]);
    const [ingActiveArr, setIngActiveArr] = React.useState<number[]>([]);
    const ingWrapperRefs = React.useRef<(HTMLDivElement | null)[]>([]);

    // Returns Set of recipe IDs that cannot be used (would cause circular dependency)
    const excludedRecipeIds = React.useMemo((): Set<string> => {
        const currentId = initialData?.id;
        if (!currentId) return new Set();
        const excluded = new Set<string>([currentId]);
        const recipesById = new Map(existingRecipes.map(r => [r.id, r]));
        const collectAncestors = (targetId: string) => {
            for (const r of existingRecipes) {
                if (excluded.has(r.id)) continue;
                const deps = (rid: string): boolean => {
                    const rec = recipesById.get(rid);
                    if (!rec) return false;
                    for (const ing of rec.ingredients) {
                        if (ing.rawMaterial.id === targetId) return true;
                        if (recipesById.has(ing.rawMaterial.id) && deps(ing.rawMaterial.id)) return true;
                    }
                    return false;
                };
                if (deps(r.id)) { excluded.add(r.id); collectAncestors(r.id); }
            }
        };
        collectAncestors(currentId);
        return excluded;
    }, [initialData?.id, existingRecipes]);

    const { totalCost, costPerPortion, chartData } = React.useMemo(() => {
        const hydratedIngredients = watchedIngredients.map(ing => ({
            ...ing,
            id: ing.id || '',
            rawMaterial: rawMaterialsById.get(ing.rawMaterialId)!
        })).filter(ing => ing.rawMaterial);
    
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

    const profitMargin = watchedPricePerServing && watchedPricePerServing > 0
        ? ((watchedPricePerServing - costPerPortion) / watchedPricePerServing) * 100
        : 0;

    const chartDataPerServing = chartData.map(d => ({ ...d, cost: d.cost / (watchedPortions || 1) }));

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
                  tabIndex={1}
                  className="w-full bg-transparent border-0 border-b-2 border-transparent hover:border-gray-200 focus:border-gray-400 focus:outline-none text-3xl font-semibold text-[#1e3a5f] placeholder:text-gray-300 transition-colors duration-150 pb-1 px-1"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <ScrollArea className="h-[calc(100vh-12rem)]">
            <div className="space-y-6 p-1 pr-6">
                <div className="space-y-4">
                         <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl>
                                    <Textarea tabIndex={2} placeholder="A short description of the recipe..." {...field} value={field.value ?? ''}/>
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="category"
                            render={({ field }) => {
                                const [catOpen, setCatOpen] = useState(false);
                                const [catActiveIdx, setCatActiveIdx] = useState(-1);
                                const catWrapperRef = useRef<HTMLDivElement>(null);
                                const filteredCats = existingCategories.filter((c) =>
                                    c.toLowerCase().includes((field.value ?? '').toLowerCase())
                                );
                                useEffect(() => {
                                    const handleCatClickOutside = (e: MouseEvent) => {
                                        if (catWrapperRef.current && !catWrapperRef.current.contains(e.target as Node)) {
                                            setCatOpen(false);
                                            setCatActiveIdx(-1);
                                        }
                                    };
                                    document.addEventListener('mousedown', handleCatClickOutside);
                                    return () => document.removeEventListener('mousedown', handleCatClickOutside);
                                }, []);
                                return (
                                <FormItem>
                                    <FormLabel>Category</FormLabel>
                                    <FormControl>
                                        <div ref={catWrapperRef} className="relative">
                                            <Input
                                                {...field}
                                                placeholder="Type or select category"
                                                onFocus={() => setCatOpen(true)}
                                                onChange={(e) => {
                                                    field.onChange(e);
                                                    setCatOpen(true);
                                                    setCatActiveIdx(-1);
                                                }}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'ArrowDown') {
                                                        e.preventDefault();
                                                        setCatOpen(true);
                                                        setCatActiveIdx((i) => Math.min(i + 1, filteredCats.length - 1));
                                                    } else if (e.key === 'ArrowUp') {
                                                        e.preventDefault();
                                                        setCatActiveIdx((i) => Math.max(i - 1, 0));
                                                    } else if (e.key === 'Enter' && catActiveIdx >= 0) {
                                                        e.preventDefault();
                                                        field.onChange(filteredCats[catActiveIdx]);
                                                        setCatOpen(false);
                                                        setCatActiveIdx(-1);
                                                    } else if (e.key === 'Escape') {
                                                        setCatOpen(false);
                                                        setCatActiveIdx(-1);
                                                    }
                                                }}
                                            />
                                            {catOpen && filteredCats.length > 0 && (
                                                <ul className="absolute z-50 mt-1 w-full rounded-md border border-input bg-popover py-1 shadow-md">
                                                    {filteredCats.map((c, i) => (
                                                        <li
                                                            key={c}
                                                            className={cn(
                                                                "cursor-pointer px-3 py-1.5 text-sm",
                                                                i === catActiveIdx
                                                                    ? "bg-accent text-accent-foreground"
                                                                    : "hover:bg-accent hover:text-accent-foreground"
                                                            )}
                                                            onMouseDown={(e) => {
                                                                e.preventDefault();
                                                                field.onChange(c);
                                                                setCatOpen(false);
                                                                setCatActiveIdx(-1);
                                                            }}
                                                        >
                                                            {c}
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                );
                            }}
                            />
                        <FormField
                            control={form.control}
                            name="portions"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Number of Servings</FormLabel>
                                    <FormControl>
                                        <Input tabIndex={4} type="number" placeholder="4" min="1" {...field} />
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
                                                tabIndex={5}
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
                                        render={({ field }) => {
                                            const ingItems = [
                                                ...rawMaterials.map(m => ({ id: m.id, label: m.shortName, type: 'material' as const, unit: m.unit })),
                                                ...existingRecipes.filter(r => !excludedRecipeIds.has(r.id)).map(r => ({ id: r.id, label: r.name, type: 'recipe' as const, unit: 'portion' as const })),
                                            ];
                                            const ingInput = ingInputArr[index] ?? (field.value ? (ingItems.find(i => i.id === field.value)?.label ?? field.value) : '');
                                            const isOpen = ingOpenArr[index] ?? false;
                                            const activeIdx = ingActiveArr[index] ?? -1;
                                            const filtered = ingItems.filter(i => i.label.toLowerCase().includes(ingInput.toLowerCase()));
                                            const isValid = !field.value || ingItems.some(i => i.id === field.value);
                                            const setOpen = (v: boolean) => setIngOpenArr(a => { const n = [...a]; n[index] = v; return n; });
                                            const setActive = (v: number) => setIngActiveArr(a => { const n = [...a]; n[index] = v; return n; });
                                            const setInput = (v: string) => setIngInputArr(a => { const n = [...a]; n[index] = v; return n; });
                                            const handleSelect = (item: (typeof ingItems)[0]) => {
                                                field.onChange(item.id);
                                                setInput(item.label);
                                                setOpen(false);
                                                setActive(-1);
                                                if (item.type === 'recipe') {
                                                    form.setValue(`ingredients.${index}.unit`, 'portion');
                                                } else {
                                                    form.setValue(`ingredients.${index}.unit`, item.unit);
                                                }
                                            };
                                            return (
                                                <FormItem>
                                                    <FormLabel className="sr-only">Ingredient</FormLabel>
                                                    <FormControl>
                                                        <div
                                                            ref={el => { ingWrapperRefs.current[index] = el; }}
                                                            className="relative"
                                                            onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpen(false); }}
                                                        >
                                                            <input
                                                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                                                placeholder="Search ingredient..."
                                                                value={ingInput}
                                                                onChange={e => { setInput(e.target.value); setOpen(true); setActive(-1); if (e.target.value === '') field.onChange(''); }}
                                                                onFocus={() => { setOpen(true); }}
                                                                onKeyDown={e => {
                                                                    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(Math.min(activeIdx + 1, filtered.length - 1)); }
                                                                    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(Math.max(activeIdx - 1, 0)); }
                                                                    else if (e.key === 'Enter') { e.preventDefault(); if (activeIdx >= 0 && filtered[activeIdx]) handleSelect(filtered[activeIdx]); }
                                                                    else if (e.key === 'Escape') setOpen(false);
                                                                }}
                                                            />
                                                            {isOpen && filtered.length > 0 && (
                                                                <ul className="absolute z-50 mt-1 max-h-48 w-full overflow-auto rounded-md border bg-popover text-sm shadow-md">
                                                                    {filtered.map((item, i) => (
                                                                        <li
                                                                            key={item.id}
                                                                            className={cn('px-3 py-1.5 cursor-pointer', i === activeIdx ? 'bg-accent' : 'hover:bg-accent/50')}
                                                                            onMouseDown={e => { e.preventDefault(); handleSelect(item); }}
                                                                        >
                                                                            {item.label}{item.type === 'recipe' ? ' (recipe)' : ''}
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            )}
                                                        </div>
                                                    </FormControl>
                                                    {field.value && !isValid && <p className="text-sm text-destructive mt-1">Material not in the list!</p>}
                                                    {!field.value && <FormMessage />}
                                                </FormItem>
                                            )
                                        }}
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
                                                    <Input
                                                        type="number"
                                                        placeholder="Qty"
                                                        min="0"
                                                        step="0.01"
                                                        {...field}
                                                        onChange={event => field.onChange(event.target.value === '' ? undefined : +event.target.value)}
                                                    />
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
                                        render={({ field }) => {
                                            const currentIngId = form.watch(`ingredients.${index}.rawMaterialId`);
                                            const selectedMaterial = rawMaterials.find(m => m.id === currentIngId);
                                            const isRecipe = existingRecipes.some(r => r.id === currentIngId);
                                            const unitCat = selectedMaterial ? UNIT_CATEGORIES[selectedMaterial.unit as keyof typeof UNIT_CATEGORIES] : null;
                                            const allowedUnits = isRecipe
                                                ? UNITS.filter(u => u.value === 'portion')
                                                : unitCat === 'weight' ? UNITS.filter(u => UNIT_CATEGORIES[u.value as keyof typeof UNIT_CATEGORIES] === 'weight')
                                                : unitCat === 'volume' ? UNITS.filter(u => UNIT_CATEGORIES[u.value as keyof typeof UNIT_CATEGORIES] === 'volume')
                                                : unitCat === 'count' ? UNITS.filter(u => u.value === 'pc')
                                                : UNITS.filter(u => u.value !== 'portion');
                                            return (
                                                <FormItem>
                                                    <FormLabel className="sr-only">Unit</FormLabel>
                                                    <Select
                                                        onValueChange={field.onChange}
                                                        value={field.value}
                                                        disabled={isRecipe}
                                                    >
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Unit" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {allowedUnits.map(unit => (
                                                                <SelectItem key={unit.value} value={unit.value}>{unit.label}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )
                                        }}
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
                    </CardHeader>
                    <CardContent>
                        {detectedAllergens.length > 0 ? (
                            <div className="flex flex-wrap gap-3">
                                {detectedAllergens.map((allergen) => {
                                    const iconName = ALLERGEN_ICONS[allergen] || allergen.toLowerCase().replace(/\s+/g, '-');
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
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-start pt-2 text-sm">
                            <div className="flex flex-col">
                                <span className="font-semibold text-lg">
                                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalCost)}
                                </span>
                                <span className="text-muted-foreground">Total Cost</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <span className="font-semibold text-lg">
                                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(costPerPortion)}
                                </span>
                                <span className="text-muted-foreground">Cost / Serving</span>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="font-semibold text-lg">
                                    {profitMargin.toFixed(1)}%
                                </span>
                                <span className="text-muted-foreground">Profit Margin</span>
                            </div>
                        </div>
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
