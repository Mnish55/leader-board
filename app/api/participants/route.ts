// app/api/participants/route.js
import { NextRequest, NextResponse } from 'next/server';
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
      // Type assertion
      if (error instanceof Error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ error: "An unknown error occurred" }, { status: 500 });
    }
  }
  

// POST /api/participants - Add a new participant
export async function POST(request: NextRequest) {
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
  
      return NextResponse.json(data?.[0] || { message: 'Participant added successfully' });
    } catch (error) {
      if (error instanceof Error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ error: 'An unknown error occurred' }, { status: 500 });
    }
  }

// app/api/participants/[id]/route.js
// PUT /api/participants/[id] - Update a participant's score
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    try {
      const { id } = params;
      const body = await request.json();
      const { score } = body;
  
      if (!id) {
        return NextResponse.json({ error: 'Participant ID is required' }, { status: 400 });
      }
  
      if (typeof score !== 'number') {
        return NextResponse.json({ error: 'Valid score is required' }, { status: 400 });
      }
  
      const { data, error } = await supabase
        .from('participants')
        .update({ score })
        .eq('id', id)
        .select();
  
      if (error) throw error;
  
      return NextResponse.json(data?.[0] || { message: 'Participant updated successfully' });
    } catch (error) {
      if (error instanceof Error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ error: 'An unknown error occurred' }, { status: 500 });
    }
  }

// DELETE /api/participants/[id] - Remove a participant
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    try {
      const { id } = params;
  
      if (!id) {
        return NextResponse.json({ error: 'Participant ID is required' }, { status: 400 });
      }
  
      const { error } = await supabase
        .from('participants')
        .delete()
        .eq('id', id);
  
      if (error) throw error;
  
      return NextResponse.json({ success: true, message: 'Participant deleted successfully' });
    } catch (error) {
      if (error instanceof Error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ error: 'An unknown error occurred' }, { status: 500 });
    }
  }