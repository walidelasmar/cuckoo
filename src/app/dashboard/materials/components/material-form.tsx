'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useState } from 'react';

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
import { UNITS, ALLERGENS, ALLERGEN_THEMES } from '@/lib/constants';
import type { RawMaterial } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const formSchema = z.object({
  name: z.string().optional(),
  shortName: z.string().min(1, { message: 'Short name is required.' }),
  category: z.string().optional(),
  provider: z.string().optional(),
  sku: z.string().optional(),
  quantity: z.coerce.number().min(0, { message: 'Quantity must be positive.' }),
  unit: z.enum(['g', 'kg', 'oz', 'lb', 'ml', 'l', 'tsp', 'tbsp', 'cup', 'pc']),
  cost: z.coerce.number().min(0, { message: 'Cost must be positive.' }),
  allergens: z.array(z.string()).optional(),
});

type MaterialFormValues = z.infer<typeof formSchema>;

interface MaterialFormProps {
    initialData?: Omit<RawMaterial, 'id'>;
    onClose: () => void;
    providers?: string[];
    onSave: (data: MaterialFormValues) => void;
}

export function MaterialForm({ initialData, onClose, providers = [], onSave }: MaterialFormProps) {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<z.input<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: initialData ? {
            ...initialData,
            provider: initialData.provider ?? '',
            category: initialData.category ?? '',
            name: initialData.name ?? '',
            sku: initialData.sku ?? '',
            cost: initialData.cost.toFixed(2),
            allergens: initialData.allergens ?? [],
        } : {
            name: '',
            shortName: '',
            category: '',
            provider: '',
            sku: '',
            quantity: 0,
            unit: 'pc',
            cost: '0.00',
            allergens: [],
        },
    });

    const quantity = form.watch('quantity');
    const unit = form.watch('unit');
    const costValue = form.watch('cost');
    const cost = typeof costValue === 'string' ? parseFloat(costValue) : (costValue ?? 0);
    const costPerUnit = (quantity > 0) ? (cost / quantity) : 0;
    const formattedCostPerUnit = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(costPerUnit);

    const onSubmit = async (data: MaterialFormValues) => {
        setIsSubmitting(true);
        try {
            onSave(data);
            if (initialData) {
                 toast({
                    title: "Material Updated",
                    description: `The material "${data.shortName}" has been saved.`,
                });
            } else {
                toast({
                    title: "Material Created",
                    description: `The material "${data.shortName}" has been saved.`,
                });
            }
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Uh oh! Something went wrong.',
                description: 'There was a problem with your request.',
            });
        } finally {
            setIsSubmitting(false);
            onClose();
        }
    };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 pt-4">
        <ScrollArea className="h-[calc(100vh-12rem)]">
          <div className="space-y-4 p-1 pr-6">
            
            <FormField
              control={form.control}
              name="shortName"
              render={({ field }) => (
                  <FormItem>
                  <FormLabel>Short Name (Unique)</FormLabel>
                  <FormControl>
                      <Input placeholder="APF" {...field} />
                  </FormControl>
                  <FormMessage />
                  </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="provider"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Provider</FormLabel>
                    <FormControl>
                        <>
                         <Input placeholder="Grain Co." {...field} list="provider-list" value={field.value ?? ''} />
                         <datalist id="provider-list">
                            {providers.map(p => <option key={p} value={p} />)}
                         </datalist>
                        </>
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
                            <Input placeholder="Flour" {...field} value={field.value ?? ''}/>
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>SKU Name</FormLabel>
                    <FormControl>
                        <Input placeholder="All-Purpose Flour" {...field} value={field.value ?? ''}/>
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="sku"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>SKU Ref.</FormLabel>
                    <FormControl>
                        <Input placeholder="GC-APF-25KG" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <FormField
                    control={form.control}
                    name="quantity"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Quantity</FormLabel>
                        <FormControl>
                            <Input type="number" placeholder="25" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Unit</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a unit" />
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="cost"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Cost</FormLabel>
                            <FormControl>
                                <div className="relative">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                        <span className="text-muted-foreground sm:text-sm">$</span>
                                    </div>
                                    <Input
                                        type="text"
                                        inputMode="decimal"
                                        placeholder="0.00"
                                        {...field}
                                        onBlur={(e) => {
                                            const value = parseFloat(e.target.value);
                                            if (!isNaN(value)) {
                                                field.onChange(value.toFixed(2));
                                            } else {
                                                field.onChange('0.00');
                                            }
                                            field.onBlur();
                                        }}
                                        className="pl-7"
                                    />
                                </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormItem>
                    <FormLabel>Unit Cost</FormLabel>
                    <FormControl>
                        <Input
                            type="text"
                            value={quantity > 0 ? `${formattedCostPerUnit}/${unit}` : formattedCostPerUnit}
                            disabled
                            className="disabled:opacity-100 disabled:cursor-default"
                        />
                    </FormControl>
                </FormItem>
            </div>
            <FormField
              control={form.control}
              name="allergens"
              render={({ field }) => (
                  <FormItem>
                      <FormLabel>Allergens</FormLabel>
                      <FormControl>
                          <div className="flex flex-wrap gap-2">
                              {ALLERGENS.map((allergen) => {
                                  const isSelected = field.value?.includes(allergen);
                                  const theme = ALLERGEN_THEMES[allergen];
                                  return (
                                      <Button
                                          key={allergen}
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          style={{
                                            '--allergen-bg-color': `hsl(var(--allergen-${theme}-bg))`,
                                            '--allergen-fg-color': `hsl(var(--allergen-${theme}-fg))`,
                                            '--allergen-border-color': `hsl(var(--allergen-${theme}-border))`,
                                          } as React.CSSProperties}
                                          className={cn(
                                            'rounded-full h-8 px-3 border',
                                            isSelected 
                                                ? `bg-[--allergen-bg-color] text-[--allergen-fg-color] border-[--allergen-border-color] hover:bg-[--allergen-bg-color] hover:border-[--allergen-border-color]`
                                                : 'border-[hsl(var(--muted-foreground))] text-muted-foreground'
                                          )}
                                          onClick={() => {
                                              const currentAllergens = field.value || [];
                                              if (isSelected) {
                                                  field.onChange(currentAllergens.filter(a => a !== allergen));
                                              } else {
                                                  field.onChange([...currentAllergens, allergen]);
                                              }
                                          }}
                                      >
                                          {allergen}
                                      </Button>
                                  )
                              })}
                          </div>
                      </FormControl>
                      <FormMessage />
                  </FormItem>
              )}
            />
          </div>
        </ScrollArea>
        <div className="flex justify-end gap-2 pr-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save'}
            </Button>
        </div>
      </form>
    </Form>
  );
}
