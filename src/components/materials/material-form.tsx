'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';

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
import { UNITS, ALLERGENS, ALLERGEN_ICONS } from '@/lib/constants';
import type { RawMaterial } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { getList, MATERIAL_PROVIDERS_KEY, MATERIAL_CATEGORIES_KEY } from '@/lib/lists';

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
  categories?: string[];
    onSave: (data: MaterialFormValues) => void;
}

export function MaterialForm({ initialData, onClose, providers = [], categories = [], onSave }: MaterialFormProps) {
    const effectiveProviders = Array.from(new Set([...providers, ...getList(MATERIAL_PROVIDERS_KEY)]));
    const effectiveCategories = Array.from(new Set([...categories, ...getList(MATERIAL_CATEGORIES_KEY)]));
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const shortNameRef = useRef<HTMLInputElement>(null);
    useEffect(() => {
        if (!initialData && shortNameRef.current) {
            shortNameRef.current.focus();
        }
    }, []);

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
                        if (data.provider === '__custom_provider__') data.provider = '';
            if (data.category === '__custom_category__') data.category = '';
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 pt-4">
        <ScrollArea className="h-[calc(100vh-10rem)]">
          <div className="space-y-4 p-1 pr-6">
            
            <FormField
              control={form.control}
              name="shortName"
              render={({ field }) => (
                  <FormItem>
                  <FormControl>
                      <input
                          {...field}
                          ref={shortNameRef}
                          placeholder="Ingredient Name"
                          className="w-full bg-transparent border-0 border-b-2 border-transparent hover:border-gray-200 focus:border-gray-400 focus:outline-none text-3xl font-semibold text-[#1e3a5f] placeholder:text-gray-300 transition-colors duration-150 pb-1 px-1"
                      />
                  </FormControl>
                  <FormMessage />
                  </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                  control={form.control}
                  name="provider"
                  render={({ field }) => {
                    const [open, setOpen] = useState(false);
                    const [activeIdx, setActiveIdx] = useState(-1);
                    const wrapperRef = useRef<HTMLDivElement>(null);
                    const filtered = effectiveProviders.filter((p) =>
                      p.toLowerCase().includes((field.value ?? '').toLowerCase())
                    );
                    useEffect(() => {
                      const handleClickOutside = (e: MouseEvent) => {
                        if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
                          setOpen(false);
                          setActiveIdx(-1);
                        }
                      };
                      document.addEventListener('mousedown', handleClickOutside);
                      return () => document.removeEventListener('mousedown', handleClickOutside);
                    }, []);
                    return (
                      <FormItem>
                        <FormLabel>Provider</FormLabel>
                        <FormControl>
                          <div ref={wrapperRef} className="relative">
                            <Input
                              placeholder="e.g. Grain Co."
                              {...field}
                              autoComplete="off"
                              onFocus={() => setOpen(true)}
                              onChange={(e) => {
                                field.onChange(e);
                                setOpen(true);
                                setActiveIdx(-1);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'ArrowDown') {
                                  e.preventDefault();
                                  setOpen(true);
                                  setActiveIdx((i) => Math.min(i + 1, filtered.length - 1));
                                } else if (e.key === 'ArrowUp') {
                                  e.preventDefault();
                                  setActiveIdx((i) => Math.max(i - 1, 0));
                                } else if (e.key === 'Enter' && activeIdx >= 0) {
                                  e.preventDefault();
                                  field.onChange(filtered[activeIdx]);
                                  setOpen(false);
                                  setActiveIdx(-1);
                                } else if (e.key === 'Escape') {
                                  setOpen(false);
                                  setActiveIdx(-1);
                                }
                              }}
                            />
                            {open && filtered.length > 0 && (
                              <ul className="absolute z-50 mt-1 w-full rounded-md border border-input bg-popover py-1 shadow-md">
                                {filtered.map((p, i) => (
                                  <li
                                    key={p}
                                    className={cn(
                                      "cursor-pointer px-3 py-1.5 text-sm",
                                      i === activeIdx
                                        ? "bg-accent text-accent-foreground"
                                        : "hover:bg-accent hover:text-accent-foreground"
                                    )}
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      field.onChange(p);
                                      setOpen(false);
                                      setActiveIdx(-1);
                                    }}
                                  >
                                    {p}
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
                    name="category"
                    render={({ field }) => {
                      const [catOpen, setCatOpen] = useState(false);
                      const [catActiveIdx, setCatActiveIdx] = useState(-1);
                      const catWrapperRef = useRef<HTMLDivElement>(null);
                      const filteredCats = effectiveCategories.filter((c) =>
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
                            <Input
                                type="number"
                                placeholder="25"
                                step="0.25"
                                {...field}
                                onChange={event => field.onChange(event.target.value === '' ? '' : +event.target.value)}
                                onKeyDown={e => {
                                    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                                        e.preventDefault();
                                        const inp = e.currentTarget as HTMLInputElement;
                                        const cur = parseFloat(inp.value) || 0;
                                        const dir = e.key === 'ArrowUp' ? 1 : -1;
                                        const next = Math.max(0, cur + dir * 0.25);
                                        const rounded = Math.round(next / 0.25) * 0.25;
                                        field.onChange(parseFloat(rounded.toFixed(2)));
                                    }
                                }}
                            />
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
                        const iconName = ALLERGEN_ICONS[allergen] ?? allergen.toLowerCase();
                        const iconSrc = isSelected
                          ? `/allergens/${iconName}.png`
                          : `/allergens/${iconName}_off.png`;
                        return (
                          <div
                            key={allergen}
                            className="flex flex-col items-center gap-1"
                          >
                            <button
                              type="button"
                              title={allergen}
                              className={cn(
                                'rounded-full transition-all duration-150 focus:outline-none',
                                isSelected
                                  ? 'opacity-100 ring-2 ring-offset-1 ring-gray-400'
                                  : 'opacity-50 hover:opacity-75'
                              )}
                              onClick={() => {
                                const currentAllergens = field.value || [];
                                if (isSelected) {
                                  field.onChange(currentAllergens.filter((a) => a !== allergen));
                                } else {
                                  field.onChange([...currentAllergens, allergen]);
                                }
                              }}
                            >
                              <Image
                                src={iconSrc}
                                alt={allergen}
                                width={48}
                                height={48}
                                className="rounded-full"
                              />
                            </button>
                            <span className="text-xs text-center text-gray-500 w-14 leading-tight">{allergen}</span>
                          </div>
                        );
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
