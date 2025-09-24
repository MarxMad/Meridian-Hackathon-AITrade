import { NextRequest, NextResponse } from 'next/server';

// Estado persistente de posiciones (en producción usar base de datos)
let userPositions: { [key: string]: any[] } = {};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        message: 'userId is required'
      }, { status: 400 });
    }

    const positions = userPositions[userId] || [];
    
    return NextResponse.json({
      success: true,
      data: {
        positions: positions
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo posiciones:', error);
    return NextResponse.json({
      success: false,
      message: 'Error obteniendo posiciones'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, action, position } = body;

    if (!userId || !action) {
      return NextResponse.json({
        success: false,
        message: 'userId and action are required'
      }, { status: 400 });
    }

    if (!userPositions[userId]) {
      userPositions[userId] = [];
    }

    switch (action) {
      case 'add':
        if (!position) {
          return NextResponse.json({
            success: false,
            message: 'position is required for add action'
          }, { status: 400 });
        }
        
        // Generar ID único para la posición
        const newPosition = {
          ...position,
          id: `pos_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date().toISOString()
        };
        
        userPositions[userId].push(newPosition);
        console.log(`✅ Posición agregada para usuario ${userId}:`, newPosition.id);
        break;
        
      case 'remove':
        if (!position?.id) {
          return NextResponse.json({
            success: false,
            message: 'position.id is required for remove action'
          }, { status: 400 });
        }
        
        userPositions[userId] = userPositions[userId].filter(p => p.id !== position.id);
        console.log(`✅ Posición removida para usuario ${userId}:`, position.id);
        break;
        
      case 'update':
        if (!position?.id) {
          return NextResponse.json({
            success: false,
            message: 'position.id is required for update action'
          }, { status: 400 });
        }
        
        const index = userPositions[userId].findIndex(p => p.id === position.id);
        if (index !== -1) {
          userPositions[userId][index] = { ...userPositions[userId][index], ...position };
          console.log(`✅ Posición actualizada para usuario ${userId}:`, position.id);
        }
        break;
        
      default:
        return NextResponse.json({
          success: false,
          message: 'Invalid action. Use: add, remove, update'
        }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `Position ${action} successful`,
      data: {
        positions: userPositions[userId]
      }
    });

  } catch (error) {
    console.error('❌ Error manejando posiciones:', error);
    return NextResponse.json({
      success: false,
      message: 'Error manejando posiciones'
    }, { status: 500 });
  }
}
