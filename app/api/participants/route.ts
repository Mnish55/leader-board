// app/api/participants/route.js
import { NextResponse } from 'next/server';
import supabase from '@/lib/db';

// GET /api/participants - Get all participants sorted by score
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('participants')
      .select('*')
      .order('score', { ascending: false });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/participants - Add a new participant
export async function POST(request) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Participant name is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('participants')
      .insert([{ name, score: 0 }])
      .select();

    if (error) throw error;

    return NextResponse.json(data[0]);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// app/api/participants/[id]/route.js
// PUT /api/participants/[id] - Update a participant's score
export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { score } = body;

    const { data, error } = await supabase
      .from('participants')
      .update({ score })
      .eq('id', id)
      .select();

    if (error) throw error;

    return NextResponse.json(data[0]);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/participants/[id] - Remove a participant
export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    const { error } = await supabase
      .from('participants')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}