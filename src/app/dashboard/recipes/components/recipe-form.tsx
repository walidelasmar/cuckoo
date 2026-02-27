'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray } from 'react-hook-form';
import * as z from 'zod';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

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
import { UNITS } from '@/lib/constants';
import type { RawMaterial, Recipe } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const recipeFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  category: z.string().optional(),
  description: z.string().optional(),
  portions: z.coerce.number().min(1, 'Portions must be at least 1'),
  ingredients: z.array(z.object({
    id: z.string().optional(),
    rawMaterialId: z.string().min(1, 'Ingredient is required'),
    quantity: z.coerce.number().min(0.0001, 'Quantity must be positive'),
    unit: z.enum(['g', 'kg', 'oz', 'lb', 'ml', 'l', 'tsp', 'tbsp', 'cup', 'pc']),
  })).min(1, 'At least one ingredient is required.'),
});

type RecipeFormValues = z.infer<typeof recipeFormSchema>;

interface RecipeFormProps {
    initialData?: Recipe;
    rawMaterials: RawMaterial[];
    onSave: (data: RecipeFormValues) => void;
    onCancel: () => void;
}

export function RecipeForm({ initialData, rawMaterials, onSave, onCancel }: RecipeFormProps) {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<RecipeFormValues>({
        resolver: zodResolver(recipeFormSchema),
        defaultValues: initialData ? {
            ...initialData,
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
            ingredients: []
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "ingredients"
    });

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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 gap-8">
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Recipe Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Recipe Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g. Classic Pancakes" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="category"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Category</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. Breakfast" {...field} />
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
                                    <FormLabel>Portions</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="4" {...field} />
                                    </FormControl>
                                    <FormDescription>
                                        How many servings does this recipe make?
                                    </FormDescription>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                         <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl>
                                    <Textarea placeholder="A short description of the recipe..." {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>
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
                                                <Input type="number" placeholder="Qty" {...field} />
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
            </div>
        </div>
        <div className="flex justify-end gap-2">
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
