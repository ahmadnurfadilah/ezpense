import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from '@/lib/supabase/server';

// Allow streaming responses up to 60 seconds
export const maxDuration = 60;

const ReceiptSchema = z.object({
  store: z.string().nullable().optional(),
  date: z.string().nullable().optional().describe('The date of the purchase, default to today'),
  items: z.array(z.object({
    name: z.string(),
    quantity: z.number(),
    price: z.number(),
    total: z.number()
  })),
  subtotal: z.number(),
  discount: z.number().nullable(),
  tax: z.number().nullable(),
  total: z.number(),
});

export async function POST(request: NextRequest) {
  let receiptId: string | null = null;

  try {
    const supabase = await createClient();

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { receiptId: reqReceiptId, imageUrl } = await request.json();
    receiptId = reqReceiptId;

    if (!receiptId || !imageUrl) {
      return NextResponse.json({
        error: 'Receipt ID and image URL are required'
      }, { status: 400 });
    }

    // Update receipt status to processing
    await supabase
      .from('receipts')
      .update({ processing_status: 'processing' })
      .eq('id', receiptId)
      .eq('user_id', user.id);

    // Process the image with AI
    const result = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: ReceiptSchema,
      system: `You are an intelligent assistant specialized in receipt processing. When user upload an image of a shopping receipt, please:
1. Analyze the receipt image carefully
2. Extract all relevant information including:
   - Store name
   - Date of purchase
   - Individual items purchased with their prices
   - Subtotal
   - Discount amount (if present)
   - Tax amount (if present)
   - Total amount
3. Convert this information into a structured JSON format with appropriate fields
4. For all monetary values:
   - Remove any currency symbols (like Rp, $, €, etc.)
   - Remove any thousand separators (commas, dots, or spaces depending on locale)
   - Convert all amounts to plain numeric values without formatting
   - Examples:
     * "Rp5.600" → 5600
     * "$5,200" → 5200
     * "€3.450,99" → 345099
4. If any information is unclear or unreadable in the image, indicate this in your response
5. Return the complete JSON representation of the receipt data
This will help me process receipt information programmatically. Please maintain accuracy in the extracted data.

The date should be in the format YYYY-MM-DD.
Current date is ${new Date().toISOString().split('T')[0]}.`,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Please analyze the following receipt image and extract the information.",
            },
            {
              type: "image",
              image: imageUrl,
            },
          ],
        },
      ],
    });

    // Get the first category for now (we can improve this later with AI categorization)
    const { data: categories } = await supabase
      .from('categories')
      .select('id')
      .limit(1);

    const categoryId = categories?.[0]?.id;

    // Create expense record
    const { data: expenseData, error: expenseError } = await supabase
      .from('expenses')
      .insert({
        user_id: user.id,
        vendor: result.object.store,
        amount: result.object.total,
        category_id: categoryId,
        date: result.object.date,
        receipt_url: imageUrl,
        status: 'pending',
        confidence_score: 0.85, // We can calculate this based on AI response quality
        extracted_data: result.object
      })
      .select()
      .single();

    if (expenseError) {
      console.error('Expense creation error:', expenseError);
      // Update receipt status to error
      await supabase
        .from('receipts')
        .update({
          processing_status: 'error',
          extracted_data: { error: 'Failed to create expense record' }
        })
        .eq('id', receiptId)
        .eq('user_id', user.id);

      return NextResponse.json({
        error: 'Failed to create expense record'
      }, { status: 500 });
    }

    // Update receipt record with processing results
    const { error: receiptUpdateError } = await supabase
      .from('receipts')
      .update({
        processing_status: 'completed',
        expense_id: expenseData.id,
        extracted_data: result.object
      })
      .eq('id', receiptId)
      .eq('user_id', user.id);

    if (receiptUpdateError) {
      console.error('Receipt update error:', receiptUpdateError);
    }

    return NextResponse.json({
      success: true,
      data: {
        expense: expenseData,
        extractedData: result.object
      }
    });

  } catch (error) {
    console.error("Error processing receipt:", error);

    // Try to update receipt status to error if we have the receiptId
    if (receiptId) {
      try {
        const supabase = await createClient();
        await supabase
          .from('receipts')
          .update({
            processing_status: 'error',
            extracted_data: { error: 'AI processing failed' }
          })
          .eq('id', receiptId);
      } catch (updateError) {
        console.error('Failed to update receipt status:', updateError);
      }
    }

    return NextResponse.json({
      success: false,
      error: "Failed to process receipt image"
    }, { status: 500 });
  }
}
