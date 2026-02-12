'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

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
import { UNITS } from '@/lib/constants';
import type { RawMaterial } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { createMaterial, updateMaterial } from '../actions';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  shortName: z.string().min(1, { message: 'Short name is required.' }),
  category: z.string().min(2, { message: 'Category is required.' }),
  provider: z.string().optional(),
  sku: z.string().optional(),
  quantity: z.coerce.number().min(0, { message: 'Quantity must be positive.' }),
  unit: z.enum(['g', 'kg', 'oz', 'lb', 'ml', 'l', 'tsp', 'tbsp', 'cup', 'piece']),
  cost: z.coerce.number().min(0, { message: 'Cost must be positive.' }),
});

type MaterialFormValues = z.infer<typeof formSchema>;

interface MaterialFormProps {
    initialData?: RawMaterial;
    onClose: () => void;
}

export function MaterialForm({ initialData, onClose }: MaterialFormProps) {
    const { toast } = useToast();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<MaterialFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: initialData || {
            name: '',
            shortName: '',
            category: '',
            provider: '',
            sku: '',
            quantity: 0,
            unit: 'kg',
            cost: 0
        },
    });

    const onSubmit = async (data: MaterialFormValues) => {
        setIsSubmitting(true);
        try {
            if (initialData) {
                await updateMaterial(initialData.id, data);
                toast({
                    title: "Material Updated",
                    description: `The material "${data.name}" has been saved.`,
                });
            } else {
                await createMaterial(data);
                toast({
                    title: "Material Created",
                    description: `The material "${data.name}" has been saved.`,
                });
            }
            router.refresh();
            onClose();
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 pt-4">
        <ScrollArea className="h-[calc(100vh-12rem)]">
          <div className="space-y-4 p-1 pr-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                        <Input placeholder="All-Purpose Flour" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <FormControl>
                    <Input placeholder="Flour" {...field} />
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
                        <Input placeholder="Grain Co." {...field} />
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
                    <FormLabel>SKU</FormLabel>
                    <FormControl>
                        <Input placeholder="GC-APF-25KG" {...field} />
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
            <FormField
                control={form.control}
                name="cost"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Cost</FormLabel>
                    <FormControl>
                        <Input type="number" placeholder="30.00" step="0.01" {...field} />
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
