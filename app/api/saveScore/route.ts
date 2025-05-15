import { Pool } from 'pg';

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_xDMRaV7WmHp9@ep-little-water-a4lqiwmu-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require',
  ssl: {
    rejectUnauthorized: false
  }
});

export async function POST(request: Request) {
  try {
    const { player_name, score } = await request.json();
    
    // 验证数据
    if (!player_name || typeof score !== 'number') {
      throw new Error('Invalid data format');
    }

    const client = await pool.connect();
    try {
      // 检查表是否存在
      await client.query(`
        CREATE TABLE IF NOT EXISTS player_score (
          id SERIAL PRIMARY KEY,
          player_name VARCHAR(255) NOT NULL,
          score INTEGER NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // 插入数据
      const result = await client.query(
        'INSERT INTO player_score (player_name, score) VALUES ($1, $2) RETURNING *',
        [player_name, score]
      );
      
      return new Response(JSON.stringify({ 
        success: true,
        data: result.rows[0]
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Database error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message || 'Database operation failed'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}
