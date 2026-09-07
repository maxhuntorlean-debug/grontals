import { z } from "zod";

const specSchema = z.object({
	name: z.string().min(1).max(200),
	value: z.string().min(1).max(500),
	sortOrder: z.number().int().default(0),
});

export const productBaseSchema = z.object({
	name: z.string().min(1).max(200),
	slug: z
		.string()
		.min(1)
		.max(200)
		.regex(/^[a-z0-9-]+$/)
		.optional(),
	sku: z.string().max(100).nullable().optional(),
	price: z.number().int().positive(),
	oldPrice: z.number().int().positive().nullable().optional(),
	shortDescription: z.string().max(500).nullable().optional(),
	description: z.string().max(10000).nullable().optional(),
	brand: z.string().max(200).nullable().optional(),
	manufacturer: z.string().max(200).nullable().optional(),
	pieceCount: z.number().int().positive().nullable().optional(),
	age: z.string().max(50).nullable().optional(),
	modelSize: z.string().max(100).nullable().optional(),
	material: z.string().max(200).nullable().optional(),
	inStock: z.boolean().default(true),
	isActive: z.boolean().default(true),
	sortOrder: z.number().int().default(0),
	seoTitle: z.string().max(200).nullable().optional(),
	seoDescription: z.string().max(300).nullable().optional(),
	specs: z.array(specSchema).max(50).optional(),
});

export const productCreateSchema = productBaseSchema;
export const productUpdateSchema = productBaseSchema.partial();

export type ProductCreateInput = z.infer<typeof productCreateSchema>;
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;

export const imageUpdateSchema = z.object({
	altText: z.string().max(300).nullable().optional(),
	sortOrder: z.number().int().optional(),
});
